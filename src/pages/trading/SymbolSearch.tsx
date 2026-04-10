// css
import "./SymbolSearch.css"
// js
import { A } from "@gazatu/solid-spectre/ui/A"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Figure } from "@gazatu/solid-spectre/ui/Figure"
import { Img } from "@gazatu/solid-spectre/ui/Img"
import { Label } from "@gazatu/solid-spectre/ui/Label"
import { Modal } from "@gazatu/solid-spectre/ui/Modal"
import { ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { Table } from "@gazatu/solid-spectre/ui/Table"
import { createTableState, tableOnGlobalFilterChange } from "@gazatu/solid-spectre/ui/Table.Helpers"
import { Tile } from "@gazatu/solid-spectre/ui/Tile"
import { centerChildren } from "@gazatu/solid-spectre/util/position"
import { Component, ComponentProps, For, Show, createEffect, createSignal } from "solid-js"
import { TraderepublicWebsocket } from "../../lib/traderepublic"

type TradingFilter = {
  id: string
  name: string
  active: boolean
}

type TradingSymbol = {
  isin?: string
  symbol?: string
  name?: string
  logo?: string | URL
}

type Props = ComponentProps<"div"> & {
  search?: string
  onSearchChange?: (search: string) => unknown
  filters?: TradingFilter[]
  onFilterChange?: (filter: TradingFilter) => unknown
  loading?: boolean
  symbols?: TradingSymbol[]
  onSymbolClick?: (symbol: TradingSymbol) => unknown
}

const SymbolSearch: Component<Props> = props => {
  const [tableState, setTableState] = createTableState({})

  const table = Table.createContext({
    get data() {
      return props.symbols
    },
    columns: [
      {
        accessorKey: "__security",
        header: "Security",
        cell: (props) => (
          <Tile compact>
            <Show when={props.row.original.logo}>
              <Tile.Icon>
                <Figure>
                  <Img src={String(props.row.original.logo)} />
                </Figure>
              </Tile.Icon>
            </Show>
            <Tile.Body>
              <Tile.Title>
                <Column.Row>
                  <Column xxl={2}>{props.row.original.symbol}</Column>
                  <Column>{props.row.original.name}</Column>
                </Column.Row>
              </Tile.Title>
              <Tile.Subtitle>
                <Column.Row>
                  <Column xxl={2} />
                  <Column>{props.row.original.isin}</Column>
                </Column.Row>
              </Tile.Subtitle>
            </Tile.Body>
          </Tile>
        ),
        enableSorting: false,
      },
    ],
    state: tableState,
    onGlobalFilterChange: tableOnGlobalFilterChange(setTableState),
    manualFiltering: true,
  })

  createEffect(() => {
    props.onSearchChange?.(tableState.globalFilter)
  })

  const [containerRef, setContainerRef] = createSignal<HTMLElement>()
  createEffect(() => {
    containerRef()?.querySelector("input")?.focus()
  })

  return (
    <div ref={setContainerRef} {...props}>
      <Table context={table} loading={props.loading} loadingSize="sm" striped hidePagination onclickRow={row => props.onSymbolClick?.(row.original)} toolbar={
        <Column.Row class={`${centerChildren(true)}`} style={{ height: "100%" }} gaps="sm">
          <For each={props.filters}>
            {filter => (
              <Column>
                <A onclick={() => props.onFilterChange?.(filter)}>
                  <Label round color={filter.active ? "primary" : undefined}>{filter.name}</Label>
                </A>
              </Column>
            )}
          </For>
        </Column.Row>
      } />
    </div>
  )
}

type SymbolSearchModalProps = {
  socket: TraderepublicWebsocket
  initialSearch?: string
  initialFilter?: "stock" | "fund" | "derivative" | "crypto" | "bond"
  resolve: (isin: string) => void
  reject: () => void
}

const SymbolSearchModal: Component<SymbolSearchModalProps> = props => {
  const [search, setSearch] = createSignal(props.initialSearch ?? "")
  const [filter, setFilter] = createSignal(props.initialFilter ?? "stock")

  const [loading, setLoading] = createSignal(false)
  const [symbols, setSymbols] = createSignal<ComponentProps<typeof SymbolSearch>["symbols"]>()

  createEffect((cleanupPreviousEffect?: () => void) => {
    cleanupPreviousEffect?.()
    const effect = {
      cancelled: false,
    }

    setLoading(true)

    void (async () => {
      const results = await props.socket.search(search(), filter(), 10)
      const symbols = await Promise.all(
        results.map(async ({ isin }) => {
          const instrument = await props.socket.instrument(isin)
          // const exchange = await socket.exchange(instrument).toPromise()
          const details = await props.socket.details(instrument)

          return {
            isin,
            symbol: instrument.intlSymbol || instrument.homeSymbol,
            name: details?.company.name ?? instrument.shortName,
            logo: TraderepublicWebsocket.createAssetURL(instrument.imageId),
          }
        })
      )

      if (effect.cancelled) {
        return
      }

      setSymbols(symbols)
      setLoading(false)
    })()

    return () => {
      effect.cancelled = true

      setSymbols([])
      setLoading(false)
    }
  })

  return (
    <Modal onclose={props.reject} active style={{ padding: 0, "min-height": "50vh" }}>
      <Modal.Body>
        <SymbolSearch
          search={search()}
          onSearchChange={setSearch}
          filters={[
            {
              id: "stock",
              name: "Stocks",
              active: filter() === "stock",
            },
            {
              id: "fund",
              name: "Funds",
              active: filter() === "fund",
            },
            {
              id: "derivative",
              name: "Derivatives",
              active: filter() === "derivative",
            },
            {
              id: "crypto",
              name: "Crypto",
              active: filter() === "crypto",
            },
            {
              id: "bond",
              name: "Bonds",
              active: filter() === "bond",
            },
          ]}
          onFilterChange={filter => setFilter(filter.id as any)}
          symbols={symbols() ?? []}
          onSymbolClick={symbol => props.resolve(symbol.isin!)}
          loading={loading()}
        />
      </Modal.Body>
    </Modal>
  )
}

const openModal = async (props: Omit<SymbolSearchModalProps, "resolve" | "reject">) => {
  return await ModalPortal.push<string | undefined>(modal => (
    <SymbolSearchModal {...props} resolve={modal.resolve} reject={() => modal.resolve(undefined)} />
  ))
}

export default Object.assign(SymbolSearch, {
  openModal,
})
