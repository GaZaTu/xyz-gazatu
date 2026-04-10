import { ModalPortal } from "@gazatu/solid-spectre/ui/Modal.Portal"
import { createGlobalProgressStateEffect } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { MetaProvider, Title } from "@solidjs/meta"
import { useIsRouting } from "@solidjs/router"
import { Component, ErrorBoundary, Suspense } from "solid-js"
import AppFooter from "./AppFooter"
import AppHeader from "./AppHeader"

type Props = {
  children?: any
}

const AppRoot: Component<Props> = props => {
  // only works with <Suspense>
  const routing = useIsRouting()
  createGlobalProgressStateEffect(routing)

  return (
    <MetaProvider>
      <Title>gazatu.xyz</Title>
      {/* <Meta name="description">trivia'n'shit</Meta> */}

      <AppHeader />

      <ErrorBoundary fallback={Toaster.pushError}>
        <main id="AppMain">
          <noscript class="noscript">You need to enable JavaScript to use this app!</noscript>

          <Suspense>
            {props.children}
          </Suspense>
        </main>
      </ErrorBoundary>

      <AppFooter />

      <ModalPortal />
      <Toaster />
    </MetaProvider>
  )
}

export default AppRoot
