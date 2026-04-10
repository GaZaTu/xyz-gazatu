import { stitchSchemas, type GraphQLRouterContext, type TypedGraphQLResolverMap } from "gazatu-api-lib"
import { miscSchema } from "./misc/_schema.ts"
import type { User } from "./misc/User.ts"

export type AppSchemaContext = {
  readonly hasAuth: (...needed: string[]) => Promise<boolean>
  readonly assertAuth: (...needed: string[]) => Promise<void>
  readonly user: Promise<User | undefined>
  readonly dbenv: Promise<Record<string, any>>
}

export type SchemaContext = GraphQLRouterContext & AppSchemaContext

export type SchemaFields = TypedGraphQLResolverMap<SchemaContext>

const schema = stitchSchemas({
  subschemas: [
    miscSchema,
  ],
})

export default schema
