import { Accessor, createEffect, createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import { isServer } from "solid-js/web"
import fetchFromApi from "./fetchFromApi"

const [graphqlEndpoint, setGraphqlEndpoint] = createSignal<string>("")

export {
  graphqlEndpoint,
  setGraphqlEndpoint,
}

type GraphQLOptions = {
  query: string
  variables?: Record<string, unknown>
}

type GraphQLResult<T = any> = {
  errors?: { message?: string, stack?: string }[]
  data: T | null
}

class GraphQLError extends Error { }

const extractFileVariables = (variables: unknown, path = "$", result?: Map<string, File>) => {
  result ??= new Map<string, File>()
  if (!variables) {
    return result
  }

  for (const [key, value] of Object.entries(variables)) {
    if (typeof value !== "object") {
      continue
    }

    const childPath = `${path}.${key}`

    if (value instanceof File) {
      result.set(childPath, value)
    } else {
      extractFileVariables(value, childPath, result)
    }
  }

  return result
}

const _fetchGraphQL = async (options: GraphQLOptions, accept?: string) => {
  let body: string | FormData = JSON.stringify({
    query: options.query,
    variables: options.variables,
  })

  const files = extractFileVariables(options.variables)
  if (files.size) {
    const graphql = body
    body = new FormData()
    body.set("graphql", graphql)
    for (const [k, v] of files) {
      body.set(k, v)
    }
  }

  const response = await fetchFromApi(graphqlEndpoint(), {
    method: "POST",
    headers: {
      ...((typeof body === "string") ? { "content-type": "application/json" } : {}),
      "accept": accept ?? "application/graphql-response+json, application/json",
    },
    body,
  })

  return response
}

const fetchGraphQL = async <T>(options: GraphQLOptions) => {
  const response = await _fetchGraphQL(options)

  const json = await response.json() as GraphQLResult<T> | undefined

  const firstError = json?.errors?.[0]
  if (firstError) {
    throw new GraphQLError(firstError.stack ?? firstError.message)
  }

  if (!response.ok) {
    throw new GraphQLError(response.statusText)
  }

  if (!json?.data) {
    throw new GraphQLError("Unexpected")
  }

  return json.data
}

export default fetchGraphQL

const subscribeGraphQL = async <T>(options: GraphQLOptions & { onmessage: (msg: { data: T | null, errors: { message: string }[] | null }) => void }) => {
  const response = await _fetchGraphQL(options, "text/event-stream")

  const body = response.body?.pipeThrough(new TextDecoderStream()).getReader()
  if (!body) {
    throw new Error("fdm")
  }

  void (async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const r = await body.read()
      if (r.value) {
        r.value = r.value.slice(r.value.indexOf(" "))
        options.onmessage(JSON.parse(r.value))
      }
      if (r.done) {
        break
      }
    }
  })()

  return () => {
    body.cancel()
  }
}

export const gql = (query: TemplateStringsArray) =>
  query
    .join(" ")
    .replace(/#.+\r?\n|\r/g, "")
    .replace(/\r?\n|\r/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()

type GraphQLResourceOptions<T, I extends T = T> = Omit<GraphQLOptions, "variables"> & {
  initialValue?: I
  onError?: (error: Error) => void
  variables?: Record<string, unknown> | Accessor<Record<string, unknown> | undefined>
  infinite?: (prev: T | undefined, next: T) => T
}

const createGraphQLResource = <T>(options: GraphQLResourceOptions<T>) => {
  const [state, setState] = createStore({
    loading: isServer,
    data: undefined as T | undefined,
    error: undefined as Error | undefined,
  })

  const [refresh, setRefresh] = createSignal(false)

  createEffect((previousEffect?: { cancelled: boolean, stringifiedVariables: string }) => {
    if (refresh()) {
      setRefresh(false)
      return undefined
    }

    const query = options.query
    const variables = (() => {
      if (typeof options.variables === "function") {
        return options.variables()
      } else {
        return options.variables
      }
    })()

    if (!variables || isServer) {
      return undefined
    }

    const stringifiedVariables = JSON.stringify(variables)
    if (stringifiedVariables === previousEffect?.stringifiedVariables) {
      return undefined
    }

    const effect = {
      cancelled: false,
      stringifiedVariables,
    }

    setState(state => ({
      ...state,
      loading: true,
    }))

    if (previousEffect) {
      previousEffect.cancelled = true
    }

    void (async () => {
      let data: typeof state.data = undefined
      let error: typeof state.error = undefined

      try {
        data = await fetchGraphQL<T>({ query, variables })
      } catch (e: any) {
        console.warn("GraphQL error", e)
        error = e
      } finally {
        if (!effect.cancelled) {
          setState(state => ({
            ...state,
            loading: false,
            data: (data && options.infinite) ? options.infinite(state.data, data) : data,
            error,
          }))
        }
      }
    })()

    return effect
  })

  createEffect(() => {
    if (!state.error) {
      return
    }

    options.onError?.(state.error)
  })

  return {
    get loading() {
      return state.loading
    },
    get data() {
      return state.data
    },
    get error() {
      return state.error
    },
    refresh() {
      setRefresh(true)
    },
    clear() {
      setState({
        loading: false,
        data: undefined,
        error: undefined,
      })
    },
  }
}

export {
  subscribeGraphQL,
  createGraphQLResource,
}
