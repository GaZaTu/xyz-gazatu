import { validator } from "@felte/validator-superstruct"
import { iconSave } from "@gazatu/solid-spectre/icons/iconSave"
import { iconTrash2 } from "@gazatu/solid-spectre/icons/iconTrash2"
import { Autocomplete } from "@gazatu/solid-spectre/ui/Autocomplete"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Card } from "@gazatu/solid-spectre/ui/Card"
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
import { createDebouncedMemo } from "@solid-primitives/memo"
import { makePersisted } from "@solid-primitives/storage"
import { Title } from "@solidjs/meta"
import { useNavigate } from "@solidjs/router"
import { Component, createEffect, createMemo, createSignal, For, lazy, Show } from "solid-js"
import { isServer } from "solid-js/web"
import { array, nullable, optional, size, string, type } from "superstruct"
import fetchGraphQL, { createGraphQLResource, gql } from "../../lib/fetchGraphQL"
import { Mutation, Query, TriviaQuestionInput } from "../../lib/schema.gql"
import superstructIsRequired from "../../lib/superstructIsRequired"
import useIdFromParams from "../../lib/useIdFromParams"
import { createAuthCheck } from "../../store/auth"
import { removeTriviaQuestions, verifyTriviaQuestions } from "./shared-graphql"

const TriviaQuestionSchema = type({
  categories: size(array(type({ name: string() })), 1, 5),
  question: size(string(), 1, 256),
  answer: size(string(), 1, 64),
  hint1: optional(nullable(size(string(), 0, 256))),
  hint2: optional(nullable(size(string(), 0, 256))),
  submitter: optional(nullable(size(string(), 0, 64))),
})

const TriviaQuestionView: Component = () => {
  const isTriviaAdmin = createAuthCheck("trivia/admin")

  const id = useIdFromParams()

  const resource = createGraphQLResource<Query>({
    query: gql`
      query ($id: String!, $isNew: Boolean!) {
        findTriviaQuestion(id: $id) @skip(if: $isNew) {
          id
          question
          answer
          categories {
            id
            name
            verified
          }
          hint1
          hint2
          submitter
          verified
          createdAt
        }
        listTriviaCategories(args: { window: { limit: 666 } }) {
          slice {
            id
            name
            verified
          }
        }
      }
    `,
    variables: {
      get isTriviaAdmin() {
        return isTriviaAdmin()
      },
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

  const [submitMultiple, setSubmitMultiple] = makePersisted(createSignal(false), {
    name: "trivia/submit-multiple",
  })
  const toggleSubmitMultiple = () => {
    setSubmitMultiple(p => !p)
  }

  const [isSubmitting, setSubmitting] = createSignal(false)

  const formSchema = TriviaQuestionSchema
  const form = Form.createContext<TriviaQuestionInput>({
    extend: validator<any>({ struct: formSchema }),
    isRequired: superstructIsRequired.bind(undefined, formSchema),
    transform: v => v as any,
    onSubmit: async input => {
      setSubmitting(true)
      try {
        const res = await fetchGraphQL<Mutation>({
          query: gql`
            mutation ($input: TriviaQuestionInput!) {
              saveTriviaQuestion(input: $input) {
                id
              }
            }
          `,
          variables: { input },
        })

        if (id()) {
          resource.refresh()
          return "Saved Trivia Question"
        } else {
          if (submitMultiple()) {
            similarQuestionsResource.clear()
            form.reset()
          } else {
            navigate(`/trivia/questions/${res.saveTriviaQuestion?.id}`)
          }

          return "Submitted Trivia Question"
        }
      } finally {
        setSubmitting(false)
      }
    },
    onSuccess: Toaster.pushSuccess,
    onError: Toaster.pushError,
  })

  createEffect(() => {
    form.setData(resource.data?.findTriviaQuestion)
  })

  const loading = createMemo(() => {
    return resource.loading || isSubmitting() || isServer
  })

  const readOnly = createMemo(() => {
    return loading() || (id() && !isTriviaAdmin())
  })

  const verified = createMemo(() => {
    return resource.data?.findTriviaQuestion?.verified ?? false
  })

  const similarQuestionsVariables = createDebouncedMemo(() => {
    if (id() && !form.touched.question) {
      return undefined
    }

    const search = (form.data as any)("question")
    if (search?.length > 3) {
      return { search }
    }

    return undefined
  }, 1000)
  const similarQuestionsResource = createGraphQLResource<Query>({
    query: gql`
      query ($search: String) {
        listTriviaQuestions(args: { search: $search, window: { limit: 4 } }) {
          slice {
            id
            question
            answer
            categories {
              id
              name
              verified
            }
            verified
          }
        }
      }
    `,
    variables: similarQuestionsVariables,
    onError: Toaster.pushError,
  })
  const similarQuestions = createMemo(() => {
    return similarQuestionsResource.data?.listTriviaQuestions?.slice
      ?.filter(q => q.id !== id())
  })

  const categories = Autocomplete.createOptions(() => resource.data?.listTriviaCategories.slice ?? [], {
    filterable: true,
    createable: true,
    key: "name",
    disable: o => (form.data as any)("categories")?.map?.((v: any) => v.id)?.includes(o.id),
  })

  const handleVerify = async () => {
    await Toaster.try(async () => {
      await verifyTriviaQuestions([id()])
    })
  }

  const handleDisable = async () => {
    if (!await ModalPortal.confirm("Delete this trivia question?")) {
      return
    }

    await Toaster.try(async () => {
      await removeTriviaQuestions([id()])
      navigate(-1)
    })
  }

  return (
    <>
      <Section size="xl" marginY>
        <Title>Trivia Question</Title>
        <h3>Trivia Question</h3>

        <Column.Row>
          <Column>
            <Form context={form} horizontal>
              <Form.Group label="Categories" hint={(form.touched.categories && !(form.data as any)("categories")?.length) ? "pick `General Knowledge` if this question does not have a category" : undefined}>
                <Autocomplete name="categories" {...categories} multiple readOnly={readOnly()} />
              </Form.Group>

              <Form.Group label="Question">
                <Input type="text" name="question" readOnly={readOnly()} ifEmpty={null} multiline style={{ "min-height": "calc(var(--control-height-md) * 3)" }} />
              </Form.Group>

              <Form.Group label="Answer">
                <Input type="text" name="answer" readOnly={readOnly()} ifEmpty={null} />
              </Form.Group>

              <Form.Group label="Hint 1">
                <Input type="text" name="hint1" readOnly={readOnly()} ifEmpty={null} multiline style={{ "min-height": "calc(var(--control-height-md) * 2)" }} />
              </Form.Group>

              <Form.Group label="Hint 2">
                <Input type="text" name="hint2" readOnly={readOnly()} ifEmpty={null} multiline style={{ "min-height": "calc(var(--control-height-md) * 2)" }} />
              </Form.Group>

              <Form.Group label="Submitter">
                <Input type="text" name="submitter" readOnly={readOnly()} ifEmpty={null} />
              </Form.Group>

              <Form.Group>
                <Navbar size="lg">
                  <Navbar.Section>
                    <Column.Row>
                      <Column>
                        <Button type="submit" color="primary" action onclick={form.createSubmitHandler()} disabled={readOnly()} loading={loading()}>
                          <Icon src={iconSave} />
                        </Button>
                      </Column>

                      <Column>
                        <Show when={!id()}>
                          <Switch checked={!!submitMultiple()} oninput={toggleSubmitMultiple}>
                            <span>Batch</span>
                          </Switch>
                        </Show>
                      </Column>
                    </Column.Row>
                  </Navbar.Section>

                  <Navbar.Section>
                    <Show when={isTriviaAdmin()}>
                      <Button color="failure" action onclick={handleDisable} disabled={readOnly() || !id()}>
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

          <Column xxl={4} sm={12}>
            <Show when={similarQuestions()?.length && !readOnly()}>
              <h5>Similar (<b>existing</b>) Questions:</h5>

              <Column.Row>
                <For each={similarQuestions()}>
                  {similarQuestion => (
                    <Column xxl={12} style={{ padding: "var(--unit-2)" }}>
                      <Card style={{ background: "rgba(var(--warning--rgb-triplet), 0.05)" }}>
                        <Card.Body>
                          <span>{similarQuestion.question}</span>
                        </Card.Body>
                      </Card>
                    </Column>
                  )}
                </For>
              </Column.Row>
            </Show>
          </Column>
        </Column.Row>
      </Section>

      <Show when={id() && isTriviaAdmin()}>
        <TriviaReportList questionId={id()} />
      </Show>
    </>
  )
}

export default TriviaQuestionView

const TriviaReportList = lazy(() => import("./TriviaReportList"))
