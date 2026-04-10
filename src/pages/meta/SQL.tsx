import { iconArchive } from "@gazatu/solid-spectre/icons/iconArchive"
import { iconPlus } from "@gazatu/solid-spectre/icons/iconPlus"
import { iconSave } from "@gazatu/solid-spectre/icons/iconSave"
import { iconSend } from "@gazatu/solid-spectre/icons/iconSend"
import { iconTrash2 } from "@gazatu/solid-spectre/icons/iconTrash2"
import { A } from "@gazatu/solid-spectre/ui/A"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Form } from "@gazatu/solid-spectre/ui/Form"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { Input } from "@gazatu/solid-spectre/ui/Input"
import { ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { Nav } from "@gazatu/solid-spectre/ui/Nav"
import { Navbar } from "@gazatu/solid-spectre/ui/Navbar"
import { OffCanvas } from "@gazatu/solid-spectre/ui/OffCanvas"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Table } from "@gazatu/solid-spectre/ui/Table"
import { createTableState, tableOnGlobalFilterChange, tableOnPaginationChange, tableOnSortingChange } from "@gazatu/solid-spectre/ui/Table.Helpers"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { computedColorScheme } from "@gazatu/solid-spectre/util/colorScheme"
import { makePersisted } from "@solid-primitives/storage"
import { useSearchParams } from "@solidjs/router"
import * as monaco from "monaco-editor"
import { Component, For, createEffect, createMemo, createSignal } from "solid-js"
import { ulid } from "ulid"
import fetchGraphQL, { gql } from "../../lib/fetchGraphQL"
import { Mutation } from "../../lib/schema.gql"
import "./SQL.scss"

self.MonacoEnvironment = {
  getWorker: async (workerId, label) => {
    const { default: Worker } = await import("monaco-editor/esm/vs/editor/editor.worker?worker")

    const worker = new Worker({ name: label })
    return worker
  },
}

// type MonacoProps = ComponentProps<"div"> & {
//   value?: string
//   onValueChange?: (value: string) => void
//   onValueCommit?: () => void
//   options?: monaco.editor.IStandaloneEditorConstructionOptions
// }

// const MonacoEditor: Component<MonacoProps> = props => {
//   const [monacoProps, containerProps] = splitProps(props, ["value", "onValueChange", "onValueCommit", "options"])

//   createEffect(() => {
//     monaco.editor.setTheme(computedColorScheme() === "dark" ? "vs-dark" : "vs")
//   })

//   const [getContainer, setContainer] = createSignal<HTMLElement>()
//   const editor = createMemo(() => {
//     const container = getContainer()
//     if (!container) {
//       return undefined
//     }

//     const editor = monaco.editor.create(container, monacoProps.options)

//     editor.onKeyDown(event => {
//       if (event.keyCode === monaco.KeyCode.Enter && (event.shiftKey || event.ctrlKey)) {
//         event.stopPropagation()
//         event.preventDefault()

//         monacoProps.onValueCommit?.()
//       }
//     })

//     return editor
//   })

//   createEffect(() => {
//     editor()?.setValue(monacoProps.value ?? "")
//   })

//   return (
//     <div {...containerProps} ref={setContainer} />
//   )
// }

type SQLQuery = {
  id: string
  title: string
  sql: string
}

const SQLView: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [getQueries, setQueries] = makePersisted(createSignal<SQLQuery[]>([]), {
    name: "LOG_SERVER_CUSTOM_SQL_QUERIES",
  })

  const [getTitle, setTitle] = createSignal("")
  const [getSQL, setSQL] = createSignal("")

  const [isLoading, setLoading] = createSignal(false)
  const [getResult, setResult] = createSignal<{ error: string | null, data: Record<string, any>[], keys: string[] }>()

  createEffect(() => {
    const id = searchParams.id

    const query = getQueries()?.find(q => q.id === id)
    if (!query) {
      setTitle("")
      setSQL("")
      setResult(undefined)
      return
    }

    setTitle(query.title)
    setSQL(query.sql)
    setResult(undefined)
  })

  const [tableState, setTableState] = createTableState({}, {})

  const table = Table.createContext<Record<string, any>>({
    getRowId: row => row.id!,
    get data() {
      const result = getResult()
      if (result?.error) {
        return [{ error: result.error.replace("Error:", "").trim() }]
      }

      return result?.data ?? []
    },
    get columns() {
      const result = getResult()
      if (result?.error) {
        return [{ accessorKey: "error", header: () => <span style={{ color: "var(--failure)" }}>ERROR</span> }]
      }

      return result?.keys
        .map(k => ({ accessorKey: k })) ?? []
    },
    state: tableState,
    onPaginationChange: tableOnPaginationChange(setTableState),
    onSortingChange: tableOnSortingChange(setTableState),
    onGlobalFilterChange: tableOnGlobalFilterChange(setTableState),
  })

  const handleSave = () => {
    let id = searchParams.id
    if (!id) {
      id = ulid()
    }

    setSearchParams({ id })
    setQueries(q => [
      {
        id: String(id),
        title: getTitle() ?? "",
        sql: editor()?.getValue() ?? "",
      },
      ...(q ?? []).filter(q => q.id !== id),
    ])
  }

  const autoSave = () => {
    if (!searchParams.id) {
      return
    }

    handleSave()
  }

  const handleDrop = async () => {
    if (!await ModalPortal.confirm("Delete Query?")) {
      return
    }

    const id = searchParams.id

    setSearchParams({ id: "" })
    setQueries(q => [
      ...(q ?? []).filter(q => q.id !== id),
    ])
  }

  const handleSendSQLQuery = async () => {
    autoSave()

    setLoading(true)
    try {
      const { sqlQuery } = await fetchGraphQL<Mutation>({
        query: gql`
          mutation ($sql: String!) {
            sqlQuery(sql: $sql) {
              error
              dataAsJson
            }
          }
        `,
        variables: {
          sql: editor()?.getValue() ?? "",
        },
      })
      if (!sqlQuery) {
        throw new Error("unexpected")
      }

      if (sqlQuery.error) {
        setResult({
          error: sqlQuery.error,
          data: [],
          keys: [],
        })
      }

      if (sqlQuery.dataAsJson) {
        const json = JSON.parse(sqlQuery.dataAsJson) as Record<string, any>[]
        if (!json.length) {
          setResult({
            error: null,
            data: [],
            keys: [],
          })
          return
        }

        setResult({
          error: null,
          data: json,
          keys: Object.keys(json[0]),
        })
      }
    } catch (error) {
      Toaster.pushError(error)
    } finally {
      setLoading(false)
    }
  }

  const [editorContainer, setEditorContainer] = createSignal<HTMLElement>()
  const editor = createMemo(() => {
    const container = editorContainer()
    if (!container) {
      return undefined
    }

    const editor = monaco.editor.create(container, {
      value: "",
      language: "sql",
      automaticLayout: true,
      minimap: { enabled: false },
    })

    editor.onKeyDown(event => {
      if (event.keyCode === monaco.KeyCode.Enter && (event.shiftKey || event.ctrlKey)) {
        event.stopPropagation()
        event.preventDefault()

        handleSendSQLQuery()
      }
    })

    return editor
  })

  createEffect(() => {
    editor()?.setValue(getSQL() ?? "")
  })

  createEffect(() => {
    monaco.editor.setTheme(computedColorScheme() === "dark" ? "vs-dark" : "vs")
  })

  return (
    <>
      <OffCanvas class="sql-runner">
        <OffCanvas.Sidebar class="sidebar"
          toggle={<Icon src={iconArchive} />}
          sidebarTitle={
            <Navbar>
              <Navbar.Section>
                <h5 style={{ "margin-bottom": "0" }}>Queries</h5>
              </Navbar.Section>

              <Navbar.Section>
                <Button.A color="gray" href="?" action>
                  <Icon src={iconPlus} />
                </Button.A>
              </Navbar.Section>
            </Navbar>
          }
        >
          <Nav>
            <For each={getQueries()}>
              {query => (
                <A href="/sql" params={{ id: query.id }} class={`${query.id === searchParams.id ? "active" : ""}`}>
                  <Nav.Item>
                    {query.title}
                  </Nav.Item>
                </A>
              )}
            </For>
          </Nav>
        </OffCanvas.Sidebar>

        <OffCanvas.Content>
          <Section size="xl" marginY>
            <Form.Group label="title">
              <Input.Group>
                <Input name="title" value={getTitle()} onTextChange={setTitle} />

                <Input.Group.Addon class="title-addon">
                  <Button onclick={e => handleDrop()} color="failure" disabled={isLoading() || !searchParams.id}>
                    <Icon src={iconTrash2} />
                  </Button>
                </Input.Group.Addon>

                <Input.Group.Addon class="title-addon">
                  <Button onclick={e => handleSave()} color="primary" disabled={isLoading()}>
                    <Icon src={iconSave} />
                  </Button>
                </Input.Group.Addon>
              </Input.Group>
            </Form.Group>
          </Section>

          <Section size="xl" marginY>
            <Form>
              <Form.Group label="SQL">
                <div ref={setEditorContainer} style={{ width: "100%", height: "300px" }} />
                {/* <MonacoEditor value={getSQL()} onValueChange={setSQL} onValueCommit={handleSendSQLQuery}
                  options={{
                    value: "",
                    language: "sql",
                    automaticLayout: true,
                    minimap: { enabled: false },
                  }}
                  style={{ width: "100%", height: "300px" }}
                /> */}
              </Form.Group>
            </Form>
          </Section>

          <Section marginY>
            <Table context={table} loading={isLoading()} loadingSize="lg" striped sticky toolbar={
              <Column.Row>
                <Column>
                  <Button type="button" color="primary" action circle onclick={handleSendSQLQuery} loading={isLoading()}>
                    <Icon src={iconSend} />
                  </Button>
                </Column>
              </Column.Row>
            } />
          </Section>
        </OffCanvas.Content>
      </OffCanvas>
    </>
  )
}

export default SQLView
