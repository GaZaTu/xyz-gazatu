// css
import "./Chart.css"
// js
import { ADX, SMA } from "@debut/indicators"
import { iconBookmark } from "@gazatu/solid-spectre/icons/iconBookmark"
import { iconSearch } from "@gazatu/solid-spectre/icons/iconSearch"
import { A } from "@gazatu/solid-spectre/ui/A"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { Label } from "@gazatu/solid-spectre/ui/Label"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { makePersisted } from "@solid-primitives/storage"
import { useNavigate, useSearchParams } from "@solidjs/router"
import { CandlestickSeries, HistogramSeries, LineSeries, type BarData, type IChartApi, type IPriceLine, type SeriesMarker } from "lightweight-charts"
import { Component, For, createEffect, createMemo, createRenderEffect, createSignal, onCleanup } from "solid-js"
import { Subscription, TraderepublicAggregateHistoryLightData, TraderepublicAggregateHistoryLightSub, TraderepublicHomeInstrumentExchangeData, TraderepublicInstrumentData, TraderepublicStockDetailsData, TraderepublicWebsocket } from "../../lib/traderepublic"
import { analyzeCandles } from "./CandleAnalysis"
import DerivativeSearch from "./DerivativeSearch"
import SymbolInfo from "./SymbolInfo"
import SymbolSearch from "./SymbolSearch"
import WatchList from "./WatchList"

const dateFormat = new Intl.DateTimeFormat("en", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
})

const currencyFormat = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
})

const numberCompactFormat = new Intl.NumberFormat("en", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
  notation: "compact",
})

const intradayHistory = {
  300: {} as { [isin: string]: TraderepublicAggregateHistoryLightData["aggregates"] | undefined },
  600: {} as { [isin: string]: TraderepublicAggregateHistoryLightData["aggregates"] | undefined },
}

const ChartView: Component = props => {
  const [search, setSearch] = useSearchParams()

  const navigate = useNavigate()

  const [timeRange, setTimeRange] = makePersisted(createSignal<"5min" | TraderepublicAggregateHistoryLightSub["range"]>("1d"), {
    name: "CHART_TIME_RANGE2",
  })

  const [instrument, setInstrument] = createSignal<TraderepublicInstrumentData>()
  const [exchange, setExchange] = createSignal<TraderepublicHomeInstrumentExchangeData>()
  const [details, setDetails] = createSignal<TraderepublicStockDetailsData>()
  const [value, setValue] = createSignal({
    current: 0,
    previous: 0,
  })
  const [, setPrice] = createSignal(0)

  const socket = new TraderepublicWebsocket("DE")
  Toaster.try(async () => {
    await socket.connect()
  })
  onCleanup(() => {
    socket.close()
  })

  type WatchListEntry = {
    isin: string
    buyIn?: number
    shares?: number
  }

  const [watchList, setWatchList] = makePersisted(createSignal<WatchListEntry[]>([]), {
    name: "CHART_WATCH_LIST3",
  })

  type WatchedInstrument = WatchListEntry & {
    data: ReturnType<typeof instrument>
    exchange: ReturnType<typeof exchange>
    details: ReturnType<typeof details>
    value: ReturnType<typeof value>
  }

  const [watchedInstruments, setWatchedInstruments] = createSignal([] as WatchedInstrument[])
  createRenderEffect(() => {
    const effect = {
      cancelled: false,
      subscriptions: [] as Subscription[],
    }

    void (async () => {
      setWatchedInstruments(r => {
        return watchList()
          ?.map(watched => {
            const current = r.find(i => i.isin === watched.isin)

            return {
              ...watched,
              data: undefined,
              exchange: undefined,
              details: undefined,
              value: {
                current: 0,
                previous: 0,
              },
              history: [],
              ...current,
            }
          }) ?? []
      })

      for (const { isin } of watchList() ?? []) {
        const instrument = await socket.instrument(isin)
        const exchange = await socket.exchange(instrument).toPromise()
        const details = await socket.details(instrument)
        const history = await socket.aggregateHistory(instrument, "1d", exchange)

        if (effect.cancelled) {
          return
        }

        if (!intradayHistory[600][instrument.isin]) {
          intradayHistory[600][instrument.isin] = history.aggregates
        }

        setWatchedInstruments(r => r.map(i => {
          if (i.isin !== isin) {
            return i
          }

          return {
            ...i,
            data: instrument,
            exchange,
            details,
          }
        }))

        effect.subscriptions.push(
          socket.ticker(instrument).subscribe(data => {
            if (effect.cancelled) {
              return
            }

            setWatchedInstruments(r => r.map(i => {
              if (i.isin !== isin) {
                return i
              }

              for (const [key, history] of Object.entries(intradayHistory)) {
                const barTimeToLive = Number(key)
                const currentHistory = history[i.isin]
                if (!currentHistory) {
                  continue
                }

                const currentBar = currentHistory[currentHistory.length - 1]

                if ((data.bid.time - (currentBar?.time ?? 0)) >= (barTimeToLive * 1000)) {
                  if (currentBar) {
                    currentHistory[currentHistory.length - 1] = {
                      ...currentBar,
                      close: data.last.price,
                    }
                  }

                  currentHistory.push({
                    time: data.bid.time,
                    open: data.bid.price,
                    high: data.bid.price,
                    low: data.bid.price,
                    close: data.bid.price,
                    volume: 0,
                    adjValue: "0",
                  })
                } else {
                  currentHistory[currentHistory.length - 1] = {
                    ...currentBar,
                    close: data.bid.price,
                    low: Math.min(currentBar.low, data.bid.price),
                    high: Math.max(currentBar.high, data.bid.price),
                  }
                }
              }

              return {
                ...i,
                value: {
                  current: data.bid.price,
                  previous: data.pre.price,
                },
              }
            }))
          })
        )
      }
    })()

    return () => {
      effect.cancelled = true
      effect.subscriptions.forEach(s => s.unsubscribe())
    }
  }, [socket, watchList, timeRange])

  // const portfolio = createMemo(() => {
  //   return watchedInstruments()
  //     .map(instrument => {
  //       const { buyIn, shares } = watchList()!.find(({ isin }) => instrument.isin)!

  //       return {
  //         ...instrument,
  //         owned: {
  //           buyIn: buyIn ?? 0,
  //           shares: shares ?? 0,
  //         },
  //       }
  //     })
  //     .filter(({ owned }) => owned.buyIn && owned.shares)
  // }, [watchedInstruments, watchList])

  // const portfolioValue = useMemo(() => {
  //   return portfolio
  //     .reduce((portfolioValue, { value, owned }) => portfolioValue + (value.current * owned.shares), 0)
  // }, [portfolio])

  const [chartContainer, setChartContainer] = createSignal<HTMLDivElement>()
  let chart = undefined as IChartApi | undefined

  createEffect(async (cleanupPreviousEffect?: Promise<() => void>) => {
    const isin = search.isin
    const range = timeRange()

    void (await cleanupPreviousEffect)?.()
    const effect = {
      cancelled: false,
      subscriptions: [] as Subscription[],
    }

    if (!chartContainer()) {
      return () => undefined as void
    }

    if (!chart) {
      const {
        createChart,
        ColorType,
      } = await import("lightweight-charts")

      chart = createChart(chartContainer()!, {
        layout: {
          background: {
            type: ColorType.Solid,
            color: "#1E222D",
          },
          textColor: "#D9D9D9",
          fontSize: 14,
        },
        crosshair: {
          horzLine: {
            color: "#758696",
          },
          vertLine: {
            color: "#758696",
          },
        },
        grid: {
          horzLines: {
            color: "#363C4E",
          },
          vertLines: {
            color: "#2B2B43",
          },
        },
        timeScale: {
          // borderVisible: false,
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          // borderVisible: false,
          // mode: PriceScaleMode.Percentage,
        },
        localization: {
          priceFormatter: (price: number) => currencyFormat.format(price),
          // timeFormatter: (time: number) => timeFormat.format(new Date(time * 1000)),
        },
      })
    }

    let movingAverageData = new SMA(0)
    const movingAverageSeries = chart.addSeries(LineSeries, {
      baseLineVisible: false,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
      color: "#aaffff77",
    })

    let averageDirectionalIndexData = new ADX(0)
    const averageDirectionalIndexSeries = chart.addSeries(HistogramSeries, {
      baseLineVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
      priceScaleId: "",
      priceFormat: {
        type: "volume",
      },
    })
    averageDirectionalIndexSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      // fdm
    })
    const seriesMarkers = [] as SeriesMarker<any>[]

    let currentBar = { time: 0 } as BarData
    let previousBar = { time: 0 } as BarData
    let previousClose: IPriceLine | undefined

    void (async () => {
      if (isin?.length !== 12) {
        return
      }

      const instrument = await socket.instrument(String(isin))
      setInstrument(instrument)

      const exchange = await new Promise<TraderepublicHomeInstrumentExchangeData>(resolve => {
        socket.exchange(instrument).subscribe(exchange => {
          if (effect.cancelled) {
            return
          }

          setExchange(exchange)
          resolve(exchange)
        })
      })

      socket.details(instrument).then(details => {
        if (effect.cancelled) {
          return
        }

        setDetails(details)
      })

      const timezoneOffset = (new Date().getTimezoneOffset() / 60) * -1
      const mapUnixToUTC = (time: number) =>
        Math.floor(time / 1000) + (60 * 60 * timezoneOffset) as any

      let barTimeToLive = 0
      let priceBeforeChart = 0

      const updateMarkers = (_candles: (Parameters<typeof analyzeCandles>[0][number] & { time: number })[], mapTime = mapUnixToUTC) => {
        const candles = analyzeCandles(_candles)
        candles.sort((a, b) => a.time - b.time)

        for (const candle of candles) {
          const time = mapTime(candle.time)
          const pattern = candle.patterns[0]
          const text = pattern.name

          if (pattern.type === "bullish") {
            seriesMarkers.push({
              id: time,
              time,
              position: "belowBar",
              color: "green",
              shape: "arrowUp",
              text,
              size: 0.6,
            })
          } else {
            seriesMarkers.push({
              id: time,
              time,
              position: "aboveBar",
              color: "red",
              shape: "arrowDown",
              text,
              size: 0.6,
            })
          }
        }

        // TODO: restore (maybe... probably not)
        // series.setMarkers(seriesMarkers)
      }

      const history = {
        resolution: 0,
        aggregates: [] as TraderepublicAggregateHistoryLightData["aggregates"],
      }

      if (range === "5min" || range === "1d") {
        const key = (range === "5min") ? 300 : 600
        const currentHistory = intradayHistory[key][instrument.isin]
        if (currentHistory?.length) {
          history.aggregates = currentHistory
          history.resolution = key * 1000
        }
      }

      if (!history.aggregates.length) {
        const { resolution, aggregates } = await socket.aggregateHistory(instrument, range === "5min" ? "1d" : range!, exchange)
        Object.assign(history, { resolution, aggregates })

        if (effect.cancelled) {
          return
        }
      }

      priceBeforeChart = history.aggregates[0]?.close ?? 0
      barTimeToLive = history.resolution / 1000
      if (range === "5min") {
        barTimeToLive /= 2
      }

      for (const aggregate of history.aggregates) {
        const utcTimestamp = mapUnixToUTC(aggregate.time)

        previousBar = currentBar
        currentBar = {
          time: utcTimestamp,
          open: aggregate.open,
          close: aggregate.close,
          low: aggregate.low,
          high: aggregate.high,
        }

        if (range === "5min") {
          series.update({
            time: (Number(currentBar.time) - barTimeToLive) as any,
            open: currentBar.open,
            high: currentBar.open,
            low: currentBar.open,
            close: currentBar.open,
          })
        }

        series.update(currentBar)
      }

      if (range === "1d" || range === "5d" || range === "1m" || range === "3m") {
        updateMarkers(history.aggregates.slice(history.aggregates.length / 2))
      }

      if (range === "5d" || range === "1m") {
        const begin = history.aggregates[0].time
        const end = history.aggregates[history.aggregates.length - 1].time
        const timePeriodInDays = Math.ceil((end - begin) / (24 * 60 * 60 * 1000))
        const timePeriod = Math.max(Math.min(timePeriodInDays, 14), 7)

        movingAverageData = new SMA(timePeriod)
        averageDirectionalIndexData = new ADX(timePeriod)

        for (const aggregate of history.aggregates) {
          const time = mapUnixToUTC(aggregate.time)

          const smaValue = movingAverageData.nextValue(aggregate.close)
          movingAverageSeries.update({
            time,
            value: smaValue ?? undefined,
          })

          const adxValue = averageDirectionalIndexData.nextValue(aggregate.high, aggregate.low, aggregate.close)
          averageDirectionalIndexSeries.update({
            time,
            value: adxValue?.adx ?? undefined,
            color: (() => {
              const adx = adxValue?.adx ?? 0

              if (adx < 5) {
                return "#ff000044" // red
              }
              if (adx < 15) {
                return "#ffa50044" // orange
              }
              if (adx < 25) {
                return "#ffff0044" // yellow
              }
              if (adx < 35) {
                return "#adff2f44" // yellowgreen
              }
              if (adx < 50) {
                return "#00800044" // green
              }
              return "#00ffff44" // cyan
            })(),
          })
        }
      }

      chart?.timeScale().fitContent()

      effect.subscriptions.push(
        socket.ticker(instrument).subscribe(data => {
          if (effect.cancelled) {
            return
          }

          const utcTimestamp = mapUnixToUTC(data.bid.time)

          if (!previousClose) {
            priceBeforeChart = priceBeforeChart || data.pre.price
            if (range === "1d") {
              priceBeforeChart = data.pre.price
            }

            previousClose = series.createPriceLine({
              price: priceBeforeChart,
              color: "gray",
              lineVisible: true,
              lineWidth: 1,
              lineStyle: 1, // LineStyle.Dotted,
              axisLabelVisible: false,
              title: "previous close",
            })

            setValue(v => ({
              ...v,
              previous: priceBeforeChart,
            }))
          }

          if ((utcTimestamp - (currentBar.time as any)) >= barTimeToLive) {
            currentBar = {
              ...currentBar,
              close: data.last.price,
            }

            series.update({
              ...currentBar,
            })

            previousBar = currentBar
            currentBar = {
              time: utcTimestamp,
              open: data.bid.price,
              close: data.bid.price,
              low: data.bid.price,
              high: data.bid.price,
            }
          } else {
            currentBar = {
              ...currentBar,
              close: data.bid.price,
              low: Math.min(currentBar.low, data.bid.price),
              high: Math.max(currentBar.high, data.bid.price),
            }
          }

          setValue(v => ({
            ...v,
            current: currentBar.close,
          }))

          for (const candle of [previousBar, currentBar]) {
            const index = seriesMarkers.findIndex(m => m.time === candle.time)
            if (index !== -1) {
              seriesMarkers.splice(index, 1)
            }
          }

          updateMarkers([previousBar as any, currentBar as any], time => time)

          series.update({
            ...currentBar,
          })
        })
      )

      // effect.subscriptions.push(
      //   socket.priceForOrder(instrument).subscribe(({ price }) => {
      //     setPrice(price)
      //   })
      // )
    })()

    return () => {
      chart?.removeSeries(series)
      chart?.removeSeries(movingAverageSeries)
      chart?.removeSeries(averageDirectionalIndexSeries)

      setInstrument(undefined)
      setExchange(undefined)
      setDetails(undefined)
      setValue({
        current: 0,
        previous: 0,
      })
      setPrice(0)

      effect.cancelled = true
      effect.subscriptions.forEach(s => s.unsubscribe())
    }
  })

  const handleSearch = async () => {
    const isin = await SymbolSearch.openModal({ socket })
    if (!isin) {
      return
    }

    setSearch({ isin })
  }

  // const handleShowNews = async () => {
  //   const timeFormatter = new Intl.RelativeTimeFormat()

  //   await ModalPortal.push(modal => {
  //     const news = createAsyncMemo(async () => {
  //       const news = await socket.news(instrument()!)
  //       news.sort((a, b) => b.createdAt - a.createdAt)
  //       return news
  //     })

  //     return (
  //       <Modal onclose={modal.reject} active style={{ padding: 0, "min-height": "50vh" }}>
  //         <Modal.Body>
  //           <For each={news()}>
  //             {news => (
  //               <A href={news.url}>
  //                 <Tile compact>
  //                   <Tile.Body>
  //                     <Tile.Title>{news.headline}</Tile.Title>
  //                     <Tile.Subtitle>{timeFormatter.format(Math.round((new Date(news.createdAt).getTime() - new Date().getTime()) / 1000 / 60 / 60), "hours")} {news.summary}</Tile.Subtitle>
  //                   </Tile.Body>
  //                 </Tile>
  //               </A>
  //             )}
  //           </For>
  //         </Modal.Body>
  //       </Modal>
  //     )
  //   })
  // }

  const toggleInstrumentInWatchList = () =>
    setWatchList(l => {
      if (!instrument()) {
        return l
      }

      if (l!.map(({ isin }) => isin).includes(instrument()!.isin)) {
        return l!.filter(({ isin }) => isin !== instrument()!.isin)
      } else {
        return [{ isin: instrument()!.isin }, ...(l ?? [])]
      }
    })

  // const manageInstrumentNotifications = useMemo(() => {
  //   return async () => {
  //     const permission = await Notification.requestPermission()
  //     if (permission !== 'granted') {
  //       return
  //     }
  //   }
  // }, [])

  const instrumentWatchListEntry = createMemo(() => {
    return watchList()
      ?.find(({ isin }) => isin === instrument()?.isin)
  })

  const instrumentBuyIn = createMemo(() => {
    return instrumentWatchListEntry()?.buyIn
  })
  // const setInstrumentBuyIn = (value: number | undefined) => {
  //   setWatchList(l => {
  //     return l!.map(entry => {
  //       if (entry.isin !== instrument()?.isin) {
  //         return entry
  //       }

  //       return {
  //         ...entry,
  //         buyIn: value,
  //       }
  //     })
  //   })
  // }

  const instrumentShares = createMemo(() => {
    return instrumentWatchListEntry()?.shares
  })
  // const setInstrumentShares = (value: number | undefined) => {
  //   setWatchList(l => {
  //     return l!.map(entry => {
  //       if (entry.isin !== instrument()?.isin) {
  //         return entry
  //       }

  //       return {
  //         ...entry,
  //         shares: value,
  //       }
  //     })
  //   })
  // }

  createEffect(() => {
    if (!search.warrants) {
      return
    }

    void (async () => {
      const derivative = await DerivativeSearch.openModal({ socket, instrument: instrument()! })
      if (!derivative) {
        navigate(`/trading/chart?isin=${instrument()?.isin}`)
        return
      }

      navigate(`/trading/chart?isin=${derivative}`)
    })()
  })

  return (
    <div style={{ display: "flex", "flex-direction": "column", "flex-grow": 1, background: "#1e222d", "box-shadow": "-10px 0px 13px -7px #161616, 10px 0px 13px -7px #161616, 5px 5px 15px 5px rgb(0 0 0 / 0%)" }}>
      <Column.Row gaps="none" style={{ "flex-grow": 1 }}>
        <Column xxl={9} md={12} style={{ display: "flex", "flex-direction": "column", "flex-grow": 1, background: "#1e222d" }}>
          <div style={{ background: "#1e222d" }}>
            <Column.Row style={{ padding: "1rem 1rem 0.25rem 1rem" }}>
              <Column xxl={4} md={6} sm={12}>
                <Button onClick={handleSearch} round>
                  <Icon src={iconSearch} />
                  <span>Search Symbol...</span>
                </Button>

                {/* <Button onClick={handleShowNews} round disabled={!instrument()?.isin}>
                  <Icon src={iconInfo} />
                  <span>News</span>
                </Button> */}
              </Column>

              <Column xxl="auto" offset="ml" />

              {/* <Column xxl="auto">
                <Input.Group style={{ width: "300px" }}>
                  <Input.Group.Addon style={{ "box-shadow": "2px 2px 0px 0px gray", "max-height": "36px" }}>
                    <Icon src={iconDollarSign} />
                  </Input.Group.Addon>
                  <Input type="number" placeholder="Buy-In" disabled={!instrumentWatchListEntry} value={instrumentBuyIn()} onchange={e => setInstrumentBuyIn(e.currentTarget.valueAsNumber)} pattern="[^\d\.]+" />
                  <Input.Group.Addon style={{ "box-shadow": "2px 2px 0px 0px gray", "max-height": "36px" }}>
                    <Icon src={iconX} />
                  </Input.Group.Addon>
                  <Input type="number" placeholder="Shares" disabled={!instrumentWatchListEntry} value={instrumentShares()} onchange={e => setInstrumentShares(e.currentTarget.valueAsNumber)} pattern="[^\d\.]+" />
                </Input.Group>
              </Column> */}

              <Column xxl="auto">
                <Button onClick={toggleInstrumentInWatchList} disabled={!instrument()} action color={instrumentWatchListEntry() ? "failure" : undefined}>
                  <Icon src={iconBookmark} />
                </Button>
              </Column>
            </Column.Row>
          </div>

          <SymbolInfo
            style={{ height: "unset" }}
            name={details()?.company.name ?? instrument()?.shortName}
            isin={instrument()?.isin}
            symbol={instrument()?.intlSymbol || instrument()?.homeSymbol}
            logo={TraderepublicWebsocket.createAssetURL(instrument()?.imageId)}
            countryFlag={TraderepublicWebsocket.createFlagURL(instrument())}
            exchange={exchange()?.exchangeId}
            value={value().current}
            currency={exchange()?.currency.id}
            valueAtPreviousClose={value().previous}
            buyIn={instrumentBuyIn()}
            shares={instrumentShares()}
            open={exchange()?.open}
            meta={[
              {
                key: "DERIVATIVES",
                value: instrument()?.derivativeProductCount.vanillaWarrant && "Warrants",
                href: `/trading/chart?isin=${instrument()?.isin}&warrants=true`,
              },
              {
                key: "UNDERLYING",
                value: instrument()?.derivativeInfo && instrument()!.derivativeInfo!.underlying.shortName,
                href: `/trading/chart?isin=${instrument()?.derivativeInfo?.underlying.isin}`,
              },
              // {
              //   key: "ASK",
              //   value: price() && numberCompactFormat.format(price()),
              // },
              {
                key: "MARKET CAP",
                value: details() && numberCompactFormat.format(details()!.company.marketCapSnapshot),
              },
              {
                key: "P/E",
                value: details() && numberCompactFormat.format(details()!.company.peRatioSnapshot),
              },
              {
                key: "TYPE",
                value: instrument()?.derivativeInfo && instrument()!.derivativeInfo!.properties.optionType,
                upperCase: true,
              },
              {
                key: "LEVERAGE",
                value: instrument()?.derivativeInfo && instrument()!.derivativeInfo!.properties.leverage?.toFixed(0),
              },
              {
                key: "RATIO",
                value: instrument()?.derivativeInfo && instrument()!.derivativeInfo!.properties.size?.toFixed(2),
              },
              {
                key: "EXPIRY",
                value: instrument()?.derivativeInfo && (instrument()!.derivativeInfo!.properties.lastTradingDay ? dateFormat.format(new Date(instrument()!.derivativeInfo!.properties.lastTradingDay!)) : "Open End"),
                upperCase: true,
              },
            ]}
          />

          <div style={{ display: "flex", "flex-direction": "column", "flex-grow": 1, "min-height": "480px" }}>
            <div ref={setChartContainer} style={{ height: "95%" }} />
          </div>

          <div style={{ background: "#1e222d", padding: "0.5rem" }}>
            {(() => {
              const TimeRangeLabel: Component<{ t: ReturnType<typeof timeRange> }> = props => (
                <A onclick={() => setTimeRange(props.t)} style={{ "margin-right": "0.2rem" }}>
                  <Label style={{ background: timeRange() === props.t ? "#3179f52e" : undefined }}>
                    {props.t}
                  </Label>
                </A>
              )

              return (
                <Column.Row>
                  {/* <Column xxl={2} md={3}>
                    <TimeRangeLabel t="5min" />
                  </Column> */}

                  <Column xxl={10} md={9}>
                    <TimeRangeLabel t="1d" />
                    <TimeRangeLabel t="5d" />
                    <TimeRangeLabel t="1m" />
                    <TimeRangeLabel t="3m" />
                    <TimeRangeLabel t="1y" />
                    <TimeRangeLabel t="max" />
                  </Column>
                </Column.Row>
              )
            })()}
          </div>
        </Column>

        <Column xxl={3} md={12}>
          <WatchList>
            <For each={watchedInstruments()}>
              {i => (
                <WatchList.Ticker
                  isin={i.isin}
                  href={`?isin=${i.isin}`}
                  // symbol={`${i.data?.intlSymbol || i.data?.homeSymbol || i.isin}${(i.buyIn && i.shares) ? ` [x${i.shares} @ ${i.buyIn}]` : ""}`}
                  symbol={i.data?.intlSymbol || i.data?.homeSymbol || i.isin}
                  name={i.details?.company.name ?? i.data?.shortName}
                  logo={TraderepublicWebsocket.createAssetURL(i.data?.imageId)}
                  open={i.exchange?.open}
                  value={i.value.current}
                  // valueAtPreviousClose={(i.buyIn && i.shares) ? i.buyIn : i.value.previous}
                  valueAtPreviousClose={i.value.previous}
                  highlighted={i.isin === instrument()?.isin}
                />
              )}
            </For>
          </WatchList>
        </Column>
      </Column.Row>
    </div>
  )
}

export default ChartView
