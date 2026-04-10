import { AnchorContext } from "@gazatu/solid-spectre/ui/A.Context"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { FeatherIconProvider } from "@gazatu/solid-spectre/util/FeatherIconProvider"
import { useColorSchemeEffect } from "@gazatu/solid-spectre/util/colorScheme"
import { Router, useLocation, useNavigate } from "@solidjs/router"
import { Component } from "solid-js"
import AppRoot from "./AppRoot"
import { setDefaultFetchInfo } from "./lib/fetchFromApi"
import { setGraphqlEndpoint } from "./lib/fetchGraphQL"
import routes from "./routes"

Icon.registerProvider(FeatherIconProvider)

AnchorContext.useLocation = useLocation as any
AnchorContext.useNavigate = useNavigate

// setDefaultFetchInfo("http://localhost:34666")
setDefaultFetchInfo("https://api.gazatu.xyz")
setGraphqlEndpoint("/graphql")

type Props = {
  url?: string
  // head?: ComponentProps<typeof MetaProvider>["tags"]
}

const App: Component<Props> = props => {
  useColorSchemeEffect()

  return (
    <Router url={props.url} root={AppRoot}>
      {routes}
    </Router>
  )
}

export default App
