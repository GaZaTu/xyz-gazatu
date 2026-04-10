import { validator } from "@felte/validator-superstruct"
import { iconSave } from "@gazatu/solid-spectre/icons/iconSave"
import { iconTrash2 } from "@gazatu/solid-spectre/icons/iconTrash2"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Form } from "@gazatu/solid-spectre/ui/Form"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { Input } from "@gazatu/solid-spectre/ui/Input"
import { ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { Navbar } from "@gazatu/solid-spectre/ui/Navbar"
import { createGlobalProgressStateEffect } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Switch } from "@gazatu/solid-spectre/ui/Switch"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { Title } from "@solidjs/meta"
import { useNavigate } from "@solidjs/router"
import { Component, createEffect, createMemo, createSignal, lazy, Show } from "solid-js"
import { isServer } from "solid-js/web"
import { nullable, optional, size, string, type } from "superstruct"
import fetchGraphQL, { createGraphQLResource, gql } from "../../lib/fetchGraphQL"
import { Mutation, Query, TriviaCategoryInput } from "../../lib/schema.gql"
import superstructIsRequired from "../../lib/superstructIsRequired"
import useIdFromParams from "../../lib/useIdFromParams"
import { createAuthCheck } from "../../store/auth"
import { removeTriviaCategories, verifyTriviaCategories } from "./shared-graphql"

const TriviaCategorySchema = type({
  id: optional(string()),
  name: size(string(), 1, 32),
  description: optional(nullable(size(string(), 0, 256))),
  submitter: optional(nullable(size(string(), 0, 64))),
})

const TriviaCategoryView: Component = () => {
  const isTriviaAdmin = createAuthCheck("trivia/admin")

  const id = useIdFromParams()

  const resource = createGraphQLResource<Query>({
    query: gql`
      query ($id: String!, $isNew: Boolean!) {
        findTriviaCategory(id: $id) @skip(if: $isNew) {
          id
          name
          description
          submitter
          verified
          createdAt
        }
      }
    `,
    variables: {
      get id() {
        return id()
      },
      get isNew() {
        return !id()
      },
    },
    onError: Toaster.pushError,
  })

  createGlobalProgressStateEffect(() => resource.loading)

  const navigate = useNavigate()

  const [isSubmitting, setSubmitting] = createSignal(false)

  const formSchema = TriviaCategorySchema
  const form = Form.createContext<TriviaCategoryInput>({
    extend: validator<any>({ struct: formSchema }),
    isRequired: superstructIsRequired.bind(undefined, formSchema),
    transform: v => v as any,
    onSubmit: async input => {
      setSubmitting(true)
      try {
        const res = await fetchGraphQL<Mutation>({
          query: gql`
            mutation ($input: TriviaCategoryInput!) {
              saveTriviaCategory(input: $input) {
                id
              }
            }
          `,
          variables: { input },
        })

        if (id()) {
          resource.refresh()
          return "Saved Trivia Category"
        } else {
          navigate(`/trivia/categories/${res.saveTriviaCategory?.id}`)
          return "Submitted Trivia Category"
        }
      } finally {
        setSubmitting(false)
      }
    },
    onSuccess: Toaster.pushSuccess,
    onError: Toaster.pushError,
  })

  createEffect(() => {
    form.setData(resource.data?.findTriviaCategory)
  })

  const loading = createMemo(() => {
    return resource.loading || isSubmitting() || isServer
  })

  const readOnly = createMemo(() => {
    return loading() || (id() && !isTriviaAdmin())
  })

  const verified = createMemo(() => {
    return resource.data?.findTriviaCategory?.verified ?? false
  })

  const handleVerify = async () => {
    await Toaster.try(async () => {
      await verifyTriviaCategories([id()])
    })
  }

  const handleRemove = async () => {
    if (!await ModalPortal.confirm("Delete this trivia category?")) {
      return
    }

    await Toaster.try(async () => {
      await removeTriviaCategories([id()])
      navigate(-1)
    })
  }

  return (
    <>
      <Section size="xl" marginY>
        <Title>Trivia Category</Title>
        <h3>Trivia Category</h3>

        <Column.Row>
          <Column>
            <Form context={form} horizontal>
              <Form.Group label="Name">
                <Input type="text" name="name" readOnly={readOnly()} ifEmpty={null} />
              </Form.Group>

              <Form.Group label="Description">
                <Input type="text" name="description" readOnly={readOnly()} ifEmpty={null} />
              </Form.Group>

              <Form.Group label="Submitter">
                <Input type="text" name="submitter" readOnly={readOnly()} ifEmpty={null} />
              </Form.Group>

              <Form.Group>
                <Navbar size="lg">
                  <Navbar.Section>
                    <Button type="submit" color="primary" action onclick={form.createSubmitHandler()} disabled={readOnly()} loading={loading()}>
                      <Icon src={iconSave} />
                    </Button>
                  </Navbar.Section>

                  <Navbar.Section>
                    <Show when={isTriviaAdmin()}>
                      <Button color="failure" action onclick={handleRemove} disabled={readOnly() || !id()}>
                        <Icon src={iconTrash2} />
                      </Button>
                    </Show>
                  </Navbar.Section>
                </Navbar>
              </Form.Group>
            </Form>

            <Form.Group horizontal>
              <Switch checked={verified()} oninput={handleVerify} disabled={readOnly() || !id() || verified()} style={{ color: verified() ? "var(--success)" : "var(--failure)", "font-weight": "bold" }}>
                <span>Verified</span>
              </Switch>
            </Form.Group>
          </Column>

          <Column xxl={4} sm={12} />
        </Column.Row>
      </Section>

      <Show when={id()}>
        <TriviaQuestionList categoryId={id()} />
      </Show>
    </>
  )
}

export default TriviaCategoryView

const TriviaQuestionList = lazy(() => import("./TriviaQuestionList"))
