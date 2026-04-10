import { createGlobalProgressStateEffect } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { computedColorScheme } from "@gazatu/solid-spectre/util/colorScheme"
import { createAsyncMemo } from "@solid-primitives/memo"
import { Title } from "@solidjs/meta"
import { HistogramSeries, type DeepPartial, type TimeChartOptions } from "lightweight-charts"
import { Component, createEffect, createSignal } from "solid-js"
import { createGraphQLResource } from "../../lib/fetchGraphQL"
import { Query } from "../../lib/schema.gql"
import { createAuthCheck } from "../../store/auth"

const cssvar = (name: string, element = document.body) =>
  getComputedStyle(element).getPropertyValue(name)

const createChartColors = async (): Promise<DeepPartial<TimeChartOptions>> => {
  const {
    ColorType,
  } = await import("lightweight-charts")

  return {
    layout: {
      background: {
        type: ColorType.Solid,
        color: cssvar("--body-bg"),
      },
      textColor: cssvar("--body-fg"),
      fontFamily: cssvar("--mono-font-family"),
      fontSize: 16,
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
        color: cssvar("--body-bg-monochrome"),
      },
      vertLines: {
        color: cssvar("--body-bg-monochrome"),
      },
    },
    timeScale: {
      borderColor: cssvar("--body-bg-monochrome"),
    },
    rightPriceScale: {
      borderColor: cssvar("--body-bg-monochrome"),
    },
  }
}

const createChartOptions = (): DeepPartial<TimeChartOptions> => {
  return {
    autoSize: true,
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      fixLeftEdge: true,
      fixRightEdge: true,
      uniformDistribution: true,
    },
    rightPriceScale: {
      visible: true,
      autoScale: true,
    },
    handleScroll: {
      horzTouchDrag: false,
      mouseWheel: false,
      pressedMouseMove: false,
      vertTouchDrag: false,
    },
    handleScale: {
      axisDoubleClickReset: false,
      axisPressedMouseMove: false,
      mouseWheel: false,
      pinch: false,
    },
  }
}

const ServerLoadView: Component = () => {
  const isAdmin = createAuthCheck("admin")

  const resource = createGraphQLResource<Query>({
    query: "$/ServerLoad.gql",
    variables: {
      get isAdmin() {
        return isAdmin()
      },
    },
    onError: Toaster.pushError,
  })

  createGlobalProgressStateEffect(() => resource.loading)

  const [rpmChartContainer, setRPMChartContainer] = createSignal<HTMLElement>()
  const rpmChartMemo = createAsyncMemo(async () => {
    if (!rpmChartContainer()) {
      return undefined
    }

    const {
      createChart,
    } = await import("lightweight-charts")

    const chart = createChart(rpmChartContainer()!, {
      ...createChartOptions(),
      localization: {
        priceFormatter: (v: number) => `${v.toFixed(2).padStart(6, " ")}`,
      },
    })

    chart.applyOptions(await createChartColors())

    chart.priceScale("right").applyOptions({
      minimumWidth: 128,
      scaleMargins: {
        top: 0.2,
        bottom: 0,
      },
    })

    const series = chart.addSeries(HistogramSeries, {
      color: "rgba(38, 198, 218, 1)",
      priceFormat: {
        type: "volume",
      },
      lastValueVisible: false,
      priceLineVisible: false,
    })

    return {
      chart,
      series,
    }
  })

  const [rtChartContainer, setRTChartContainer] = createSignal<HTMLElement>()
  const rtChartMemo = createAsyncMemo(async () => {
    if (!rtChartContainer()) {
      return undefined
    }

    const {
      createChart,
    } = await import("lightweight-charts")

    const chart = createChart(rtChartContainer()!, {
      ...createChartOptions(),
      localization: {
        priceFormatter: (v: number) => `${v.toFixed(2).padStart(6, " ")}ms`,
      },
    })

    chart.applyOptions(await createChartColors())

    chart.priceScale("right").applyOptions({
      minimumWidth: 128,
      scaleMargins: {
        top: 0.2,
        bottom: 0,
      },
    })

    const series = chart.addSeries(HistogramSeries, {
      color: "rgba(38, 198, 218, 1)",
      priceFormat: {
        type: "volume",
      },
      lastValueVisible: false,
      priceLineVisible: false,
    })

    return {
      chart,
      series,
    }
  })

  const [loadChartContainer, setLoadChartContainer] = createSignal<HTMLElement>()
  const loadChartMemo = createAsyncMemo(async () => {
    if (!loadChartContainer()) {
      return undefined
    }

    const {
      createChart,
    } = await import("lightweight-charts")

    const chart = createChart(loadChartContainer()!, {
      ...createChartOptions(),
      localization: {
        priceFormatter: (v: number) => `${v.toFixed(2).padStart(6, " ")}%`,
      },
    })

    chart.applyOptions(await createChartColors())

    chart.priceScale("right").applyOptions({
      minimumWidth: 128,
      scaleMargins: {
        top: 0.2,
        bottom: 0,
      },
    })

    const series = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      autoscaleInfoProvider: () => {
        return {
          priceRange: {
            minValue: 0,
            maxValue: 111,
          },
        }
      },
      lastValueVisible: false,
      priceLineVisible: false,
    })

    return {
      chart,
      series,
    }
  })

  createEffect(async () => {
    void computedColorScheme()

    if (!rpmChartMemo() || !rtChartMemo() || !loadChartMemo()) {
      return
    }

    rpmChartMemo()!.chart
      .applyOptions(await createChartColors())
    rtChartMemo()!.chart
      .applyOptions(await createChartColors())
    loadChartMemo()!.chart
      .applyOptions(await createChartColors())
  })

  createEffect(() => {
    if (!resource.data || !rpmChartMemo() || !rtChartMemo() || !loadChartMemo()) {
      return
    }

    const convertDateToChartTime = (date: string | Date) => {
      if (!(date instanceof Date)) {
        date = new Date(date)
      }

      const result = ((date.getTime() / 1000) - (date.getTimezoneOffset() * 60))
      return result as any
    }

    const rawData = resource.data?.serverLoad?.slice(2, -2) ?? []

    const rpmData = rawData.map(l => ({
      time: convertDateToChartTime(l.timestamp!),
      value: l.requestsPerMinute!,
      color: (() => {
        if (new Date(l.timestamp!).getTime() > new Date().getTime()) {
          return "gray"
        }
        return undefined
      })(),
    }))
    rpmChartMemo()!.series.setData(rpmData ?? [])
    rpmChartMemo()!.chart.timeScale().fitContent()

    const rtData = rawData.map(l => ({
      time: convertDateToChartTime(l.timestamp!),
      value: l.averageResponseTimeInMs!,
      color: (() => {
        if (new Date(l.timestamp!).getTime() > new Date().getTime()) {
          return "gray"
        }
        return undefined
      })(),
    }))
    rtChartMemo()!.series.setData(rtData ?? [])
    rtChartMemo()!.chart.timeScale().fitContent()

    const loadData = rawData.map(l => ({
      time: convertDateToChartTime(l.timestamp!),
      value: l.averageSystemLoad! * 100,
      color: (() => {
        if (new Date(l.timestamp!).getTime() > new Date().getTime()) {
          return "gray"
        }
        if (l.averageSystemLoad! < 0.33) {
          return cssvar("--success")
        }
        if (l.averageSystemLoad! < 0.66) {
          return cssvar("--warning")
        }
        return cssvar("--failure")
      })(),
    }))
    loadChartMemo()!.series.setData(loadData ?? [])
    loadChartMemo()!.chart.timeScale().fitContent()
  })

  return (
    <>
      <Section size="xl" marginY flex style={{ "flex-grow": 1 }}>
        <Title>Server Load</Title>

        <h4>Requests per Minute</h4>
        <div ref={setRPMChartContainer} style={{ "height": "300px" }} />
        <h4>Average Response Time</h4>
        <div ref={setRTChartContainer} style={{ "height": "300px" }} />
        <h4>Average System Load</h4>
        <div ref={setLoadChartContainer} style={{ "height": "150px" }} />
      </Section>
    </>
  )
}

export default ServerLoadView
