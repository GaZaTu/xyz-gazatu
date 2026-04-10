import { iconUserX } from "@gazatu/solid-spectre/icons/iconUserX"
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
import { Title } from "@solidjs/meta"
import { useNavigate } from "@solidjs/router"
import { Component, createEffect, createMemo } from "solid-js"
import fetchGraphQL, { createGraphQLResource, gql } from "../../lib/fetchGraphQL"
import { Mutation, Query, UserPasswordResetRequest } from "../../lib/schema.gql"
import { createAuthCheck } from "../../store/auth"

const PasswordResetRequestListView: Component = () => {
  const navigate = useNavigate()

  const isAdmin = createAuthCheck("admin")
  createEffect(() => {
    if (!isAdmin()) {
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
      query {
        listPasswordResetRequests {
          id
          user {
            id
            username
          }
          message
          createdAt
        }
      }
    `,
    variables: {},
    onError: Toaster.pushError,
  })

  createGlobalProgressStateEffect(() => resource.loading)

  createEffect(() => {
    if (!resource.data) {
      return
    }

    A.scrollHistory.restore()
  })

  const table = Table.createContext<UserPasswordResetRequest>({
    get data() {
      return resource.data?.listPasswordResetRequests ?? []
    },
    columns: [
      tableColumnSelect(),
      tableColumnLink(row => ({ href: `/meta/users/${row.original.user?.id}` })),
      {
        accessorKey: "user.username",
        header: "Username",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: tableDateCell(),
        maxSize: 100,
      },
    ],
    state: tableState,
    onPaginationChange: tableOnPaginationChange(setTableState),
    onSortingChange: tableOnSortingChange(setTableState),
    onGlobalFilterChange: tableOnGlobalFilterChange(setTableState),
  })

  const selectedIds = createMemo(() => {
    return table.actions.getSelectedRowModel().flatRows.map(r => r.original.id!)
  })

  const handleRemove = async () => {
    if (!await ModalPortal.confirm("Delete the selected users?")) {
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
        variables: { ids: selectedIds() },
      })

      table.actions.setRowSelection({})
      resource.refresh()
    })
  }

  return (
    <>
      <Section size="xl" marginY>
        <Title>Password Reset Requests</Title>
        <h3>Password Reset Requests</h3>
      </Section>

      <Section size="xl" marginY flex style={{ "flex-grow": 1 }}>
        <Table context={table} loading={resource.loading} loadingSize="lg" striped pageQueryParam="p" sticky toolbar={
          <Column.Row>
            <Column>
              <Button color="failure" action disabled={!selectedIds().length} onclick={handleRemove}>
                <Icon src={iconUserX} />
              </Button>
            </Column>
          </Column.Row>
        } />
      </Section>
    </>
  )
}

export default PasswordResetRequestListView
