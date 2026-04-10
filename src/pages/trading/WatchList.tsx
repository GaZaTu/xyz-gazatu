// css
import "./WatchList.css"
// js
import { A } from "@gazatu/solid-spectre/ui/A"
import { Component, ComponentProps, createMemo, Show } from "solid-js"

type TickerProps = {
  isin?: string
  href?: string
  logo?: string | URL
  symbol?: string
  name?: string
  open?: boolean
  invalid?: boolean
  value?: number
  currency?: string
  valueAtPreviousClose?: number
  highlighted?: boolean
}

const Ticker: Component<TickerProps> = props => {
  const valueChange = createMemo(() => {
    return (props.value && props.valueAtPreviousClose) && (props.value - props.valueAtPreviousClose)
  })

  const valueChangePercentage = createMemo(() => {
    return (valueChange()) && ((valueChange()! * 100) / props.valueAtPreviousClose!)
  })

  const status = createMemo(() => {
    if (props.open === undefined && props.invalid === undefined) {
      return undefined
    } else if (props.invalid) {
      return "invalid"
    } else if (props.open) {
      return "market"
    } else {
      return "out-of-session"
    }
  })

  return (
    <A class={`tv-widget-watch-list__row tv-site-table__row tv-site-table__row--interactive tv-widget-watch-list__row--interactive quote-ticker-inited ${props.highlighted ? "tv-site-table__row--highlighted tv-widget-watch-list__row--highlighted" : ""}`} href={props.href} style={{ "text-decoration": "none" }}>
      <div class="tv-site-table__column tv-widget-watch-list__main-column" style={{ "max-width": "55%", "padding-right": "0.5rem" }}>
        <Show when={props.logo}>
          <div class="tv-widget-watch-list__icon">
            <img class="tv-circle-logo tv-circle-logo--medium" src={String(props.logo)} alt="" />
          </div>
        </Show>
        <div class="tv-widget-watch-list__name">
          <div class="tv-widget-watch-list__ticker">
            {/* <a href="https://www.tradingview.com/symbols/FOREXCOM-SPXUSD/" target="_blank" class="tv-widget-watch-list__short-name">SPXUSD</a> */}
            <Show when={props.symbol}>
              <span class="tv-widget-watch-list__short-name">{props.symbol}</span>
            </Show>
            {/* <span className="tv-data-mode--watch-list tv-data-mode tv-data-mode--for-watch-list tv-data-mode--realtime--for-watch-list tv-data-mode--for-ticker tv-data-mode--realtime tv-data-mode--realtime--for-ticker" title="Real-time">R</span> */}
            <Show when={status()}>
              <span class={`tv-market-status--watch-list tv-market-status tv-market-status--for-watch-list tv-market-status--${status()} tv-market-status--${status()}--for-watch-list`}>
                <span class="tv-market-status__label tv-market-status__label--for-watch-list">{status()}</span>
                <span class="tv-market-status__dot tv-market-status__dot--for-watch-list" />
              </span>
            </Show>
          </div>
          <Show when={props.name}>
            <div>
              <span class="tv-widget-watch-list__description">{props.name}</span>
            </div>
          </Show>
        </div>
      </div>
      <div class="tv-widget-watch-list__quote-column tv-site-table__column tv-site-table__column--align_right tv-site-table__column--last-phone-vertical">
        <Show when={props.value}>
          <div class="tv-widget-watch-list__last-wrap" style={{ "max-width": "50%" }}>
            {/* <div class={`tv-widget-watch-list__last ${(value && previousValue && (value !== previousValue)) ? (value > previousValue ? 'growing' : 'falling') : ''}`}>{numberUnsignedFormat.format(value)}</div> */}
            <div class="tv-widget-watch-list__last">{numberUnsignedFormat.format(props.value ?? 0)}</div>
          </div>
        </Show>
        <div class={`tv-widget-watch-list__change ${valueChange() ? (valueChange()! >= 0 ? "up" : "down") : ""}`} style={{ width: "80px" }}>
          <Show when={valueChangePercentage()}>
            <span class="tv-widget-watch-list__change-inline">{numberSignedFormat.format(valueChangePercentage()!)}%</span>
          </Show>
          <Show when={valueChange()}>
            <span class="tv-widget-watch-list__change-inline">{numberSignedFormat.format(valueChange()!)}</span>
          </Show>
        </div>
      </div>
    </A>
  )
}

type Props = ComponentProps<"div"> & {}

const WatchList: Component<Props> = props => {
  return (
    <div {...props} class="tv-embed-widget-wrapper theme-dark">
      <div class="tv-embed-widget-wrapper__header" />
      <div class="tv-embed-widget-wrapper__body" style={{ border: "unset" }}>
        <div id="widget-market-overview-container" class="tv-site-widget tv-site-widget--bg_none">
          <div class="tv-widget-watch-list__body-embed">
            <div class="">
              <div class="tv-widget-watch-list">
                <div class="">
                  <div class="tv-site-table tv-widget-watch-list__table tv-site-table--start-border tv-site-table--with-end-border" style={{ "padding-top": "8px", "padding-bottom": "8px" }}>
                    {props.children}
                  </div>
                </div>
              </div>
              <div class="tv-widget-watch-list i-hidden">
                <div class="tv-widget-watch-list__chart" />
                <div class="tv-widget-watch-list__timeframe" />
                <div class="">
                  <div class="tv-site-table tv-widget-watch-list__table tv-site-table--start-border tv-site-table--with-end-border" />
                </div>
              </div>
              <div class="tv-widget-watch-list i-hidden">
                <div class="tv-widget-watch-list__chart" />
                <div class="tv-widget-watch-list__timeframe" />
                <div class="">
                  <div class="tv-site-table tv-widget-watch-list__table tv-site-table--start-border tv-site-table--with-end-border" />
                </div>
              </div>
              <div class="tv-widget-watch-list i-hidden">
                <div class="tv-widget-watch-list__chart" />
                <div class="tv-widget-watch-list__timeframe" />
                <div class="">
                  <div class="tv-site-table tv-widget-watch-list__table tv-site-table--start-border tv-site-table--with-end-border" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Object.assign(WatchList, {
  Ticker,
})

const numberUnsignedFormat = new Intl.NumberFormat("en", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "never",
})

const numberSignedFormat = new Intl.NumberFormat("en", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "always",
})
