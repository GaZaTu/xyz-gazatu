import { Complexity, RunTyped, arrayOf, getOakServerLoad, gqlResolver, gqlclass } from "gazatu-api-lib"
import { assertAuth } from "../auth.ts"
import type { SchemaFields } from "../schema.ts"

@gqlclass()
export class ServerLoadResultObject {
  @RunTyped.field(String, {
    gql: {},
  })
  timestamp!: string

  @RunTyped.field(Number, {
    gql: {},
  })
  requestsPerMinute!: number

  @RunTyped.field(Number, {
    gql: {},
  })
  averageResponseTimeInMs!: number

  @RunTyped.field(Number, {
    gql: {},
  })
  averageSystemLoad!: number

  @RunTyped.field(Number, {
    gql: {},
  })
  totalMemoryInGB!: number

  @RunTyped.field(Number, {
    gql: {},
  })
  averageFreeMemoryInGB!: number

  @RunTyped.field(Number, {
    gql: {},
  })
  averageUsedMemoryInGB!: number
}

export const ServerLoadResolver: SchemaFields = {
  Query: {
    serverLoad: gqlResolver({
      type: arrayOf(ServerLoadResultObject),
      args: {},
      resolve: async (_, { }, ctx) => {
        await assertAuth(ctx.request, ["admin"])

        const result = getOakServerLoad()
        return result
      },
      description: "requires role: admin",
      extensions: {
        complexity: Complexity.SIMPLE_QUERY,
      },
    }),
  },
}
