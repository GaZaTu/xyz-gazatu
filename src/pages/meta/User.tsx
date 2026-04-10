import { validator } from "@felte/validator-superstruct"
import { iconCopy } from "@gazatu/solid-spectre/icons/iconCopy"
import { iconLogOut } from "@gazatu/solid-spectre/icons/iconLogOut"
import { iconSave } from "@gazatu/solid-spectre/icons/iconSave"
import { iconUserX } from "@gazatu/solid-spectre/icons/iconUserX"
import { Autocomplete } from "@gazatu/solid-spectre/ui/Autocomplete"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Form } from "@gazatu/solid-spectre/ui/Form"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { Input } from "@gazatu/solid-spectre/ui/Input"
import { ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { Navbar } from "@gazatu/solid-spectre/ui/Navbar"
import { createGlobalProgressStateEffect } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Tile } from "@gazatu/solid-spectre/ui/Tile"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import * as webauthn from "@simplewebauthn/browser"
import { Title } from "@solidjs/meta"
import { useLocation, useNavigate } from "@solidjs/router"
import { Component, createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { isServer } from "solid-js/web"
import { array, size, string, type } from "superstruct"
import fetchGraphQL, { createGraphQLResource, gql } from "../../lib/fetchGraphQL"
import { Mutation, Query, UserInput, UserPasskey, UserPushSubscription } from "../../lib/schema.gql"
import superstructIsRequired from "../../lib/superstructIsRequired"
import useIdFromParams from "../../lib/useIdFromParams"
import { createAuthCheck, storedAuth } from "../../store/auth"
import { iconKey } from "@gazatu/solid-spectre/icons/iconKey"
import { iconRss } from "@gazatu/solid-spectre/icons/iconRss"
import { iconX } from "@gazatu/solid-spectre/icons/iconX"
import { iconSend } from "@gazatu/solid-spectre/icons/iconSend"

const UserSchema = type({
  username: size(string(), 6, 32),
  roles: size(array(type({ name: string() })), 0, 5),
})

const UserView: Component = () => {
  const location = useLocation()

  const idParam = useIdFromParams()
  const id = createMemo(() => {
    return (location.pathname === "/profile") ? storedAuth()?.user?.id : idParam()
  })

  const isSelf = createMemo(() => id() === storedAuth()?.user?.id)

  const isAdmin = createAuthCheck("admin")

  const resource = createGraphQLResource<Query>({
    query: gql`
      query ($id: String!) {
        findUser(id: $id) {
          id
          username
          activated
          createdAt
          roles {
            id
            name
          }
          passkeys {
            id
            name
            deviceType
            createdAt
          }
          pushSubscriptions {
            id
            device
            createdAt
          }
        }
        listUserRoles {
          id
          name
        }
      }
    `,
    variables: {
      get id() {
        return id()
      },
    },
    onError: Toaster.pushError,
  })

  createGlobalProgressStateEffect(() => resource.loading)

  const [isSubmitting, setSubmitting] = createSignal(false)

  const formSchema = UserSchema
  const form = Form.createContext<UserInput>({
    extend: validator<any>({ struct: formSchema }),
    isRequired: superstructIsRequired.bind(undefined, formSchema),
    transform: v => v as any,
    onSubmit: async input => {
      setSubmitting(true)
      try {
        await fetchGraphQL<Mutation>({
          query: gql`
            mutation ($input: UserInput!) {
              saveUser(input: $input) {
                id
              }
            }
          `,
          variables: { input },
        })

        resource.refresh()
        return "Saved User"
      } finally {
        setSubmitting(false)
      }
    },
    onSuccess: Toaster.pushSuccess,
    onError: Toaster.pushError,
  })

  createEffect(() => {
    form.setData(resource.data?.findUser)
  })

  const loading = createMemo(() => {
    return resource.loading || isSubmitting() || isServer
  })

  const readOnly = createMemo(() => {
    return loading() || !isAdmin()
  })

  const roles = Autocomplete.createOptions(() => resource.data?.listUserRoles ?? [], {
    filterable: true,
    createable: true,
    key: "name",
    disable: o => (form.data as any)("roles")?.map?.((v: any) => v.id)?.includes(o.id),
  })

  const handleCopyAuthToken = async () => {
    await navigator.clipboard.writeText(storedAuth()!.token!)
  }

  const navigate = useNavigate()
  const handleRemove = async () => {
    if (!await ModalPortal.confirm("Delete this user?")) {
      return
    }
    if (!await ModalPortal.confirm("Are you sure?")) {
      return
    }

    await Toaster.try(async () => {
      await fetchGraphQL<Mutation>({
        query: gql`
          mutation ($ids: [String!]!) {
            removeUsers(ids: $ids)
          }
        `,
        variables: { ids: [id()] },
      })

      navigate("/logout")
    })
  }

  const addPasskey = async () => {
    await Toaster.try(async () => {
      const { beginPasskeyRegistration } = await fetchGraphQL<Mutation>({
        query: gql`
          mutation {
            beginPasskeyRegistration
          }
        `,
        variables: {},
      })

      const options = JSON.parse(beginPasskeyRegistration)
      const response = await webauthn.startRegistration(options)

      const passkeyName = prompt("Passkey name")
      if (!passkeyName) {
        throw new Error("cancelled")
      }

      await fetchGraphQL<Mutation>({
        query: gql`
          mutation ($passkeyName: String!, $response: String!) {
            finishPasskeyRegistration(passkeyName: $passkeyName, response: $response)
          }
        `,
        variables: {
          passkeyName,
          response: JSON.stringify(response),
        },
      })

      resource.refresh()
    })
  }

  const removePasskey = async (passkey: UserPasskey) => {
    if (!await ModalPortal.confirm("Really remove Passkey?")) {
      return
    }

    await Toaster.try(async () => {
      await fetchGraphQL<Mutation>({
        query: gql`
        mutation ($ids: [String!]!) {
          removePasskeys(ids: $ids)
        }
      `,
        variables: { ids: [passkey.id] },
      })

      resource.refresh()
    })
  }

  const addPushSubscription = async () => {
    await Toaster.try(async () => {
      let registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        registration = await navigator.serviceWorker.register("/service-worker.js")
      }

      const subscription = await registration.pushManager.subscribe()

      const device = prompt("Device name")
      if (!device) {
        throw new Error("cancelled")
      }

      const input = {
        userId: id(),
        device,
        data: JSON.stringify(subscription.toJSON()),
      }

      await fetchGraphQL<Mutation>({
        query: gql`
          mutation ($input: UserPushSubscriptionInput!) {
            savePushSubscription(input: $input) {
              id
            }
          }
        `,
        variables: { input },
      })

      resource.refresh()
    })
  }

  const removePushSubscription = async (pushSubscription: UserPushSubscription) => {
    if (!await ModalPortal.confirm("Really remove Push-Subscription?")) {
      return
    }

    await Toaster.try(async () => {
      await fetchGraphQL<Mutation>({
        query: gql`
        mutation ($ids: [String!]!) {
          removePushSubscriptions(ids: $ids)
        }
      `,
        variables: { ids: [pushSubscription.id] },
      })

      resource.refresh()
    })
  }

  const testPushSubscription = async (pushSubscription: UserPushSubscription) => {
    await Toaster.try(async () => {
      await fetchGraphQL<Mutation>({
        query: gql`
        mutation ($ids: [String!]!) {
          testPushSubscriptions(ids: $ids)
        }
      `,
        variables: { ids: [pushSubscription.id] },
      })

      resource.refresh()
    })
  }

  return (
    <>
      <Section size="xl" marginY>
        <Column.Row>
          <Column>
            <Title>{isSelf() ? "Profile" : "User"}</Title>
            <h3>{isSelf() ? "Profile" : "User"}</h3>
          </Column>

          <Show when={isSelf()}>
            <Column xxl="auto" offset="ml">
              <Button onclick={handleCopyAuthToken} color="gray">
                <Icon src={iconCopy} />
                <span>Auth-Token</span>
              </Button>
            </Column>

            <Column xxl="auto" offset="ml">
              <Button.A href="/logout" color="warning">
                <Icon src={iconLogOut} />
                <span>Logout</span>
              </Button.A>
            </Column>

            <Column xxl="auto" offset="ml">
              <Button onclick={handleRemove} color="failure">
                <Icon src={iconUserX} />
                <span>Delete</span>
              </Button>
            </Column>
          </Show>
        </Column.Row>
      </Section>

      <Section size="xl" marginY>
        <Form context={form} horizontal>
          <Form.Group label="Username">
            <Input type="text" name="username" readOnly ifEmpty={null} />
          </Form.Group>

          <Form.Group label="Roles">
            <Autocomplete name="roles" {...roles} multiple readOnly={readOnly()} />
          </Form.Group>

          <Form.Group>
            <Navbar size="lg">
              <Navbar.Section>
                <Button type="submit" color="primary" action onclick={form.createSubmitHandler()} disabled={readOnly()} loading={loading()}>
                  <Icon src={iconSave} />
                </Button>
              </Navbar.Section>
            </Navbar>
          </Form.Group>
        </Form>
      </Section>

      <Show when={isSelf()}>
        <Section size="xl" marginY>
          <Navbar size="lg">
            <Navbar.Section>
              <Button color="primary" onclick={addPasskey} loading={loading()}>
                <span>Add Passkey (2FA)</span>
              </Button>
            </Navbar.Section>
          </Navbar>

          <Column.Row>
            <For each={resource.data?.findUser?.passkeys}>
              {passkey => (
                <Column xxl={4} md={6} sm={12}>
                  <Tile compact style={{ border: "1px solid gray", padding: "0.5rem" }}>
                    <Tile.Icon>
                      <Icon src={iconKey} />
                    </Tile.Icon>
                    <Tile.Body>
                      <Tile.Title>
                        <span>{passkey.name}</span>
                      </Tile.Title>
                    </Tile.Body>
                    <Tile.Action>
                      <Button color="failure" onclick={() => removePasskey(passkey)} loading={loading()} action>
                        <Icon src={iconX} />
                      </Button>
                    </Tile.Action>
                  </Tile>
                </Column>
              )}
            </For>
          </Column.Row>
        </Section>
      </Show>

      <Show when={isSelf()}>
        <Section size="xl" marginY>
          <Navbar size="lg">
            <Navbar.Section>
              <Button color="primary" onclick={addPushSubscription} loading={loading()}>
                <span>Subscribe to push notifications</span>
              </Button>
            </Navbar.Section>
          </Navbar>

          <Column.Row>
            <For each={resource.data?.findUser?.pushSubscriptions}>
              {pushSubscription => (
                <Column xxl={4} md={6} sm={12}>
                  <Tile compact style={{ border: "1px solid gray", padding: "0.5rem" }}>
                    <Tile.Icon>
                      <Icon src={iconRss} />
                    </Tile.Icon>
                    <Tile.Body>
                      <Tile.Title>
                        <span>{pushSubscription.device}</span>
                      </Tile.Title>
                    </Tile.Body>
                    <Tile.Action>
                      <Button color="gray" onclick={() => testPushSubscription(pushSubscription)} loading={loading()} action style={{ "margin-right": "0.5rem" }}>
                        <Icon src={iconSend} />
                      </Button>
                      <Button color="failure" onclick={() => removePushSubscription(pushSubscription)} loading={loading()} action>
                        <Icon src={iconX} />
                      </Button>
                    </Tile.Action>
                  </Tile>
                </Column>
              )}
            </For>
          </Column.Row>
        </Section>
      </Show>
    </>
  )
}

export default UserView
