import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { debounce } from "debounce"
import { createEffect, onCleanup } from "solid-js"

const createEventSourceEffect = (effectFn: (ev: MessageEvent) => void, getUrl: () => Promise<string | URL>) => {
  let events: EventSource | undefined

  createEffect<{ cancelled: boolean }>(prevEffect => {
    if (prevEffect) {
      prevEffect.cancelled = true
    }

    const thisEffect = {
      cancelled: false,
    }

    void (async () => {
      try {
        const url = await getUrl()
        if (thisEffect.cancelled) {
          return
        }
        events = new EventSource(url)
        events.onmessage = debounce(effectFn, 1000)
      } catch (error) {
        Toaster.pushError(error)
      }
    })()

    onCleanup(() => {
      events?.close()
    })

    return thisEffect
  })
}

export default createEventSourceEffect
