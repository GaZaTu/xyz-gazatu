import { Complexity, Node, RunTyped, Unknown, gqlArgsObject, gqlPaginationArgs, gqlResolver, gqlclass, nullable, paginationOf, sql, sqlclass, sqliteSelectWithGraphQL, sqliteWebPaginated } from "gazatu-api-lib"
import { assertAuth } from "../auth.ts"
import { database } from "../database.ts"
import type { SchemaContext, SchemaFields } from "../schema.ts"
import { User } from "./User.ts"

@sqlclass()
@gqlclass()
export class AuditLogEntry {
  @RunTyped.field(String, {
    sql: { pk: true },
    gql: {},
  })
  id!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  srcTable!: string

  @RunTyped.field(Unknown, {
    sql: {},
    gql: {},
  })
  srcRowid!: unknown

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  operation!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  timestamp!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  newValues!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  oldValues!: string

  @RunTyped.field(nullable(String), {
    sql: {},
    gql: {},
  })
  description!: string | null

  @RunTyped.field(nullable(String), {
    sql: { ref: User },
    gql: {},
  })
  userId!: string | null

  @gqlclass.resolver({
    type: nullable(User),
    resolve: async (self: AuditLogEntry, args, ctx: SchemaContext) => {
      const result = await database
        .findOne(User)
        .byId(self.userId)
      return result
    },
    description: "",
    extensions: {
      complexity: Complexity.SIMPLE_QUERY,
    },
  })
  user?: User | null
}

export const AuditLogEntryResolver: SchemaFields = {
  Query: {
    node: gqlResolver({
      type: nullable(Node),
      args: {
        id: {
          type: String,
        },
      },
      resolve: async (_, args, ctx, info) => {
        const audit = await database
          .findOne(AuditLogEntry)
          .where("srcRowid", "=", sql.arg(args.id))
        if (!audit) {
          return undefined
        }

        const result = await database
          .findOne(sql.tbl(audit.srcTable))
          .byId(args.id)
        if (!result) {
          return undefined
        }

        return {
          ...result,
          __typename: audit.srcTable!,
        } as Node
      },
      description: "/",
      extensions: {
        complexity: Complexity.SIMPLE_QUERY,
      },
    }),
    auditLogEntryListConnection: gqlResolver({
      type: paginationOf(AuditLogEntry),
      args: gqlArgsObject("AuditLogEntryListConnectionArgs", {
        ...gqlPaginationArgs,
        srcTable: {
          type: nullable(String),
        },
        srcRowid: {
          type: nullable(Unknown),
        },
      }),
      resolve: async (_, { args }, ctx, info) => {
        await assertAuth(ctx.request, ["admin"])

        const result = await database
          .from(AuditLogEntry)
          .$plug(sqliteSelectWithGraphQL(info))
          .$if(args?.srcTable, s => s
            .where("srcTable", "=", sql.arg(args?.srcTable))
          )
          .$if(args?.srcRowid, s => s
            .where("srcRowid", "=", sql.arg(args?.srcRowid))
          )
          .orderBy("timestamp", "DESC")
          .$find(sqliteWebPaginated(args?.window))
        return result
      },
      description: "requires role: admin",
      extensions: {
        complexity: Complexity.PAGINATION,
      },
    }),
  },
}
