import { Complexity, RunTyped, gqlResolver, gqlclass, nullable } from "gazatu-api-lib"
import { assertAuth, hasAuth } from "../auth.ts"
import { database } from "../database.ts"
import type { SchemaFields } from "../schema.ts"
import { UserPrivate } from "./User.ts"

export const explain = async (sql: string) => {
  const result = await database.read!(`EXPLAIN ${sql}`, [])
  return result as {
    addr: number
    opcode: string
    p1: number | null
    p2: number | null
    p3: number | null
    p4: number | null
    p5: number | null
  }[]
}

const illegalTablePages = new Set<number>()
const illegalTableNames = [
  UserPrivate.name,
]

@gqlclass()
export class SQLQueryResult {
  @RunTyped.field(nullable(String), {
    gql: {},
  })
  error!: string | null

  @RunTyped.field(nullable(String), {
    gql: {},
  })
  dataAsJson!: string | null
}

export const SQLResolver: SchemaFields = {
  Query: {
    sqlQuery: gqlResolver({
      type: SQLQueryResult,
      args: {
        sql: {
          type: String,
        },
      },
      resolve: async (_, { sql }, ctx) => {
        await assertAuth(ctx.request, ["sql/reader"])

        if (illegalTablePages.size !== illegalTableNames.length) {
          const master = await database.sql`SELECT "rootpage" FROM "sqlite_master" WHERE "type" = 'table' AND "name" IN ${illegalTableNames}` as { rootpage: number }[]
          for (const table of master) {
            illegalTablePages.add(table.rootpage)
          }
        }

        const bytecode = await explain(sql)

        const hasOpenIllegalTable = !!bytecode
          .find(op => op.opcode.startsWith("Open") && illegalTablePages.has(op.p2!))
        if (hasOpenIllegalTable) {
          return {
            error: "???",
            dataAsJson: null,
          }
        }

        const hasOpenWrite = !!bytecode
          .find(op => op.opcode === "OpenWrite")

        if (hasOpenWrite) {
          if (!await hasAuth(ctx.request, ["sql/writer"])) {
            return {
              error: "SQL must start with 'SELECT'",
              dataAsJson: null,
            }
          }
        } else {
          if (!sql.toUpperCase().includes("LIMIT")) {
            return {
              error: "SQL must include 'LIMIT'",
              dataAsJson: null,
            }
          }
        }

        try {
          const exec = hasOpenWrite ? database.write! : database.read!
          const data = await exec(sql, [])
          return {
            error: null,
            dataAsJson: JSON.stringify(data),
          }
        } catch (error) {
          return {
            error: String(error),
            dataAsJson: null,
          }
        }
      },
      description: "requires role: sql/reader",
      extensions: {
        complexity: Complexity.COMPLEX_QUERY,
      },
    }),
  },
}
