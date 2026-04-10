import { iconCheck } from "@gazatu/solid-spectre/icons/iconCheck"
import { iconTrash2 } from "@gazatu/solid-spectre/icons/iconTrash2"
import { A } from "@gazatu/solid-spectre/ui/A"
import { Button } from "@gazatu/solid-spectre/ui/Button"
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
import { Component, createEffect, createMemo, Show } from "solid-js"
import { createGraphQLResource, gql } from "../../lib/fetchGraphQL"
import { Query, TriviaCategory } from "../../lib/schema.gql"
import { createAuthCheck } from "../../store/auth"
import { removeTriviaCategories, verifyTriviaCategories } from "./shared-graphql"

const TriviaCategoryListView: Component = () => {
  const isTriviaAdmin = createAuthCheck("trivia/admin")

  const location = useLocation()

  const [tableState, setTableState] = createTableState({
    sorting: [
      { id: "name", desc: false },
    ],
  }, { useSearchParams: true })

  const resource = createGraphQLResource<Query>({
    query: gql`
      query ($isTriviaAdmin: Boolean!, $args: ListTriviaCategoriesArgs) {
        listTriviaCategories(args: $args) {
          slice {
            id
            name
            submitter
            verified
            createdAt
            questionsCount @include(if: $isTriviaAdmin)
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

  const table = Table.createContext<TriviaCategory>({
    get data() {
      return resource.data?.listTriviaCategories.slice ?? []
    },
    columns: [
      tableColumnSelect(),
      tableColumnLink(row => ({ href: `/trivia/categories/${row.original.id}` })),
      {
        accessorKey: "name",
        header: "Name",
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
      {
        accessorKey: "questionsCount",
        header: "Questions",
        cell: info => info.getValue() ?? "N/A",
        maxSize: 100,
        enableGlobalFilter: false,
      },
      {
        accessorKey: "verified",
        header: "Verified",
        meta: { compact: true },
        cell: info => (
          <Icon src={info.getValue() ? iconCheck : undefined} style={{ color: "var(--success)" }} class={`${centerSelf(true)}`} />
        ),
        maxSize: 100,
        enableGlobalFilter: false,
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
      return resource.data?.listTriviaCategories?.pageCount
    },
  })

  const selectedIds = createMemo(() => {
    return table.actions.getSelectedRowModel().flatRows.map(r => r.original.id!)
  })

  const handleVerify = async () => {
    await Toaster.try(async () => {
      await verifyTriviaCategories(selectedIds())
      table.actions.setRowSelection({})
      resource.refresh()
    })
  }

  const handleRemove = async () => {
    if (!await ModalPortal.confirm("Delete the selected trivia categories?")) {
      return
    }

    await Toaster.try(async () => {
      await removeTriviaCategories(selectedIds())
      table.actions.setRowSelection({})
      resource.refresh()
    })
  }

  return (
    <>
      <Section size="xl" marginY>
        <Title>Trivia Categories</Title>
        <h3>Trivia Categories</h3>
      </Section>

      <Section size="xl" marginY flex style={{ "flex-grow": 1 }}>
        <Table context={table} loading={resource.loading} loadingSize="lg" striped pageQueryParam="i" sticky toolbar={
          <Column.Row>
            <Show when={isTriviaAdmin()}>
              <Column>
                <Button color="success" action disabled={!selectedIds().length} onclick={handleVerify}>
                  <Icon src={iconCheck} />
                </Button>
              </Column>

              <Column>
                <Button color="failure" action disabled={!selectedIds().length} onclick={handleRemove}>
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

export default TriviaCategoryListView
