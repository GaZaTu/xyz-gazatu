import { iconMinusSquare } from "@gazatu/solid-spectre/icons/iconMinusSquare"
import { iconPlusSquare } from "@gazatu/solid-spectre/icons/iconPlusSquare"
import { iconSquare } from "@gazatu/solid-spectre/icons/iconSquare"
import { A } from "@gazatu/solid-spectre/ui/A"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { createGlobalProgressStateEffect } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Table } from "@gazatu/solid-spectre/ui/Table"
import { createTableState, tableDateCell, tableOnPaginationChange, tableOnSortingChange } from "@gazatu/solid-spectre/ui/Table.Helpers"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { Title } from "@solidjs/meta"
import { useNavigate } from "@solidjs/router"
import { Component, For, createEffect, createMemo } from "solid-js"
import { createGraphQLResource } from "../../lib/fetchGraphQL"
import { AuditLog, Query } from "../../lib/schema.gql"
import { createAuthCheck } from "../../store/auth"

const OperationCell: Component<{ op: string }> = props => {
  const data = createMemo(() => {
    switch (props.op) {
      case "I": return { src: iconPlusSquare, color: "success" }
      case "U": return { src: iconSquare, color: "warning" }
      case "D": return { src: iconMinusSquare, color: "failure" }
      default: return undefined
    }
  })

  return (
    <Icon src={data()?.src} style={{ color: `var(--${data()?.color})` }} />
  )
}

const ValuesCell: Component<{ json: string }> = props => {
  const entries = createMemo(() => {
    return Object.entries(JSON.parse(props.json))
  })

  return (
    <span style={{ "font-size": "smaller" }}>
      <For each={entries()}>
        {([key, value]) => (
          <Column.Row>
            <Column xxl={4} style={{ "font-style": "italic", "font-weight": "bold", "max-width": "128px" }}>{key}:</Column>
            <Column>{String(value)}</Column>
          </Column.Row>
        )}
      </For>
    </span>
  )
}

const AuditLogView: Component = () => {
  const navigate = useNavigate()

  const isAdmin = createAuthCheck("admin")
  createEffect(() => {
    if (!isAdmin()) {
      navigate("/404")
    }
  })

  const [tableState, setTableState] = createTableState({
    sorting: [
      { id: "timestamp", desc: true },
    ],
  }, { useSearchParams: true })

  createEffect(() => {
    setTableState(state => ({
      ...state,
      columnVisibility: {
        ...state.columnVisibility,
      },
    }))
  })

  const resourceArgs = {
    get window() {
      return {
        offset: (tableState.pagination?.pageIndex ?? 0) * (tableState.pagination?.pageSize ?? 0),
        limit: tableState.pagination?.pageSize ?? 0,
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
  }

  const resource = createGraphQLResource<Query>({
    query: "$/AuditLog.gql",
    variables: {
      get args() {
        return resourceArgs
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

  const table = Table.createContext<AuditLog>({
    getRowId: row => row.id!,
    get data() {
      return resource.data?.listAuditLog?.slice ?? []
    },
    columns: [
      {
        accessorKey: "operation",
        header: "Op",
        cell: props => {
          return (
            <OperationCell op={props.getValue()} />
          )
        },
        meta: { compact: true },
      },
      {
        accessorKey: "srcTable",
        header: "Table",
        meta: { compact: true },
      },
      {
        accessorKey: "description",
        header: "Which",
        cell: props => {
          return (
            <pre style={{ "font-size": "smaller" }}>{props.getValue()}</pre>
          )
        },
      },
      {
        accessorKey: "newValues",
        header: "New",
        cell: props => {
          return (
            <ValuesCell json={props.getValue()} />
          )
        },
      },
      {
        accessorKey: "oldValues",
        header: "Old",
        cell: props => {
          return (
            <ValuesCell json={props.getValue()} />
          )
        },
      },
      {
        accessorKey: "user.username",
        header: "Cause",
        cell: props => {
          return (
            <span>{props.getValue()?.split("@")?.[0] ?? ""}</span>
          )
        },
        meta: { compact: true },
      },
      {
        accessorKey: "timestamp",
        header: "When",
        cell: tableDateCell(undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        meta: { compact: true },
      },
    ],
    state: tableState,
    onPaginationChange: tableOnPaginationChange(setTableState),
    onSortingChange: tableOnSortingChange(setTableState),
    manualPagination: true,
    manualSorting: true,
    get pageCount() {
      return resource.data?.listAuditLog?.pageCount
    },
  })

  return (
    <>
      <Section size="xl" marginY>
        <Title>Audit Log</Title>
        <h3>Audit Log</h3>
      </Section>

      <Section marginY flex style={{ "flex-grow": 1 }}>
        <Table context={table} loading={resource.loading} loadingSize="lg" striped sticky pageQueryParam="i" filterable={false} toolbar={
          <Column.Row />
        } />
      </Section>
    </>
  )
}

export default AuditLogView
