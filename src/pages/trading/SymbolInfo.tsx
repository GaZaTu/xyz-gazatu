// css
import "./SymbolInfo.css"
// js
import { A } from "@gazatu/solid-spectre/ui/A"
import { Component, ComponentProps, createMemo, For, Show } from "solid-js"

type Props = ComponentProps<"div"> & {
  logo?: string | URL
  name?: string
  isin?: string
  symbol?: string
  countryFlag?: string | URL
  country?: string
  exchange?: string
  value?: number
  currency?: string
  valueAtPreviousClose?: number
  buyIn?: number
  shares?: number
  open?: boolean
  openStatusSince?: number
  meta?: {
    key: string
    value?: unknown
    href?: string
    title?: string
    width?: string
    highlighted?: boolean
    upperCase?: boolean
  }[]
}

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

const SymbolInfo: Component<Props> = props => {
  const valueChange = createMemo(() => {
    return (props.value && props.valueAtPreviousClose) && (props.value - props.valueAtPreviousClose)
  })

  const valueChangePercentage = createMemo(() => {
    return (valueChange()) && ((valueChange()! * 100) / props.valueAtPreviousClose!)
  })

  const openStatusSinceDateString = createMemo(() => {
    return (props.openStatusSince) && new Date(props.openStatusSince).toISOString() // TODO: only time if same date
  })

  const valueSinceBuyInChange = createMemo(() => {
    return (props.value && props.buyIn) && (props.value - props.buyIn)
  })

  const valueSinceBuyInChangePercentage = createMemo(() => {
    return (valueSinceBuyInChange()) && ((valueSinceBuyInChange()! * 100) / props.buyIn!)
  })

  return (
    <div {...props} class="tv-embed-widget-wrapper theme-dark">
      <div class="tv-embed-widget-wrapper__header" />
      <div class="tv-embed-widget-wrapper__body" style={{ border: "unset" }}>
        <div id="symbol-info-widget" class="tv-category-header tv-category-header--transparent tv-symbol-info-widget">
          <div class="tv-category-header__content tv-symbol-info-widget__content">
            <a class="tv-category-header__title-line tv-symbol-info-widget__title-line tv-symbol-info-widget__link" href="?" style={{ "pointer-events": "none" }}>
              <Show when={props.logo}>
                <img class="tv-circle-logo tv-circle-logo--large tv-category-header__icon" src={String(props.logo)} alt="" />
              </Show>
              <div class="tv-category-header__title">
                <div class="tv-symbol-header tv-symbol-header--mobile-adaptive">
                  <div>
                    <h1 class="tv-symbol-header__first-line tv-symbol-info-widget__first-line" style={{ display: "inline" }}>{props.name}</h1>
                    <Show when={props.isin}>
                      <div class="tv-symbol-price-quote__supply">
                        <div class="tv-symbol-price-quote__currency">{props.isin}</div>
                      </div>
                    </Show>
                  </div>
                  <Show when={props.symbol || (props.exchange || props.countryFlag)}>
                    <span class="tv-symbol-header__second-line">
                      <Show when={props.symbol}>
                        <span class="tv-symbol-header__second-line--text">{props.symbol}</span>
                      </Show>
                      <Show when={props.exchange || props.countryFlag}>
                        <span class="tv-symbol-header__exchange-container">
                          <Show when={props.countryFlag}>
                            <img class="tv-circle-logo tv-circle-logo--medium tv-symbol-header__exchange-logo" src={String(props.countryFlag)} alt="" style={{ "margin-top": "-2px" }} />
                          </Show>
                          <Show when={!props.countryFlag}>
                            <span style={{ "font-weight": "bold", "margin-right": "0.5em" }}>@</span>
                          </Show>
                          <Show when={props.exchange}>
                            <span class="tv-symbol-header__exchange">{props.exchange}</span>
                          </Show>
                        </span>
                      </Show>
                    </span>
                  </Show>
                </div>
                <div class="tv-symbol-header tv-symbol-header--mobile-adaptive tv-symbol-header--mobile">
                  <div>
                    <div class="tv-symbol-header__first-line tv-symbol-info-widget__first-line" style={{ display: "inline" }}>{props.symbol ?? props.name}</div>
                    <Show when={props.isin}>
                      <div class="tv-symbol-price-quote__supply">
                        <div class="tv-symbol-price-quote__currency">{props.isin}</div>
                      </div>
                    </Show>
                  </div>
                  <Show when={props.symbol || (props.exchange || props.countryFlag)}>
                    <span class="tv-symbol-header__second-line">
                      <Show when={props.symbol}>
                        <span class="tv-symbol-header__second-line--text">{props.symbol}</span>
                      </Show>
                      <Show when={props.exchange || props.countryFlag}>
                        <span class="tv-symbol-header__exchange-container">
                          <Show when={props.countryFlag}>
                            <img class="tv-circle-logo tv-circle-logo--medium tv-symbol-header__exchange-logo" src={String(props.countryFlag)} alt="" style={{ "margin-top": "-2px" }} />
                          </Show>
                          <Show when={!props.countryFlag}>
                            <span style={{ "font-weight": "bold", "margin-right": "0.5em" }}>@</span>
                          </Show>
                          <Show when={props.exchange}>
                            <span class="tv-symbol-header__exchange">{props.exchange}</span>
                          </Show>
                        </span>
                      </Show>
                    </span>
                  </Show>
                </div>
              </div>
            </a>
            <div class="tv-category-header__price-line">
              <div class="tv-category-header__main-price" style={{ height: props.shares ? "69px" : undefined }}>
                <div class="tv-scroll-wrap tv-scroll-wrap--horizontal">
                  <div class="tv-category-header__main-price-content">
                    <div class="tv-symbol-price-quote">
                      <Show when={props.value}>
                        <div class="tv-symbol-price-quote__row">
                          <div class="tv-symbol-price-quote__value">
                            <span>{numberUnsignedFormat.format(props.value!)}</span>
                          </div>
                          <Show when={props.currency}>
                            <div class="tv-symbol-price-quote__supply">
                              {/* <div class="tv-symbol-price-quote__data-mode tv-data-mode tv-data-mode--size_large tv-data-mode--no-realtime tv-data-mode--delayed tv-data-mode--delayed--no-realtime" title="Quotes are delayed by 15 min">D</div> */}
                              <div class="tv-symbol-price-quote__currency">{props.currency}</div>
                            </div>
                          </Show>
                          <Show when={valueChange()}>
                            <div class={`tv-symbol-price-quote__change tv-symbol-price-quote__change--${valueChange()! >= 0 ? "growing" : "falling"}`}>
                              <span class="tv-symbol-price-quote__change-value">{numberSignedFormat.format(valueChange()!)}</span>
                              <span class="tv-symbol-price-quote__change-value" style={{ "margin-left": "0.25em" }}>({numberSignedFormat.format(valueChangePercentage()!)}%)</span>
                            </div>
                          </Show>
                        </div>
                      </Show>
                      <Show when={props.value && props.shares}>
                        <div class="tv-symbol-price-quote__sub-line" style={{ "text-transform": "unset" }}>
                          <div class="tv-symbol-price-quote__supply">
                            <div class="tv-symbol-price-quote__currency">x{props.shares}=</div>
                          </div>
                          <div class="tv-symbol-price-quote__value" style={{ "font-size": "28px" }}>
                            <span>{numberUnsignedFormat.format(props.value! * props.shares!)}</span>
                          </div>
                          <Show when={props.currency}>
                            <div class="tv-symbol-price-quote__supply">
                              <div class="tv-symbol-price-quote__currency">{props.currency}</div>
                            </div>
                          </Show>
                          <Show when={valueSinceBuyInChange()}>
                            <div class={`tv-symbol-price-quote__change tv-symbol-price-quote__change--${valueSinceBuyInChange()! >= 0 ? "growing" : "falling"}`} style={{ "font-size": "14px" }}>
                              <span class="tv-symbol-price-quote__change-value">{numberSignedFormat.format(valueSinceBuyInChange()! * props.shares!)}</span>
                              <span class="tv-symbol-price-quote__change-value" style={{ "margin-left": "0.25em" }}>({numberSignedFormat.format(valueSinceBuyInChangePercentage()!)}%)</span>
                            </div>
                          </Show>
                        </div>
                      </Show>
                      {/* {(open !== undefined) && (
                        <div class="tv-symbol-price-quote__sub-line">
                          <span class={`tv-symbol-price-quote__market-stat tv-symbol-price-quote__market-stat--${open ? 'open' : 'closed'}`}>Market {open ? 'Open' : 'Closed'}</span>
                          {openStatusSinceDateString && (
                            <span>(as of {openStatusSinceDateString})</span>
                          )}
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
              <div class="tv-category-header__rtc-price-group-fundamentals">
                <div class="tv-scroll-wrap tv-scroll-wrap--horizontal">
                  <div class="tv-category-header__rtc-price-group-fundamentals-content">
                    <div class="tv-symbol-price-quote tv-category-header__rtc-price i-hidden">
                      <div class="tv-symbol-price-quote__row tv-symbol-price-quote__row--small">
                        <Show when={props.value}>
                          <div class="tv-symbol-price-quote__value tv-symbol-price-quote__value--small">{numberUnsignedFormat.format(props.value!)}</div>
                        </Show>
                        <Show when={valueChange()}>
                          <div class={`tv-symbol-price-quote__change tv-symbol-price-quote__change--${valueChange()! >= 0 ? "growing" : "falling"}`}>
                            <span class="tv-symbol-price-quote__change-value">{numberSignedFormat.format(valueChange()!)}</span>
                            <span class="tv-symbol-price-quote__change-value" style={{ "margin-left": "0.25em" }}>({numberSignedFormat.format(valueChangePercentage()!)}%)</span>
                          </div>
                        </Show>
                      </div>
                      <Show when={props.open !== undefined}>
                        <div class="tv-symbol-price-quote__sub-line">
                          <span class="tv-symbol-price-quote__market-stat" />
                          <Show when={openStatusSinceDateString()}>
                            <span>(as of {openStatusSinceDateString()})</span>
                          </Show>
                        </div>
                      </Show>
                    </div>
                    <div class="tv-category-header__fundamentals tv-category-header__fundamentals--price-group">
                      <For each={props.meta?.filter(entry => !!entry.value)}>
                        {entry => {
                          const valueDiv = (
                            <div class={`tv-fundamental-block__value ${entry.highlighted ? "tv-fundamental-block__value--highlighted" : ""} ${entry.upperCase ? "tv-fundamental-block__value--sentence-cased" : ""}`}>{String(entry.value)}</div>
                          )
                          const keyDiv = (
                            <div class="tv-fundamental-block__title">{entry.key}</div>
                          )

                          return (
                            <div class="tv-fundamental-block tv-category-header__fundamentals-block" title={entry.title} style={{ width: entry.width }}>
                              <Show when={entry.href}>
                                <A href={entry.href}>{valueDiv}</A>
                              </Show>
                              <Show when={!entry.href}>
                                {valueDiv}
                              </Show>
                              {keyDiv}
                            </div>
                          )
                        }}
                      </For>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tv-category-header__fundamentals">
                <For each={props.meta?.filter(entry => !!entry.value)}>
                  {entry => {
                    const valueDiv = (
                      <div class={`tv-fundamental-block__value ${entry.highlighted ? "tv-fundamental-block__value--highlighted" : ""} ${entry.upperCase ? "tv-fundamental-block__value--sentence-cased" : ""}`}>{String(entry.value)}</div>
                    )
                    const keyDiv = (
                      <div class="tv-fundamental-block__title">{entry.key}</div>
                    )

                    return (
                      <div class="tv-fundamental-block tv-category-header__fundamentals-block" title={entry.title} style={{ width: entry.width }}>
                        <Show when={entry.href}>
                          <A href={entry.href}>{valueDiv}</A>
                        </Show>
                        <Show when={!entry.href}>
                          {valueDiv}
                        </Show>
                        {keyDiv}
                      </div>
                    )
                  }}
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SymbolInfo
