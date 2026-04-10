import { Router } from "@oak/oak"
import { getOakServerLoad } from "gazatu-api-lib"
import { assertAuth } from "../auth.ts"
import { database } from "../database.ts"
import { explain } from "./SQL.ts"

export const miscRouter = new Router()

miscRouter.get("/server-load.json", async ctx => {
  await assertAuth(ctx.request, ["admin"])

  ctx.response.type = "application/json"
  ctx.response.body = getOakServerLoad()
})

// miscRouter.get("/sqls.ws", async ctx => {
//   await ensureAuth(ctx.request, ["sql/reader"])

//   const ls = sqls.command.spawn()

//   const ws = ctx.upgrade()
//   ws.onclose = () => {
//     try {
//       ls.kill()
//     } catch {
//       // ignore
//     }
//   }

//   const decoder = new TextDecoder()

//   const writer = ls.stdin.getWriter()
//   ws.onmessage = async message => {
//     const data = new Uint8Array(message.data)
//     if (decoder.decode(data).includes("executeQuery")) {
//       return
//     }

//     await writer.ready
//     await writer.write(data)
//   }

//   void (async () => {
//     for await (const chunk of ls.stdout.values()) {
//       if (ws.readyState !== WebSocket.OPEN) {
//         break
//       }

//       ws.send(chunk)
//     }
//   })()
// })

interface SQLite3FunctionInfo {
  readonly name: string
  readonly narg: number
}

interface SQLite3TableInfo {
  readonly name: string
  readonly page: number
  readonly cols: {
    readonly name: string
    readonly type: string
    readonly notnull: 0 | 1
  }[]
  readonly findAlias: (sql: string) => string | undefined
}

class SQLite3LanguageServer {
  public functions: SQLite3FunctionInfo[] = []
  public tables: SQLite3TableInfo[] = []

  async initialize() {
    this.functions = await database.sql`SELECT "name", "narg" FROM pragma_function_list()`

    this.tables = await database.sql`SELECT mst."name", mst."rootpage" as "page", (select json_group_array(json_object('name', "name", 'type', "type", 'notnull', "notnull")) from pragma_table_info(mst."name")) AS "cols" FROM "sqlite_master" mst WHERE mst."type" = 'table'`
    for (const table of this.tables) {
      const aliasRegexp = new RegExp(`([fF][rR][oO][mM]|[jJ][oO][iI][nN]) "?${table.name}"?( "?(\\w+)"?)?`)
      Object.assign(table, {
        cols: JSON.parse(table.cols as any),
        findAlias: (sql: string) => {
          const match = aliasRegexp.exec(sql)
          if (!match) {
            return undefined
          }
          return match[3]
        },
      })
    }
  }

  async explain(sql: string) {
    const opens = (await explain(sql))
      .filter(op => op.opcode.startsWith("Open"))
      .map(op => this.tables.find(t => t.page === op.p2))
      .filter(t => !!t)

    return {
      opens: opens.map(table => {
        return {
          name: table.name,
          alias: table.findAlias(sql),
          columns: table.cols,
        }
      }),
    }
  }
}

// void (async () => {
//   try {
//     const query = "SELECT * FROM AuditLogEntry audit JOIN User usr ON usr.id = ?;"

//     const sqls = new SQLite3LanguageServer()
//     await sqls.initialize()

//     const result = await sqls.explain(query)
//     console.log(result)
//   } catch (error) {
//     console.log(error)
//   }
// })()
