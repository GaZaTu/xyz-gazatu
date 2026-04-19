import { validator } from "@felte/validator-superstruct"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Form } from "@gazatu/solid-spectre/ui/Form"
import { Input } from "@gazatu/solid-spectre/ui/Input"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { tooltip } from "@gazatu/solid-spectre/util/tooltip"
import { Title } from "@solidjs/meta"
import { useNavigate, useSearchParams } from "@solidjs/router"
import { Component, createMemo, createSignal } from "solid-js"
import { isServer } from "solid-js/web"
import { refine, size, string, type } from "superstruct"
import fetchGraphQL, { gql } from "../lib/fetchGraphQL"
import { Mutation } from "../lib/schema.gql"
import superstructIsRequired from "../lib/superstructIsRequired"

const ResetPasswordSchema = refine(
  type({
    password: size(string(), 6, 256),
    password2: string(),
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

const gqlResetPassword = gql`
  mutation ($requestId: String!, $password: String!) {
    updatePasswordByResetRequest(requestId: $requestId, password: $password)
  }
`

const ResetPasswordView: Component = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [isSubmitting, setSubmitting] = createSignal(false)

  const formSchema = ResetPasswordSchema
  const form = Form.createContext<Record<string, unknown>>({
    transform: v => v as any,
    extend: [validator<any>({ struct: formSchema })],
    isRequired: superstructIsRequired.bind(undefined, formSchema),
    onSubmit: async input => {
      setSubmitting(true)
      try {
        await fetchGraphQL<Mutation>({
          query: gqlResetPassword,
          variables: {
            requestId: params.id,
            password: input.password,
          },
        })

        navigate("/login")

        return "Password updated"
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

  return (
    <Section size="xl" marginY>
      <Form context={form}>
        <Title>Reset Password</Title>
        <h3>Reset password</h3>

        <Form.Group label={(
          <span {...tooltip("hashed using argon2")}>
            <span>Password</span>
          </span>
        )} labelAsString="Password">
          <Input type="password" name="password" />
        </Form.Group>

        <Form.Group label="Repeat Password">
          <Input type="password" name="password2" />
        </Form.Group>

        <Form.Group>
          <Button type="submit" color="primary" onclick={form.createSubmitHandler()} loading={loading()}>
            <span>Submit</span>
          </Button>
        </Form.Group>
      </Form>
    </Section>
  )
}

export default ResetPasswordView
