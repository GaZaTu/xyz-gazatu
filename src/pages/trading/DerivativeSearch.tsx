// css
import "./DerivativeSearch.css"
// js
import { A } from "@gazatu/solid-spectre/ui/A"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Label } from "@gazatu/solid-spectre/ui/Label"
import { Modal } from "@gazatu/solid-spectre/ui/Modal"
import { ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { Table } from "@gazatu/solid-spectre/ui/Table"
import { createTableState } from "@gazatu/solid-spectre/ui/Table.Helpers"
import { Tile } from "@gazatu/solid-spectre/ui/Tile"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { centerChildren } from "@gazatu/solid-spectre/util/position"
import { createAsyncMemo } from "@solid-primitives/memo"
import { Component, ComponentProps, For, createSignal } from "solid-js"
import { TraderepublicDerivativesSub, TraderepublicInstrumentData, TraderepublicWebsocket } from "../../lib/traderepublic"

const dateFormatter = new Intl.DateTimeFormat("en", {
})

const dollarFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
})

type Props = ComponentProps<"div"> & {
  socket: TraderepublicWebsocket
  instrument: TraderepublicInstrumentData
  onDerivativeClick: (isin: string) => void
}

const DerivativeSearch: Component<Props> = props => {
  const [getOptions, setOptions] = createSignal<Partial<TraderepublicDerivativesSub>>({
    productCategory: "vanillaWarrant",
    optionType: "call",
    sortBy: "strike",
    sortDirection: "asc",
  })

  const derivatives = createAsyncMemo(async () => {
    const {
      productCategory,
      optionType,
      sortBy,
      sortDirection,
      strike,
    } = getOptions()

    try {
      const derivatives = await props.socket.derivatives(props.instrument, {
        productCategory,
        optionType,
        sortBy,
        sortDirection,
        strike,
      })

      const now = new Date()
      derivatives.results = derivatives.results.filter(d => {
        try {
          return new Date(d.expiry).getFullYear() <= now.getFullYear()
        } catch {
          return true
        }
      })

      return derivatives.results
    } catch (error) {
      Toaster.pushError(error)

      return []
    }
  })

  const [tableState] = createTableState({
    pagination: {
      pageIndex: 0,
      pageSize: 100,
    },
  })

  const table = Table.createContext({
    get data() {
      return derivatives() ?? []
    },
    columns: [
      {
        accessorKey: "__delta",
        header: "Delta",
        cell: (props) => (
          <Tile compact>
            <Tile.Body>
              <Tile.Title>{props.row.original.delta.toFixed(2)}</Tile.Title>
              <Tile.Subtitle>{dateFormatter.format(new Date(props.row.original.expiry ?? 0))} - {props.row.original.issuerDisplayName}</Tile.Subtitle>
            </Tile.Body>
          </Tile>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "__strike",
        header: "Strike",
        cell: (props) => (
          <span>{dollarFormatter.format(props.row.original.strike ?? 0)}</span>
        ),
        enableSorting: false,
      },
    ],
    state: tableState,
    // onGlobalFilterChange: tableOnGlobalFilterChange(setTableState),
    manualFiltering: true,
    manualSorting: true,
    onSortingChange: state => {
      // ignore
    },
  })

  return (
    <Table context={table} loadingSize="sm" striped hidePagination onclickRow={row => props.onDerivativeClick(row.original.isin)} toolbar={
      <Column.Row class={`${centerChildren(true)}`} style={{ height: "100%" }} gaps="sm">
        <For each={[{ id: "call", name: "Call" }, { id: "put", name: "Put" }]}>
          {filter => (
            <Column>
              <A onclick={() => setOptions(o => ({ ...o, optionType: filter.id as any }))}>
                <Label round color={getOptions().optionType === filter.id ? "primary" : undefined}>{filter.name}</Label>
              </A>
            </Column>
          )}
        </For>
      </Column.Row>
    } />
  )
}

const openModal = async (props: Omit<Props, "onDerivativeClick">) => {
  return await ModalPortal.push<string | undefined>(modal => {
    return (
      <Modal size="md" onclose={() => modal.resolve(undefined)} active>
        <Modal.Body>
          <DerivativeSearch {...props} onDerivativeClick={modal.resolve} />
        </Modal.Body>
      </Modal>
    )
  })
}

export default Object.assign(DerivativeSearch, {
  openModal,
})
