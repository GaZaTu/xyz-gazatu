import config from "./config.ts"
// config should be first
import { appDir, getCurrentOakServerLoad, listen } from "gazatu-api-lib"

const { database } = await import("./schema/database.ts")
await database.initialize()

if (config.development) {
  const logDebugInfo = () => {
    const load = getCurrentOakServerLoad()
    const loadavg = (Deno.loadavg()[0] ?? 0) / navigator.hardwareConcurrency
    const memoryFree = Deno.systemMemoryInfo().available / 1024 / 1024 / 1024
    const memoryUsage = Deno.memoryUsage().rss / 1024 / 1024 / 1024

    console.log(`[${new Date().toISOString()} dbg] freeMem:${memoryFree.toFixed(2)}GB usedMem:${memoryUsage.toFixed(2)}GB rpm:${load.requestsPerMinute.toFixed(2)} avg:${load.averageResponseTimeInMs.toFixed(0)}ms load:${loadavg.toFixed(2)}`)
  }

  setInterval(logDebugInfo, 1000 * 60 * 10)
}

try {
  const { graphqlRouter } = await import("./schema/graphql.ts")
  const { miscRouter } = await import("./schema/misc/_router.ts")

  const server = listen(config, [
    graphqlRouter,
    miscRouter,
  ])

  server.addEventListener("error", event => {
    console.log(`[${new Date().toISOString()} dbg] http-server error event`, event)
  })

  server.addEventListener("close", event => {
    console.log(`[${new Date().toISOString()} dbg] http-server close event`, event)
  })

  await server.onListen
  console.log(`listening on ${server.url}`)
} catch (error) {
  console.error(error)
} finally {
  if (!Deno.build.standalone) {
    const execDenoCommand = (...args: string[]) =>
      new Deno.Command(Deno.execPath(), { args }).spawn().output()
    await execDenoCommand("run", "--allow-all", `${appDir}/src/export-schema.ts`)
  }
}
