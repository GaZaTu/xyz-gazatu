type Candle = {
  open: number
  high: number
  low: number
  close: number
}

function bodyLen(candlestick: Candle) {
  return Math.abs(candlestick.open - candlestick.close)
}

function wickLen(candlestick: Candle) {
  return candlestick.high - Math.max(candlestick.open, candlestick.close)
}

function tailLen(candlestick: Candle) {
  return Math.min(candlestick.open, candlestick.close) - candlestick.low
}

function bodyEnds(candlestick: Candle) {
  return candlestick.open <= candlestick.close ? { bottom: candlestick.open, top: candlestick.close } : { bottom: candlestick.close, top: candlestick.open }
}

function isBullish(candlestick: Candle) {
  return candlestick.open < candlestick.close
}

function isBearish(candlestick: Candle) {
  return candlestick.open > candlestick.close
}

function isEngulfed(previous: Candle, current: Candle) {
  return bodyEnds(previous).top <= bodyEnds(current).top && bodyEnds(previous).bottom >= bodyEnds(current).bottom
}

function hasGapUp(previous: Candle, current: Candle) {
  return bodyEnds(previous).top < bodyEnds(current).bottom
}

function hasGapDown(previous: Candle, current: Candle) {
  return bodyEnds(previous).bottom > bodyEnds(current).top
}

function isHammer(candlestick: Candle) {
  return tailLen(candlestick) > (bodyLen(candlestick) * 2) && wickLen(candlestick) < bodyLen(candlestick)
}

function isInvertedHammer(candlestick: Candle) {
  return wickLen(candlestick) > (bodyLen(candlestick) * 2) && tailLen(candlestick) < bodyLen(candlestick)
}

function isBullishHammer(candlestick: Candle) {
  return isBullish(candlestick) && isHammer(candlestick)
}

function isBearishHammer(candlestick: Candle) {
  return isBearish(candlestick) && isHammer(candlestick)
}

function isBullishInvertedHammer(candlestick: Candle) {
  return isBullish(candlestick) && isInvertedHammer(candlestick)
}

function isBearishInvertedHammer(candlestick: Candle) {
  return isBearish(candlestick) && isInvertedHammer(candlestick)
}

function isHangingMan(previous: Candle, current: Candle) {
  return isBullish(previous) && isBearishHammer(current) && hasGapUp(previous, current)
}

function isShootingStar(previous: Candle, current: Candle) {
  return isBullish(previous) && isBearishInvertedHammer(current) && hasGapUp(previous, current)
}

function isBullishEngulfing(previous: Candle, current: Candle) {
  return isBearish(previous) && isBullish(current) && isEngulfed(previous, current)
}

function isBearishEngulfing(previous: Candle, current: Candle) {
  return isBullish(previous) && isBearish(current) && isEngulfed(previous, current)
}

function isBullishHarami(previous: Candle, current: Candle) {
  return isBearish(previous) && isBullish(current) && isEngulfed(current, previous)
}

function isBearishHarami(previous: Candle, current: Candle) {
  return isBullish(previous) && isBearish(current) && isEngulfed(current, previous)
}

function isBullishKicker(previous: Candle, current: Candle) {
  return isBearish(previous) && isBullish(current) && hasGapUp(previous, current) && !(isHammer(current) || isInvertedHammer(current))
}

function isBearishKicker(previous: Candle, current: Candle) {
  return isBullish(previous) && isBearish(current) && hasGapDown(previous, current) && !(isHammer(current) || isInvertedHammer(current))
}

function findCandlePattern(dataArray: Candle[], callback: (...candle: Candle[]) => boolean) {
  const paramCount = callback.length
  const upperBound = dataArray.length - paramCount
  const results = [] as number[]

  for (let i = 0; i <= upperBound; i++) {
    const values = []

    for (let j = 0; j < paramCount; j++) {
      values.push(dataArray[i + j])
    }

    if (callback(...values)) {
      results.push(i)
    }
  }

  return results
}

function bullish_hammer(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBullishHammer)
}

function bearish_hammer(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBearishHammer)
}

function bullish_inverted_hammer(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBullishInvertedHammer)
}

function bearish_inverted_hammer(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBearishInvertedHammer)
}

function hanging_man(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isHangingMan)
}

function shooting_star(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isShootingStar)
}

function bullish_engulfing(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBullishEngulfing)
}

function bearish_engulfing(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBearishEngulfing)
}

function bullish_harami(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBullishHarami)
}

function bearish_harami(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBearishHarami)
}

function bullish_kicker(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBullishKicker)
}

function bearish_kicker(dataArray: Candle[]) {
  return findCandlePattern(dataArray, isBearishKicker)
}

const patterns = {
  bullish: {
    hammer: bullish_hammer,
    inverted_hammer: bullish_inverted_hammer,
    engulfing: bullish_engulfing,
    harami: bullish_harami,
    kicker: bullish_kicker,
  },
  bearish: {
    hammer: bearish_hammer,
    inverted_hammer: bearish_inverted_hammer,
    hanging_man,
    shooting_star,
    engulfing: bearish_engulfing,
    harami: bearish_harami,
    kicker: bearish_kicker,
  },
}

export function analyzeCandles<C extends Candle>(data: C[]) {
  data = JSON.parse(JSON.stringify(data))

  type R = C & {
    original: number
    patterns: {
      type: "bullish" | "bearish"
      name: (keyof ((typeof patterns)["bullish"]) | keyof ((typeof patterns)["bearish"]))
    }[]
  }

  const result = [] as R[]

  for (const [type, funcs] of Object.entries(patterns)) {
    for (const [name, func] of Object.entries(funcs)) {
      for (const candleIdx of func(data)) {
        let candle = result.find(c => c.original === candleIdx)
        if (!candle) {
          result.push(candle = {
            ...data[candleIdx],
            original: candleIdx,
            patterns: [],
          })
        }

        candle.patterns.push({
          type: type as any,
          name: name as any,
        })
      }
    }
  }

  return result
}
