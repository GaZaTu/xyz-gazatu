import { createEffect } from "solid-js"

const createCancellableEffect = (fn: (effect: { cancelled: boolean }) => void) => {
  createEffect<{ cancelled: boolean }>(prevEffect => {
    if (prevEffect) {
      prevEffect.cancelled = true
    }

    const thisEffect = {
      cancelled: false,
    }

    fn(thisEffect)

    return thisEffect
  })
}

export default createCancellableEffect
