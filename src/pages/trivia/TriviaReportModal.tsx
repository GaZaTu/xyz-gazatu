import { validator } from "@felte/validator-superstruct"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Form } from "@gazatu/solid-spectre/ui/Form"
import { Input } from "@gazatu/solid-spectre/ui/Input"
import { Modal } from "@gazatu/solid-spectre/ui/Modal"
import { ModalProps } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { Component, createSignal } from "solid-js"
import { size, string, type } from "superstruct"
import fetchGraphQL, { gql } from "../../lib/fetchGraphQL"
import { Mutation, TriviaQuestionInput, TriviaReportInput } from "../../lib/schema.gql"
import superstructIsRequired from "../../lib/superstructIsRequired"

const TriviaReportSchema = type({
  message: size(string(), 1, 256),
  submitter: size(string(), 1, 128),
})

type Props = ModalProps & {
  question: TriviaQuestionInput
}

const TriviaReportModal: Component<Props> = modal => {
  const [isSubmitting, setSubmitting] = createSignal(false)

  const formSchema = TriviaReportSchema
  const form = Form.createContext<TriviaReportInput>({
    extend: validator<any>({ struct: formSchema }),
    isRequired: superstructIsRequired.bind(undefined, formSchema),
    transform: v => v as any,
    onSubmit: async input => {
      setSubmitting(true)
      try {
        await fetchGraphQL<Mutation>({
          query: gql`
            mutation ($input: TriviaReportInput!) {
              saveTriviaReport(input: $input) {
                id
              }
            }
          `,
          variables: { input },
        })

        modal.resolve()
        return "Reported trivia question"
      } finally {
        setSubmitting(false)
      }
    },
    onSuccess: Toaster.pushSuccess,
    onError: Toaster.pushError,
    initialValues: {
      question: modal.question,
    },
  })

  return (
    <Modal onclose={modal.resolve} active>
      <Modal.Header>
        <h5>Report trivia question</h5>
      </Modal.Header>

      <Form context={form} horizontal>
        <Modal.Body>
          <Form.Group label="Message">
            <Input type="text" name="message" ifEmpty={null} multiline style={{ "min-height": "calc(var(--control-height-md) * 2)" }} />
          </Form.Group>

          <Form.Group label="Submitter">
            <Input type="text" name="submitter" ifEmpty={null} />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button type="submit" color="primary" onclick={form.createSubmitHandler()} loading={isSubmitting()}>OK</Button>
          <Button color="link" onclick={modal.resolve}>Cancel</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default TriviaReportModal
