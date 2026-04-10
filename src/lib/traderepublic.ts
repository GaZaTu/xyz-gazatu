export interface Subscription {
  unsubscribe(): void
}

export interface Observable<T> {
  subscribe(onValue: (value: T) => unknown, onError?: (error: unknown) => unknown): Subscription

  toPromise(): Promise<T>

  map<R>(mapper: (value: T) => R): Observable<R>
}

const createObservable = <T>(subscriber: (emitValue: (value: T) => unknown, emitError: (error: unknown) => unknown) => () => void): Observable<T> => {
  return {
    subscribe: (onValue: (data: any) => unknown, onError?: (error: unknown) => unknown) => {
      return {
        unsubscribe: subscriber(onValue, onError ?? console.error),
      }
    },
    toPromise() {
      return new Promise<any>((resolve, reject) => {
        const sub = this.subscribe(value => {
          sub.unsubscribe()
          resolve(value)
        }, reject)
      })
    },
    map<R>(mapper: (data: any) => R) {
      return createObservable<R>((emitValue, emitError) => {
        return this.subscribe(v => emitValue(mapper(v)), emitError).unsubscribe
      })
    },
  }
}

export type TraderepublicInstrumentSub = {
  type: "instrument"
  id: string
  jurisdiction: string
}

export type TraderepublicInstrumentData = {
  active: boolean
  exchangeIds: string[]
  exchanges: {
    slug: string
    active: boolean
    nameAtExchange: string
    symbolAtExchange: string
    firstSeen: number
    lastSeen: number
    firstTradingDay: number | null
    lastTradingDay: number | null
    tradingTimes: unknown | null
    fractionalTrading: {
      minOrderSize: string
      maxOrderSize: string | null
      stepSize: string
      minOrderAmount: string
    } | null
    settlementRoute: string
    weight: unknown | null
  }[]
  jurisdictions: {
    [key: string]: {
      active: boolean
      kidLink: string | null
      kidRequired: boolean
      savable: boolean
      fractionalTradingAllowed: boolean
      proprietaryTradable: boolean
      usesWeightsForExchanges: boolean
      weights: unknown | null
    }
  }
  dividends: unknown[]
  splits: {
    id: string
    date: number
    initial: number
    final: number
  }[]
  cfi: string
  name: string
  typeId: "stock" | "fund" | "derivative" | "crypto"
  wkn: string
  legacyTypeChar: string
  isin: string
  priceFactor: number
  shortName: string
  nextGenName: string
  alarmsName: string
  homeSymbol: string
  intlSymbol: string | null
  homeNsin: string
  tags: {
    type: string
    id: string
    name: string
    icon: string
  }[]
  derivativeProductCount: {
    knockOutProduct?: number
    factorCertificate?: number
    vanillaWarrant?: number
  }
  derivativeProductCategories: ("knockOutProduct" | "factorCertificate" | "vanillaWarrant")[]
  company: {
    name: string
    description: string | null
    ipoDate: number | null
    countryOfOrigin: string | null
  }
  marketCap: {
    value: string | null
    currencyId: string | null
  }
  lastDividend: number | null
  shareType: string | null
  custodyType: string | null
  kidRequired: boolean
  kidLink: string | null
  tradable: boolean
  fundInfo: {
    ter: string
    underlyingClass: string | null
    currency: string | null
    market: string | null
    method: string | null
    useOfProfits: string
    useOfProfitsDisplayName: string
    index: string | null
    ucits: boolean
    legalFormType: string
    domicile: string
    launchDate: string
  } | null
  derivativeInfo: {
    categoryType: string
    productCategoryName: string
    productGroupType: string
    knocked: boolean
    issuerCountry: string
    emissionDate: string
    underlying: {
      name: string
      shortName: string
      isin: string
      available: boolean
    }
    properties: {
      strike: number
      barrier: number | null
      cap: null
      factor: null
      currency: string
      size: number | null
      expiry: number | null
      maturity: number | null
      exerciseType: string
      settlementType: string
      optionType: string
      quoteType: string
      firstTradingDay: string
      lastTradingDay: string | null
      delta: number | null
      leverage: number | null
    }
    mifid: {
      entryCost: number
      exitCost: number
      ongoingCostsExpected: number
      ongoingCostsAccumulated: number
      costNotation: string
    }
  } | null
  targetMarket: {
    investorType: string
    investorExperience: string
  }
  savable: boolean
  fractionalTradingAllowed: boolean
  proprietaryTradable: boolean
  issuer: string | null
  issuerDisplayName: string | null
  issuerImageId: string | null
  notionalCurrency: string | null
  additionalBuyWarning: string | null
  warningMessage: string | null
  description: string | null
  noTradeVolume: boolean
  additionalBuyWarnings: {
    [lang: string]: string
  } | null
  warningMessages: {
    [lang: string]: string
  } | null
  descriptions: {
    [lang: string]: string
  } | null
  usesWeightsForExchanges: boolean
  imageId: string | null
  exchangeStatuses: {
    [exchange: string]: string
  }
  cfdInfo: unknown | null
}

export type TraderepublicStockDetailsSub = {
  type: "stockDetails"
  id: string
  jurisdiction: string
}
export type TraderepublicStockDetailsData = {
  isin: string
  company: {
    name: string
    description: string
    yearFounded: number
    tickerSymbol: string
    peRatioSnapshot: number
    pbRatioSnapshot: number
    dividendYieldSnapshot: number | null
    earningsCall: unknown | null
    marketCapSnapshot: number
    dailyCloseYearSD: unknown | null
    beta: number
    countryCode: string
    ceoName: string | null
    cfoName: string | null
    cooName: string | null
    employeeCount: number
    eps: number
  }
  similarStocks: {
    isin: string
    name: string
    tags: {
      id: string
      type: string
      name: string
      icon: string
    }[]
  }[]
  expectedDividend: unknown | null
  dividends: {
    id: string
    paymentDate: string
    recordDate: string
    exDate: string
    amount: number
    yield: unknown
    type: string
  }[]
  totalDivendendCount: number
  events: {
    id: string
    title: string
    timestamp: number
    description: string
    webcastUrl: string | null
    dividend: unknown
  }[]
  pastEvents: {
    id: string
    title: string
    timestamp: number
    description: string
    webcastUrl: unknown
    dividend: {
      id: string
      paymentDate: string
      recordDate: string
      exDate: string
      amount: number
      yield: unknown
      type: string
    }
  }[]
  analystRating: {
    targetPrice: {
      average: number
      high: number
      low: number
    }
    recommendations: {
      buy: number
      outperform: number
      hold: number
      underperform: number
      sell: number
    }
  }
  hasKpis: boolean
  aggregatedDividends: {
    periodStartDate: string
    projected: unknown
    yieldValue: unknown
    amount: unknown
    count: unknown
    projectedCount: unknown
    price: unknown
  }[]
  dividendFrequency: unknown
}

export type TraderepublicHomeInstrumentExchangeSub = {
  type: "homeInstrumentExchange"
  id: string
}

export type TraderepublicHomeInstrumentExchangeData = {
  exchangeId: string
  exchange: {
    id: string
    name: string
    timeZoneId: string
  }
  currency: {
    id: string
    name: string
  }
  open: boolean
  orderModes: string[]
  orderExpiries: string[]
  priceSteps: unknown[]
  openTimeOffsetMillis: number
  closeTimeOffsetMillis: number
  maintenanceWindow: unknown | null
}

export type TraderepublicTickerSub = {
  type: "ticker"
  id?: string
  isin: string
  exchange: string
}

type _TraderepublicTickerPrice = {
  time: number
  price: string
  size: number
}

type _TraderepublicTickerData = {
  bid: _TraderepublicTickerPrice
  ask: _TraderepublicTickerPrice
  last: _TraderepublicTickerPrice
  pre: _TraderepublicTickerPrice
  open: _TraderepublicTickerPrice
  qualityId: "realtime"
  leverage: unknown
  delta: unknown
}

type TraderepublicTickerPrice = {
  time: number
  price: number
  size: number
}

export type TraderepublicTickerData = {
  bid: TraderepublicTickerPrice
  ask: TraderepublicTickerPrice
  last: TraderepublicTickerPrice
  pre: TraderepublicTickerPrice
  open: TraderepublicTickerPrice
  qualityId: "realtime"
  leverage: unknown
  delta: unknown
}

export type TraderepublicAggregateHistoryLightSub = {
  type: "aggregateHistoryLight"
  id?: string
  isin: string
  exchange: string
  range: "1d" | "5d" | "1m" | "3m" | "1y" | "max"
}

type _TraderepublicAggregateHistoryLightData = {
  expectedClosingTime: number
  aggregates: {
    time: number
    open: string
    high: string
    low: string
    close: string
    volume: 0
    adjValue: string
  }[]
  resolution: number
  lastAggregateEndTime: number
}

export type TraderepublicAggregateHistoryLightData = {
  expectedClosingTime: number
  aggregates: {
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: 0
    adjValue: string
  }[]
  resolution: number
  lastAggregateEndTime: number
}

export type TraderepublicNeonSearchSub = {
  type: "neonSearch"
  data: {
    q: string
    page: number
    pageSize: number
    filter: ({
      key: "type"
      value: "stock" | "fund" | "derivative" | "crypto" | "bond"
    } | {
      key: "jurisdiction"
      value: string
    } | {
      key: "relativePerformance"
      value: "dailyBest" | "dailyWorst"
    })[]
  }
}

export type TraderepublicNeonSearchData = {
  results: {
    isin: string
    name: string
    tags: {
      type: string
      id: string
      name: string
    }[]
    type: string
    subtitle?: string | null
    derivativeProductCategories: string[]
    mappedEtfIndexName?: string
    etfDescription?: string
    bondIssuerName?: string
    imageId?: string
  }[]
  resultCount: number
  correlationId: string
}

export type TraderepublicNeonNewsSub = {
  type: "neonNews"
  isin: string
}

export type TraderepublicNeonNewsData = {
  id: string
  createdAt: number
  provider: string
  headline: string
  summary: string
  url: string
}[]

export type TraderepublicPerformanceSub = {
  type: "performance"
  id?: string
  isin: string
  exchange: string
}

export type TraderepublicPerformanceData = {
  id: string
  high_1d: string
  low_1d: string
  price_5d: string
  price_1m: string
  price_3m: string
  price_6m: string
  price_1y: string
  price_3y: string
  price_5y: string
  high_52w: string
  low_52w: string
}

export type TraderepublicPriceForOrderSub = {
  type: "priceForOrder"
  parameters: {
    exchangeId: string
    instrumentId: string
    type: "buy"
  }
}

export type TraderepublicPriceForOrderData = {
  currencyId: string
  price: number
  priceFactor: number
  time: number
}

export type TraderepublicDerivativesSub = {
  type: "derivatives"
  jurisdiction: string
  lang: string
  underlying: string
  productCategory: "vanillaWarrant" | "factorCertificate" | "knockOutProduct"
  strike?: number
  factor?: number
  leverage?: number
  sortBy: "strike" | "factor" | "leverage" | "knockout" | "expiry" | "delta"
  sortDirection: "asc" | "desc"
  optionType: "call" | "put" | "long" | "short"
  pageSize: number
  after: string
}

export type TraderepublicDerivativesData = {
  results: {
    isin: string
    optionType: "call" | "put" | "long" | "short"
    productCategoryName: string
    barrier: number | null
    leverage: number
    strike: number
    size: number
    factor: number | null
    delta: number
    currency: string
    expiry: string
    issuerDisplayName: string
    issuer: string
  }[]
  resultCount: number
  issuerCount: {
    [issuer: string]: number
  }
  cursors: {
    before: string | null
    after: string | null
  }
}

type TraderepublicSub =
  TraderepublicInstrumentSub |
  TraderepublicStockDetailsSub |
  TraderepublicHomeInstrumentExchangeSub |
  TraderepublicTickerSub |
  TraderepublicAggregateHistoryLightSub |
  TraderepublicNeonSearchSub |
  TraderepublicNeonNewsSub |
  TraderepublicPerformanceSub |
  TraderepublicPriceForOrderSub |
  TraderepublicDerivativesSub

type TraderepublicData =
  TraderepublicInstrumentData |
  TraderepublicStockDetailsData |
  TraderepublicHomeInstrumentExchangeData |
  _TraderepublicTickerData |
  _TraderepublicAggregateHistoryLightData |
  TraderepublicNeonSearchData |
  TraderepublicNeonNewsData |
  TraderepublicPerformanceData |
  TraderepublicPriceForOrderData |
  TraderepublicDerivativesData

type TradepublicSubToDataMap = {
  "instrument": TraderepublicInstrumentData
  "stockDetails": TraderepublicStockDetailsData
  "homeInstrumentExchange": TraderepublicHomeInstrumentExchangeData
  "ticker": _TraderepublicTickerData
  "aggregateHistoryLight": _TraderepublicAggregateHistoryLightData
  "neonSearch": TraderepublicNeonSearchData
  "neonNews": TraderepublicNeonNewsData
  "performance": TraderepublicPerformanceData
  "priceForOrder": TraderepublicPriceForOrderData
  "derivatives": TraderepublicDerivativesData
}

class TraderepublicCache {
  private static readonly KEY = "TR_CACHE"
  private static readonly TTL = 1000 * 60 * 60

  private static DATA = {} as Record<string, { ttl: number, val: any }>

  private static LOAD_DONE = false

  private static load() {
    if (this.LOAD_DONE) {
      return
    }

    const json = sessionStorage.getItem(this.KEY)
    if (!json) {
      return
    }

    this.DATA = JSON.parse(json)
    this.LOAD_DONE = true
  }

  private static store() {
    sessionStorage.setItem(this.KEY, JSON.stringify(this.DATA))
  }

  static put(sub: TraderepublicSub, val: TraderepublicData | null) {
    this.load()

    const key = JSON.stringify(sub)
    this.DATA[key] = {
      ttl: Date.now() + this.TTL,
      val,
    }

    this.store()
  }

  static match<Sub extends TraderepublicSub>(sub: Sub): TradepublicSubToDataMap[Sub["type"]] | null | undefined {
    this.load()

    for (const key of Object.keys(this.DATA)) {
      if (this.DATA[key].ttl > Date.now()) {
        delete this.DATA[key]
      }
    }

    const key = JSON.stringify(sub)
    const result = this.DATA[key]?.val

    this.store()

    return result
  }
}

export class TraderepublicWebsocket {
  private static readonly URI = "wss://api.traderepublic.com/"
  private static readonly CLIENT_INFO = {
    locale: "en",
    platformId: "webtrading",
    platformVersion: "firefox - 126.0.0",
    clientId: "app.traderepublic.com",
    clientVersion: "3.14.1",
  }

  private _subscriptions = new Map<number, { sub: any, onValue: (payload: any) => void, onError: (error: unknown) => unknown }>()
  private _counter = 33
  private _socket = undefined as undefined | WebSocket
  private _echo = 0 as any
  private _inactivityTimeout = 0 as any
  private _connected = false
  private _connecting = false
  private _resolveConnected = () => undefined as void
  private _connectingDone = new Promise<void>(resolve => this._resolveConnected = resolve)

  constructor(
    private _jurisdiction: string,
  ) { }

  private _send(reqKind: "connect" | "sub" | "unsub" | "echo", number: number, payload?: any) {
    const str = `${reqKind} ${number} ${payload ? JSON.stringify(payload) : ""}`

    this._socket?.send(str.trim())
  }

  private _sub<Sub extends TraderepublicSub>(sub: Sub): Observable<TradepublicSubToDataMap[Sub["type"]]> {
    return createObservable<any>((emitValue, emitError) => {
      const number = ++this._counter

      this._subscriptions.set(number, {
        sub,
        onValue: emitValue,
        onError: emitError,
      })

      this.connect().catch(console.error)
      if (this._connected) {
        this._send("sub", number, sub)
      }

      return () => {
        this._send("unsub", number)

        this._subscriptions.delete(number)
      }
    })
  }

  async instrument(isin: string, jurisdiction: string = this._jurisdiction) {
    const sub: TraderepublicInstrumentSub = {
      type: "instrument",
      id: isin,
      jurisdiction,
    }

    const cached = TraderepublicCache.match(sub)
    if (cached) {
      return cached
    }

    const fetched = await this._sub(sub).toPromise()
    TraderepublicCache.put(sub, fetched)
    return fetched
  }

  async details(isin: string | TraderepublicInstrumentData, jurisdiction: string = this._jurisdiction) {
    if (typeof isin === "object") {
      isin = isin.isin
    }

    const sub: TraderepublicStockDetailsSub = {
      type: "stockDetails",
      id: isin,
      jurisdiction,
    }

    const cached = TraderepublicCache.match(sub)
    if (cached !== undefined) {
      return cached ?? undefined
    }

    const mapData = (data: TraderepublicStockDetailsData): TraderepublicStockDetailsData | undefined => {
      if (!data.isin) {
        return undefined
      }

      return data
    }

    const fetched = await this._sub(sub).map(mapData).toPromise()
    TraderepublicCache.put(sub, fetched ?? null)
    return fetched
  }

  exchange(isin: string | TraderepublicInstrumentData) {
    if (typeof isin === "object") {
      isin = isin.isin
    }

    return this._sub({
      type: "homeInstrumentExchange",
      id: isin,
    })
  }

  ticker(isin: string | TraderepublicInstrumentData, exchange?: string | TraderepublicHomeInstrumentExchangeData) {
    if (typeof isin === "object") {
      exchange ??= isin.exchangeIds[0]
      isin = isin.isin
    }

    if (typeof exchange === "object") {
      exchange = exchange.exchangeId
    }

    const mapPrice = (price: _TraderepublicTickerPrice): TraderepublicTickerPrice => {
      return {
        time: price.time,
        price: Number(price.price),
        size: price.size,
      }
    }

    const mapData = (data: _TraderepublicTickerData): TraderepublicTickerData => {
      return {
        bid: mapPrice(data.bid),
        ask: mapPrice(data.ask),
        last: mapPrice(data.last),
        pre: mapPrice(data.pre),
        open: mapPrice(data.open),
        qualityId: data.qualityId,
        leverage: data.leverage,
        delta: data.delta,
      }
    }

    return this._sub({
      type: "ticker",
      id: `${isin}.${exchange}`,
      isin: isin,
      exchange: exchange!,
    }).map(mapData)
  }

  async aggregateHistory(isin: string | TraderepublicInstrumentData, range: TraderepublicAggregateHistoryLightSub["range"], exchange?: string | TraderepublicHomeInstrumentExchangeData) {
    if (typeof isin === "object") {
      exchange ??= isin.exchangeIds[0]
      isin = isin.isin
    }

    if (typeof exchange === "object") {
      exchange = exchange.exchangeId
    }

    const mapData = (data: _TraderepublicAggregateHistoryLightData): TraderepublicAggregateHistoryLightData => {
      return {
        expectedClosingTime: data.expectedClosingTime,
        aggregates: data.aggregates.map(aggregate => ({
          time: aggregate.time,
          open: Number(aggregate.open),
          high: Number(aggregate.high),
          low: Number(aggregate.low),
          close: Number(aggregate.close),
          volume: aggregate.volume,
          adjValue: aggregate.adjValue,
        })),
        resolution: data.resolution,
        lastAggregateEndTime: data.lastAggregateEndTime,
      }
    }

    const history = await this._sub({
      type: "aggregateHistoryLight",
      id: `${isin}.${exchange}`,
      isin: isin,
      exchange: exchange!,
      range,
    }).map(mapData).toPromise()

    if (history.aggregates.length >= 2) {
      let prevAggregate = history.aggregates[history.aggregates.length - 2]
      let lastAggregate = history.aggregates[history.aggregates.length - 1]

      if (lastAggregate.time === prevAggregate.time) {
        history.aggregates.splice(history.aggregates.length - 1, 1)

        prevAggregate = history.aggregates[history.aggregates.length - 2]
        lastAggregate = history.aggregates[history.aggregates.length - 1]
      }

      if ((lastAggregate.time - prevAggregate.time) > history.resolution) {
        history.aggregates.splice(history.aggregates.length - 1, 0, {
          time: prevAggregate.time + history.resolution,
          open: prevAggregate.close,
          high: Math.max(prevAggregate.close, lastAggregate.open),
          low: Math.min(prevAggregate.close, lastAggregate.open),
          close: lastAggregate.open,
          volume: 0,
          adjValue: "",
        })
      }
    }

    return history
  }

  search(q: string, type: "stock" | "fund" | "derivative" | "crypto" | "bond" = "stock", pageSize = 1, page = 1) {
    const sub: TraderepublicNeonSearchSub = {
      type: "neonSearch",
      data: {
        q,
        page,
        pageSize,
        filter: [
          {
            key: "type",
            value: type,
          },
          {
            key: "jurisdiction",
            value: this._jurisdiction,
          },
        ],
      },
    }

    const prefix = q?.trim().toLowerCase().slice(0, 2)
    if (prefix?.endsWith("?")) {
      sub.data.q = q.slice(2).trim()

      switch (prefix) {
      case "f?":
        sub.data.filter[0].value = "fund"
        break
      case "d?":
        sub.data.filter[0].value = "derivative"
        break
      case "c?":
        sub.data.filter[0].value = "crypto"
        break
      case "b?":
        sub.data.filter[0].value = "bond"
        break
      }
    }

    return this._sub(sub).toPromise()
      .then(data => data.results)
  }

  topMovers(q: "dailyBest" | "dailyWorst", type: "stock" | "fund" | "derivative" | "crypto" | "bond" = "stock") {
    const sub: TraderepublicNeonSearchSub = {
      type: "neonSearch",
      data: {
        q: "",
        page: 1,
        pageSize: 10,
        filter: [
          {
            key: "type",
            value: type,
          },
          {
            key: "jurisdiction",
            value: this._jurisdiction,
          },
          {
            key: "relativePerformance",
            value: q,
          },
        ],
      },
    }

    return this._sub(sub).toPromise()
      .then(data => data.results)
  }

  news(isin: string | TraderepublicInstrumentData) {
    if (typeof isin === "object") {
      isin = isin.isin
    }

    return this._sub({
      type: "neonNews",
      isin: isin,
    }).toPromise()
  }

  priceForOrder(isin: string | TraderepublicInstrumentData, exchange?: string | TraderepublicHomeInstrumentExchangeData) {
    if (typeof isin === "object") {
      exchange = isin.exchangeIds[0]
      isin = isin.isin
    }

    if (typeof exchange === "object") {
      exchange = exchange.exchangeId
    }

    return this._sub({
      type: "priceForOrder",
      parameters: {
        exchangeId: exchange!,
        instrumentId: isin,
        type: "buy",
      },
    })
  }

  derivatives(isin: string | TraderepublicInstrumentData, params: Partial<TraderepublicDerivativesSub>) {
    if (typeof isin === "object") {
      isin = isin.isin
    }

    return this._sub({
      type: "derivatives",
      jurisdiction: this._jurisdiction,
      lang: "en",
      underlying: isin,
      productCategory: "vanillaWarrant",
      strike: params.productCategory === "vanillaWarrant" ? 0 : undefined,
      factor: params.productCategory === "factorCertificate" ? 0 : undefined,
      leverage: params.productCategory === "knockOutProduct" ? 0 : undefined,
      sortBy: "strike",
      sortDirection: "asc",
      optionType: "call",
      pageSize: 100,
      after: "0",
      ...params,
    }).toPromise()
  }

  async connect() {
    if (typeof window === "undefined") {
      return
    }

    clearInterval(this._inactivityTimeout)
    this._inactivityTimeout = setInterval(() => {
      if (!this.active) {
        this.close()
      }
    }, 60000)

    if (this._connected) {
      return
    }

    if (this._connecting) {
      await this._connectingDone
      return
    }

    this._connecting = true
    this._socket = new WebSocket(TraderepublicWebsocket.URI)

    try {
      const regex = /(\d+) (A|E) ?(.*)/

      await new Promise<unknown>((resolve, reject) => {
        this._socket!.onerror = ev => reject(ev)
        this._socket!.onopen = resolve
      })

      await new Promise<void>((resolve, reject) => {
        this._socket!.onerror = ev => reject(ev)
        this._socket!.onmessage = message => {
          const messageString = message.data.toString("utf-8")

          if (messageString === "connected") {
            resolve()
          } else {
            const match = regex.exec(messageString)
            if (!match) {
              return
            }

            const [, number, messageType, payload] = match
            const subscription = this._subscriptions.get(Number(number))

            if (subscription) {
              const parsedPayload = JSON.parse(payload)

              if (messageType === "A") {
                subscription.onValue(parsedPayload)
              } else {
                const { errors: [error] } = parsedPayload as {
                  errors: {
                    errorCode: string
                    errorField: string | null
                    errorMessage: string
                    meta: Record<string, unknown>
                  }[]
                }

                subscription.onError(new Error(`${error.errorCode} - ${error.errorMessage}`))
              }
            }
          }
        }

        this._send("connect", 31, TraderepublicWebsocket.CLIENT_INFO)
      })
    } finally {
      this._connecting = false
    }

    this._socket.onerror = console.error
    this._socket.onclose = ev => {
      this._connected = false

      clearInterval(this._echo)
      clearInterval(this._inactivityTimeout)

      if (!this.hasSubscriptions) {
        this._counter = 33
      }

      if (!ev.wasClean) {
        this.connect().catch(console.error)
      }
    }

    this._echo = setInterval(() => {
      this._send("echo", Math.floor(new Date().getTime() / 1000))
    }, 5000)

    for (const [number, { sub }] of this._subscriptions) {
      this._send("sub", number, sub)
    }

    this._connected = true
    this._resolveConnected()
    this._connectingDone = new Promise<void>(resolve => this._resolveConnected = resolve)
  }

  close() {
    if (typeof window === "undefined") {
      return
    }

    if (this._socket?.readyState === WebSocket.OPEN) {
      this._socket.close()
    }
  }

  get connected() {
    return this._connected
  }

  get hasSubscriptions() {
    return this._subscriptions.size > 0
  }

  get active() {
    return this.connected && this.hasSubscriptions
  }

  static createAssetURL(imageId: string | null | undefined) {
    if (!imageId) {
      return undefined
    }

    const origin = "https://assets.traderepublic.com"
    const path = `/img/${imageId}/dark.min.svg`

    const url = new URL(origin + path)
    return url
  }

  static createFlagURL(instrument: TraderepublicInstrumentData | null | undefined) {
    if (!instrument) {
      return undefined
    }

    const country = instrument.tags.find(tag => tag.type === "country")
    if (!country) {
      return undefined
    }

    const url = new URL(country.icon)
    return url
  }
}
