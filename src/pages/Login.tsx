import { validator } from "@felte/validator-superstruct"
import { A } from "@gazatu/solid-spectre/ui/A"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Checkbox } from "@gazatu/solid-spectre/ui/Checkbox"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Divider } from "@gazatu/solid-spectre/ui/Divider"
import { Form } from "@gazatu/solid-spectre/ui/Form"
import { Input } from "@gazatu/solid-spectre/ui/Input"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { tooltip } from "@gazatu/solid-spectre/util/tooltip"
import { useBreakpoints } from "@gazatu/solid-spectre/util/useBreakpoints"
import * as webauthn from "@simplewebauthn/browser"
import { useNavigate } from "@solidjs/router"
import { Component, createMemo, createSignal, Show } from "solid-js"
import { isServer } from "solid-js/web"
import { literal, refine, size, string, type } from "superstruct"
import fetchGraphQL, { gql } from "../lib/fetchGraphQL"
import { Mutation, PasskeyAuthentication } from "../lib/schema.gql"
import superstructIsRequired from "../lib/superstructIsRequired"
import { setStoredAuth } from "../store/auth"

const AuthenticateSchema = type({
  username: size(string(), 6, 256),
  password: size(string(), 6, 256),
})

const RegisterUserSchema = refine(
  type({
    username: size(string(), 6, 256),
    password: size(string(), 6, 256),
    password2: string(),
    __check: literal(true),
  }),
  "passwords_must_be_equal",
  ({ password, password2 }) => {
    if (password === password2) {
      return true
    }

    return {
      path: ["password2"],
      message: "Passwords must be equal",
    }
  },
)

const gqlAuthenticate = gql`
  mutation ($username: String!, $password: String!) {
    authenticate(username: $username, password: $password) {
      __typename
      ... on AuthenticationResult {
        token
        user {
          id
          username
          roles {
            name
          }
        }
      }
      ... on PasskeyAuthentication {
        userId
        options
      }
    }
  }
`

const gqlRegisterUser = gql`
  mutation ($username: String!, $password: String!) {
    createUser(username: $username, password: $password) {
      __typename
      id
    }
  }
`

const runPasskeyAuthentication = async (params: PasskeyAuthentication) => {
  return await Toaster.try(async () => {
    const options = JSON.parse(params.options)
    const response = await webauthn.startAuthentication(options)

    const { authenticateWithPasskey } = await fetchGraphQL<Mutation>({
      query: gql`
        mutation ($userId: String!, $response: String!) {
          authenticateWithPasskey(userId: $userId, response: $response) {
            token
            user {
              id
              username
              roles {
                name
              }
            }
          }
        }
      `,
      variables: {
        userId: params.userId,
        response: JSON.stringify(response),
      },
    })

    return authenticateWithPasskey
  })
}

const LoginForm: Component<{ isRegister?: boolean }> = props => {
  const navigate = useNavigate()

  const [isSubmitting, setSubmitting] = createSignal(false)

  const formSchema = props.isRegister ? RegisterUserSchema : AuthenticateSchema
  const form = Form.createContext<Record<string, unknown>>({
    extend: validator<any>({ struct: formSchema }),
    isRequired: superstructIsRequired.bind(undefined, formSchema),
    transform: v => v as any,
    onSubmit: async input => {
      setSubmitting(true)
      try {
        const res = await fetchGraphQL<Mutation>({
          query: props.isRegister ? gqlRegisterUser : gqlAuthenticate,
          variables: { ...input },
        })

        const result = props.isRegister ? res.createUser : res.authenticate
        switch (result.__typename) {
          case "AuthenticationResult":
            setStoredAuth(result)
            navigate("/")
            return "Authenticated"
          case "PasskeyAuthentication":
            setStoredAuth(await runPasskeyAuthentication(result))
            navigate("/")
            return "Authenticated"
          case "User":
            return "Registration complete (an admin will verify you shortly(tm))"
          default:
            throw new Error()
        }
      } finally {
        setSubmitting(false)
      }
    },
    onSuccess: Toaster.pushSuccess,
    onError: Toaster.pushError,
  })

  const loading = createMemo(() => {
    return isSubmitting() || isServer
  })

  const handleForgotPassword = async () => {
    await Toaster.try(async () => {
      const username = (form.data as any)("username")
      if (!username) {
        Toaster.push({
          color: "failure",
          children: "Please provide your username",
        })
        return
      }

      const { requestPasswordReset } = await fetchGraphQL<Mutation>({
        query: gql`
        mutation ($username: String!) {
          requestPasswordReset(username: $username)
        }
      `,
        variables: { username },
      })

      switch (requestPasswordReset) {
      case "NOTIFICATION_SENT":
        Toaster.push({
          color: "success",
          children: "You should receive a Notification shortly",
        })
        break
      case "WAITING_FOR_ADMIN":
        Toaster.push({
          color: "success",
          children: "An admin should grant your request shortly(tm)",
        })
        break
      }
    })
  }

  return (
    <Form context={form}>
      <h3>{props.isRegister ? "Register" : "Login"}</h3>

      <Form.Group label="Username">
        <Input type="text" name="username" />
      </Form.Group>

      <Form.Group label={(
        <span {...tooltip("sent over TLS, hashed using argon2")}>
          <span>Password </span>
          {props.isRegister && (
            <A href="https://github.com/GaZaTu/gazatu-api-graphql-sqlite/blob/0d1276d6419c92f6d04c47fe567bd99320c450fe/src/schema/misc/user.ts#L262" tabIndex={-1}>(Server)</A>
          )}
        </span>
      )} labelAsString="Password">
        <Input type="password" name="password" />
      </Form.Group>

      <Show when={props.isRegister}>
        <Form.Group label="Repeat Password">
          <Input type="password" name="password2" />
        </Form.Group>

        <Form.Group>
          <Checkbox name="__check">
            <span>I agree to sacrifice my soul and firstborn to dankman overlord pajlada</span>
          </Checkbox>
        </Form.Group>
      </Show>

      <Form.Group>
        <Button type="submit" color="primary" onclick={form.createSubmitHandler()} loading={loading()}>
          <span>{props.isRegister ? "Register" : "Login"}</span>
        </Button>

        <Show when={!props.isRegister}>
          <Button.A onclick={handleForgotPassword}>Forgot password?</Button.A>
        </Show>
      </Form.Group>
    </Form>
  )
}

const LoginView: Component = () => {
  const breakpoints = useBreakpoints()

  return (
    <Section size="xl" marginY>
      <Column.Row>
        <Column sm={12}>
          <LoginForm />
        </Column>

        <Divider label="OR" vertical={breakpoints.md} />

        <Column sm={12}>
          <LoginForm isRegister />
        </Column>
      </Column.Row>
    </Section>
  )
}

export default LoginView
