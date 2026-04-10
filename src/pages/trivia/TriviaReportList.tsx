import { iconTrash2 } from "@gazatu/solid-spectre/icons/iconTrash2"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { createGlobalProgressStateEffect } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Table } from "@gazatu/solid-spectre/ui/Table"
import { createTableState, tableColumnLink, tableColumnSelect, tableDateCell, tableOnGlobalFilterChange, tableOnPaginationChange, tableOnSortingChange } from "@gazatu/solid-spectre/ui/Table.Helpers"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { Title } from "@solidjs/meta"
import { useNavigate } from "@solidjs/router"
import { ColumnDef } from "@tanstack/solid-table"
import { Component, createEffect, createMemo } from "solid-js"
import { createGraphQLResource, gql } from "../../lib/fetchGraphQL"
import { Query, TriviaReport } from "../../lib/schema.gql"
import { createAuthCheck } from "../../store/auth"
import { removeTriviaReports } from "./shared-graphql"

const TriviaReportListView: Component<{ questionId?: unknown }> = props => {
  const navigate = useNavigate()

  const isTriviaAdmin = createAuthCheck("trivia/admin")
  createEffect(() => {
    if (!isTriviaAdmin()) {
      navigate("/404")
    }
  })

  const [tableState, setTableState] = createTableState({
    sorting: [
      { id: "createdAt", desc: true },
    ],
  }, { useSearchParams: true })

  const resource = createGraphQLResource<Query>({
    query: gql`
      query ($args: ListTriviaReportsArgs) {
        listTriviaReports(args: $args) {
          slice {
            id
            message
            submitter
            createdAt
            question {
              id
              question
            }
          }
          pageIndex
          pageCount
        }
      }
    `,
    variables: {
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
        get questionId() {
          return props.questionId
        },
      },
    },
    onError: Toaster.pushError,
  })

  createGlobalProgressStateEffect(() => resource.loading)

  const table = Table.createContext<TriviaReport>({
    get data() {
      return resource.data?.listTriviaReports.slice ?? []
    },
    get columns(): ColumnDef<TriviaReport, any>[] {
      return [
        tableColumnSelect(),
        tableColumnLink(row => ({ href: `/trivia/questions/${row.original.question?.id}` })),
        ...(!props.questionId ? [{
          accessorKey: "question.question",
          header: "Question",
        }] : []),
        {
          accessorKey: "message",
          header: "Message",
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
          enableGlobalFilter: false,
        },
      ]
    },
    state: tableState,
    onPaginationChange: tableOnPaginationChange(setTableState),
    onSortingChange: tableOnSortingChange(setTableState),
    onGlobalFilterChange: tableOnGlobalFilterChange(setTableState),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    get pageCount() {
      return resource.data?.listTriviaReports?.pageCount
    },
  })

  const selectedIds = createMemo(() => {
    return table.actions.getSelectedRowModel().flatRows.map(r => r.original.id!)
  })

  const handleRemove = async () => {
    if (!await ModalPortal.confirm("Delete the selected trivia reports?")) {
      return
    }

    await Toaster.try(async () => {
      await removeTriviaReports(selectedIds())
      table.actions.setRowSelection({})
      resource.refresh()
    })
  }

  return (
    <>
      <Section size="xl" marginY>
        <Title>Trivia Reports</Title>
        <h3>Trivia Reports</h3>
      </Section>

      <Section size="xl" marginY flex style={{ "flex-grow": 1 }}>
        <Table context={table} loading={resource.loading} loadingSize="lg" striped pageQueryParam="i" sticky={!props.questionId} toolbar={
          <Column.Row>
            <Column>
              <Button color="failure" action disabled={!selectedIds().length} onclick={handleRemove}>
                <Icon src={iconTrash2} />
              </Button>
            </Column>
          </Column.Row>
        } />
      </Section>
    </>
  )
}

export default TriviaReportListView
