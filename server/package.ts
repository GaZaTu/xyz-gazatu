import { copy, exists } from "@std/fs"
import config from "./src/config.ts"

const compile = new Deno.Command(Deno.execPath(), {
  args: ["task", "compile"],
})

await compile.spawn().output()

const staticDir = "./compiled/client"
try {
  await Deno.remove(staticDir, { recursive: true })
} catch { /* ignore */ }
if (await exists(config.staticDir)) {
  await copy(config.staticDir, staticDir)
}
