import { iconCheck } from "@gazatu/solid-spectre/icons/iconCheck"
import { iconFlag } from "@gazatu/solid-spectre/icons/iconFlag"
import { iconTrash2 } from "@gazatu/solid-spectre/icons/iconTrash2"
import { A } from "@gazatu/solid-spectre/ui/A"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Chip } from "@gazatu/solid-spectre/ui/Chip"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { createGlobalProgressStateEffect } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Table } from "@gazatu/solid-spectre/ui/Table"
import { createTableState, tableColumnLink, tableColumnSelect, tableDateCell, tableOnGlobalFilterChange, tableOnPaginationChange, tableOnSortingChange } from "@gazatu/solid-spectre/ui/Table.Helpers"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { centerSelf } from "@gazatu/solid-spectre/util/position"
import { Title } from "@solidjs/meta"
import { useLocation } from "@solidjs/router"
import { Component, createEffect, createMemo, For, Show } from "solid-js"
import { createGraphQLResource, gql } from "../../lib/fetchGraphQL"
import { Query, TriviaCategory, TriviaQuestion, TriviaQuestionInput } from "../../lib/schema.gql"
import { createAuthCheck } from "../../store/auth"
import { removeTriviaQuestions, verifyTriviaQuestions } from "./shared-graphql"

const TriviaQuestionListView: Component<{ categoryId?: unknown }> = props => {
  const isTriviaAdmin = createAuthCheck("trivia/admin")

  const location = useLocation()

  const [tableState, setTableState] = createTableState({
    sorting: [
      { id: "createdAt", desc: true },
    ],
  }, { useSearchParams: true })

  const resource = createGraphQLResource<Query>({
    query: gql`
      query ($args: ListTriviaQuestionsArgs) {
        listTriviaQuestions(args: $args) {
          slice {
            id
            categories {
              id
              name
            }
            question
            answer
            hint1
            hint2
            submitter
            verified
            createdAt
          }
          pageIndex
          pageCount
        }
      }
    `,
    variables: {
      get isTriviaAdmin() {
        return isTriviaAdmin()
      },
      args: {
        get window() {
          const window = tableState.pagination
          if (!window) {
            return undefined
          }

          return {
            offset: window.pageSize * window.pageIndex,
            limit: window.pageSize,
          }
        },
        get sorting() {
          const sorting = tableState.sorting?.[0]
          if (!sorting) {
            return undefined
          }

          return {
            col: sorting.id,
            dir: sorting.desc ? "DESC" : "ASC",
          }
        },
        get search() {
          return tableState.globalFilter
        },
        get verified() {
          return location.query.verified ? (location.query.verified === "true") : undefined
        },
        get categoryId() {
          return props.categoryId
        },
      },
    },
    onError: Toaster.pushError,
  })

  createGlobalProgressStateEffect(() => resource.loading)

  createEffect(() => {
    if (!resource.data) {
      return
    }

    A.scrollHistory.restore()
  })

  const table = Table.createContext<TriviaQuestion>({
    get data() {
      return resource.data?.listTriviaQuestions?.slice ?? []
    },
    columns: [
      tableColumnSelect(),
      tableColumnLink(row => ({ href: `/trivia/questions/${row.original.id}` })),
      {
        accessorKey: "categories",
        header: "Categories",
        cell: info => (
          <For each={info.getValue() as TriviaCategory[]}>
            {category => (
              <A href={`/trivia/categories/${category.id}`} style={{ color: "unset" }}>
                <Chip>{category.name}</Chip>
              </A>
            )}
          </For>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "question",
        header: "Question",
      },
      {
        accessorKey: "answer",
        header: "Answer",
        maxSize: 100,
      },
      {
        accessorKey: "hint1",
        header: "Hints",
      },
      {
        accessorKey: "hint2",
        header: "",
      },
      {
        accessorKey: "submitter",
        header: "Submitter",
        maxSize: 100,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: tableDateCell(),
        maxSize: 100,
      },
      {
        accessorKey: "verified",
        header: "Verified",
        meta: { compact: true },
        cell: info => (
          <Icon src={info.getValue() ? iconCheck : undefined} style={{ color: "var(--success)" }} class={`${centerSelf(true)}`} />
        ),
        maxSize: 100,
      },
    ],
    state: tableState,
    onPaginationChange: tableOnPaginationChange(setTableState),
    onSortingChange: tableOnSortingChange(setTableState),
    onGlobalFilterChange: tableOnGlobalFilterChange(setTableState),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    get pageCount() {
      return resource.data?.listTriviaQuestions?.pageCount
    },
  })

  const selectedRows = createMemo(() => {
    return table.actions.getSelectedRowModel().flatRows.map(r => r.original)
  })

  const selectedIds = createMemo(() => {
    return selectedRows().map(r => r.id!)
  })

  const handleReport = async () => {
    await Toaster.try(async () => {
      const { default: TriviaReportModal } = await import("./TriviaReportModal")

      await ModalPortal.push(modal => (
        <TriviaReportModal {...modal} question={selectedRows()[0] as TriviaQuestionInput} />
      ))
    })
  }

  const handleVerify = async () => {
    await Toaster.try(async () => {
      await verifyTriviaQuestions(selectedIds())
      table.actions.setRowSelection({})
      resource.refresh()
    })
  }

  const handleDisable = async () => {
    if (!await ModalPortal.confirm("Delete the selected trivia questions?")) {
      return
    }

    await Toaster.try(async () => {
      await removeTriviaQuestions(selectedIds())
      table.actions.setRowSelection({})
      resource.refresh()
    })
  }

  return (
    <>
      <Section size="xl" marginY>
        <Title>Trivia Questions</Title>
        <h3>Trivia Questions</h3>
      </Section>

      <Section marginY flex style={{ "flex-grow": 1 }}>
        <Table context={table} loading={resource.loading} loadingSize="lg" striped pageQueryParam="i" sticky={!props.categoryId} toolbar={
          <Column.Row>
            <Column>
              <Button color="warning" action disabled={selectedIds().length !== 1} onclick={handleReport}>
                <Icon src={iconFlag} />
              </Button>
            </Column>

            <Show when={isTriviaAdmin()}>
              <Column>
                <Button color="success" action disabled={!selectedIds().length} onclick={handleVerify}>
                  <Icon src={iconCheck} />
                </Button>
              </Column>

              <Column>
                <Button color="failure" action disabled={!selectedIds().length} onclick={handleDisable}>
                  <Icon src={iconTrash2} />
                </Button>
              </Column>
            </Show>
          </Column.Row>
        } />
      </Section>
    </>
  )
}

export default TriviaQuestionListView
