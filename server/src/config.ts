import { appdataDir, readConfigFile, type HttpServerConfig, type SmtpClientConfig } from "gazatu-api-lib"

export type AppConfig = HttpServerConfig & {
  development: boolean
  defaultUserRoleMapping?: Record<string, string[]>
  clientUrl?: string
  smtp?: SmtpClientConfig
  applicationIdList?: string[]
}

const configDefaults: AppConfig = {
  development: true,
  host: "127.0.0.1",
  port: 34666,
  behindProxy: false,
  staticDir: `${appdataDir}/static`,
  static404File: "/index.html",
  staticVolatileFilesMap: {
    "/": true,
    "/index.html": true,
    "/manifest.json": true,
    "/asset-manifest.json": true,
    "/service-worker.ts": true,
  },
}

const config = {
  ...configDefaults,
  ...readConfigFile<AppConfig>(),
}

if (!config.development) {
  Deno.env.set("NODE_ENV", "production")
}

export default config
