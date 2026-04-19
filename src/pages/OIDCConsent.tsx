import { Button } from "@gazatu/solid-spectre/ui/Button"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Component } from "solid-js"
import { createHideAppHeaderEntriesEffect } from "../AppHeader"
import { defaultFetchInfo } from "../lib/fetchFromApi"

const OIDCConsentView: Component = () => {
  // const navigate = useNavigate()

  // const isLoggedIn = createAuthCheck()
  // createEffect(() => {
  //   if (!isLoggedIn()) {
  //     navigate("/404")
  //   }
  // })

  createHideAppHeaderEntriesEffect(true)

  const url = new URL(location.href)
  const authorize = () => {
    const interaction = url.searchParams.get("oidc-interaction")
    if (interaction) {
      const targetUrl = new URL(`${defaultFetchInfo()}/oidc/interaction/${interaction}/consent`)
      location.href = String(targetUrl)
    }
  }

  return (
    <Section size="xl" marginY>
      <p>Application {url.searchParams.get("client")} requesting OIDC authorization.</p>
      <Button onclick={authorize}>Authorize</Button>
    </Section>
  )
}

export default OIDCConsentView
