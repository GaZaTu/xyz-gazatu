import { GraphQLRouter } from "gazatu-api-lib"
import config from "../config.ts"
import { assertAuth, createDatabaseEnv, getCurrentUser, hasAuth } from "./auth.ts"
import { database } from "./database.ts"
import schema, { AppSchemaContext } from "./schema.ts"

export const graphqlRouter = new GraphQLRouter({
  path: "/graphql",
  schema,
  development: config.development,
  createContext: (request): AppSchemaContext => {
    return {
      hasAuth: (...needed) => {
        return hasAuth(request, needed)
      },
      assertAuth: (...needed) => {
        return assertAuth(request, needed)
      },
      get user() {
        return getCurrentUser(request)
      },
      get dbenv() {
        return createDatabaseEnv(request)
      },
    }
  },
})
await graphqlRouter.loadServerQueries()
