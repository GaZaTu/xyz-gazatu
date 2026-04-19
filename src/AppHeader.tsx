import { iconGithub } from "@gazatu/solid-spectre/icons/iconGithub"
import { iconLogIn } from "@gazatu/solid-spectre/icons/iconLogIn"
import { iconMoon } from "@gazatu/solid-spectre/icons/iconMoon"
import { iconSun } from "@gazatu/solid-spectre/icons/iconSun"
import { A } from "@gazatu/solid-spectre/ui/A"
import { Avatar } from "@gazatu/solid-spectre/ui/Avatar"
import { Button } from "@gazatu/solid-spectre/ui/Button"
import { CheckboxButton } from "@gazatu/solid-spectre/ui/CheckboxButton"
import { Column } from "@gazatu/solid-spectre/ui/Column"
import { Divider } from "@gazatu/solid-spectre/ui/Divider"
import { Icon } from "@gazatu/solid-spectre/ui/Icon"
import { Label } from "@gazatu/solid-spectre/ui/Label"
import { LoadingPlaceholderImg } from "@gazatu/solid-spectre/ui/LoadingPlaceholder.Img"
import { Menu } from "@gazatu/solid-spectre/ui/Menu"
import { Navbar } from "@gazatu/solid-spectre/ui/Navbar"
import { GlobalProgress } from "@gazatu/solid-spectre/ui/Progress.Global"
import { Section } from "@gazatu/solid-spectre/ui/Section"
import { Toaster } from "@gazatu/solid-spectre/ui/Toaster"
import { badge } from "@gazatu/solid-spectre/util/badge"
import { computedColorScheme, setColorScheme } from "@gazatu/solid-spectre/util/colorScheme"
import { centerChildren } from "@gazatu/solid-spectre/util/position"
import { tooltip } from "@gazatu/solid-spectre/util/tooltip"
import debounce from "debounce"
import { Component, Show, createEffect, createMemo, createRenderEffect, createSignal, onCleanup } from "solid-js"
import fetchGraphQL, { gql } from "./lib/fetchGraphQL"
import { Query, TriviaCounts } from "./lib/schema.gql"
import { createAuthCheck, storedAuth } from "./store/auth"

const [hideAppHeader, setHideAppHeader] = createSignal(false)
const createHideAppHeaderEffect = (hide: boolean) => {
  createRenderEffect(() => {
    setHideAppHeader(hide)
  })

  onCleanup(() => {
    setHideAppHeader(false)
  })
}

const [hideAppHeaderEntries, setHideAppHeaderEntries] = createSignal(false)
const createHideAppHeaderEntriesEffect = (hide: boolean) => {
  createRenderEffect(() => {
    setHideAppHeaderEntries(hide)
  })

  onCleanup(() => {
    setHideAppHeaderEntries(false)
  })
}

export {
  hideAppHeader,
  setHideAppHeader,
  createHideAppHeaderEffect,
  hideAppHeaderEntries,
  setHideAppHeaderEntries,
  createHideAppHeaderEntriesEffect,
}

const AppHeader: Component = () => {
  const isLoggedIn = createAuthCheck()
  const isAdmin = createAuthCheck("admin")
  const isTriviaAdmin = createAuthCheck("trivia/admin")
  const isSQLReader = createAuthCheck("sql/reader")

  const [triviaCounts, setTriviaCounts] = createSignal<TriviaCounts>()

  createEffect(async () => {
    const triviaAdmin = isTriviaAdmin()
    if (!triviaAdmin) {
      setTriviaCounts(undefined)
      return
    }

    const updateTriviaCounts = debounce(async () => {
      try {
        const result = await fetchGraphQL<Query>({
          query: gql`
            query {
              getTriviaCounts {
                questions
                questionsNotVerified
                categories
                categoriesNotVerified
                reports
              }
            }
          `,
        })

        setTriviaCounts(result.getTriviaCounts)
      } catch (error) {
        Toaster.pushError(error)
      }
    }, 1000)

    await updateTriviaCounts()

    // try {
    //   const result = await fetchGraphQL<Query>({
    //     query: gql`
    //       query {
    //         triviaEventsOTP
    //       }
    //     `,
    //   })

    //   const events = new EventSource(`${defaultFetchInfo()}/trivia/events?otp=${result.triviaEventsOTP}`)
    //   events.onmessage = ev => updateTriviaCounts()
    // } catch (error) {
    //   Toaster.pushError(error)
    // }
  })

  const triviaTodos = createMemo(() => {
    const counts = triviaCounts()
    if (!counts) {
      return undefined
    }

    return counts.questionsNotVerified! + counts.categoriesNotVerified! + counts.reports!
  })

  const createTriviaCountsMenuLabel = (key: keyof TriviaCounts) => {
    return (
      <Show when={triviaCounts()} keyed>
        {counts => (
          <Label color="primary">{counts[key]}</Label>
        )}
      </Show>
    )
  }

  const [expanded, setExpanded] = createSignal(false)

  return (
    <Navbar id="AppHeader" size="lg" filled style={{ display: hideAppHeader() ? "none" : "flex" }} responsive expanded={expanded()}>
      <GlobalProgress />

      <Section size="xl">
        <Navbar.Section>
          <Navbar.Brand>
            <A href="/">
              <LoadingPlaceholderImg src="/static/gazatu-xyz.nofont.min.svg" alt="gazatu.xyz logo" width={173} height={36} />
            </A>

            <Navbar.Burger expanded={expanded()} onclick={() => setExpanded(v => !v)} aria-label="toggle navigation" />
          </Navbar.Brand>

          <Show when={!hideAppHeaderEntries()}>
            <Navbar.Dropdown toggle={toggle => (
              <span {...badge(triviaTodos())} {...toggle}>Trivia</span>
            )} matchHref="/trivia">
              <Menu style={{ "min-width": "12rem" }}>
                <Menu.Item>
                  <A href="/trivia/questions/new" match="path">Submit Question</A>
                </Menu.Item>
                <Menu.Item>
                  <A href="/trivia/categories/new" match="path">Submit Category</A>
                </Menu.Item>
                <Divider />
                <Menu.Item badge={createTriviaCountsMenuLabel("questions")}>
                  <A href="/trivia/questions" match="href">Questions</A>
                </Menu.Item>
                <Show when={isTriviaAdmin()}>
                  <Menu.Item badge={createTriviaCountsMenuLabel("questionsNotVerified")}>
                    <A href="/trivia/questions" params={{ verified: false }} match="href">Questions (not verified)</A>
                  </Menu.Item>
                </Show>
                <Menu.Item badge={createTriviaCountsMenuLabel("categories")}>
                  <A href="/trivia/categories" match="href">Categories</A>
                </Menu.Item>
                <Show when={isTriviaAdmin()}>
                  <Menu.Item badge={createTriviaCountsMenuLabel("categoriesNotVerified")}>
                    <A href="/trivia/categories" params={{ verified: false }} match="href">Categories (not verified)</A>
                  </Menu.Item>
                </Show>
                <Show when={isTriviaAdmin()}>
                  <Menu.Item badge={createTriviaCountsMenuLabel("reports")}>
                    <A href="/trivia/reports" match="href">Reports</A>
                  </Menu.Item>
                </Show>
              </Menu>
            </Navbar.Dropdown>

            <Button.A href="/blog/gallery" match="prefix">Blog</Button.A>

            <Show when={isLoggedIn()}>
              <Button.A href="/trading/chart" match="path">TChart</Button.A>
            </Show>

            <Show when={isAdmin()}>
              <Navbar.Dropdown toggle={toggle => (
                <span {...toggle}>Meta</span>
              )} matchHref="/meta">
                <Menu style={{ "min-width": "12rem" }}>
                  <Menu.Item>
                    <A href="/meta/users" match="path">Users</A>
                  </Menu.Item>
                  <Menu.Item>
                    <A href="/meta/password-reset-requests" match="path">Password Reset Requests</A>
                  </Menu.Item>
                  <Menu.Item>
                    <A href="/meta/audit-log" match="path">Audit Log</A>
                  </Menu.Item>
                  <Menu.Item>
                    <A href="/meta/server-load" match="path">Server Load</A>
                  </Menu.Item>
                  <Show when={isSQLReader()}>
                    <Menu.Item>
                      <A href="/meta/sql" match="path">SQL Tool</A>
                    </Menu.Item>
                  </Show>
                </Menu>
              </Navbar.Dropdown>
            </Show>
          </Show>
        </Navbar.Section>

        <Navbar.Section>
          <Show when={!hideAppHeaderEntries()}>
            <Column.Row gaps="sm">
              <Column class={`${centerChildren(true)}`}>
                <Button.A href="http://github.com/GaZaTu/gazatu-website-graphql-solidjs-spectre" color="gray" action {...tooltip("open github", "bottom")}>
                  <Icon src={iconGithub} />
                </Button.A>
              </Column>

              <Column class={`${centerChildren(true)}`}>
                <CheckboxButton checked={computedColorScheme() === "dark"} onclick={() => setColorScheme((computedColorScheme() === "dark") ? "light" : "dark")} {...tooltip("toggle color scheme", "bottom")} color="gray" action circle={false}
                  ifTrue={<Icon src={iconSun} />}
                  ifFalse={<Icon src={iconMoon} />}
                />
              </Column>

              <Column class={`${centerChildren(true)}`}>
                <Show when={storedAuth()} fallback={
                  <Button.A href="/login" color="primary" action {...tooltip("login", "bottom")}>
                    <Icon src={iconLogIn} />
                  </Button.A>
                }>
                  <A href="/profile">
                    <Avatar size="btn" initials={storedAuth()?.user?.username?.slice(0, 2)} {...tooltip("user profile", "bottom")} />
                  </A>
                </Show>
              </Column>
            </Column.Row>
          </Show>
        </Navbar.Section>
      </Section>
    </Navbar>
  )
}

export default AppHeader
