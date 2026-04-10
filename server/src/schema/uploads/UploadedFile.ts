import { arrayOf, Complexity, defineN2MRelation, gqlclass, gqlResolver, nullable, RunTyped, sql, sqlclass, sqliteSelectWithGraphQL } from "gazatu-api-lib"
import { basename } from "node:path"
import { getCurrentUser, hasAuth } from "../auth.ts"
import { database } from "../database.ts"
import { User, UserSharable } from "../misc/User.ts"
import { SchemaContext, SchemaFields } from "../schema.ts"

@sqlclass()
@gqlclass()
export class UserGroup {
  @RunTyped.field(String, {
    sql: { pk: true },
    gql: { optional: true },
  })
  id!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  name!: string

  @RunTyped.field(String, {
    sql: {},
    gql: { only: "output" },
  })
  createdAt!: string

  @RunTyped.field(String, {
    sql: {},
    gql: { only: "output" },
  })
  updatedAt!: string

  static async findManyByUser(user: User) {
    const result = await database
      .n2m(UserGroup, User)
      .findMany(null, user.id)
    return result
  }
}

export const N2M_UserGroup_User = defineN2MRelation(UserGroup, User)

@sqlclass()
@gqlclass()
export class UploadedFile {
  @RunTyped.field(String, {
    sql: { pk: true },
    gql: { optional: true },
  })
  id!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  dirname?: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  basename?: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  path!: string

  @RunTyped.field(Boolean, {
    sql: {},
    gql: {},
  })
  isDirectory!: boolean

  @RunTyped.field(nullable(String), {
    sql: { ref: User },
    gql: { only: "output" },
  })
  ownerId!: string | null

  @gqlclass.resolver({
    type: nullable(UserSharable),
    resolve: async (self: UploadedFile, args, ctx: SchemaContext) => {
      if (!await hasAuth(ctx.request)) {
        return null
      }
      return await database
        .findOne(User)
        .byId(self.ownerId)
    },
    description: "",
    extensions: {
      complexity: Complexity.SIMPLE_QUERY,
    },
  })
  owner?: User

  @RunTyped.field(nullable(String), {
    sql: { ref: UserGroup },
    gql: {},
  })
  groupId!: string | null

  @gqlclass.resolver({
    type: nullable(UserGroup),
    resolve: async (self: UploadedFile, args, ctx: SchemaContext) => {
      return await database
        .findOne(UserGroup)
        .byId(self.groupId)
    },
    description: "",
    extensions: {
      complexity: Complexity.SIMPLE_QUERY,
    },
  })
  group?: UserGroup

  @RunTyped.field(Boolean, {
    sql: {},
    gql: {},
  })
  writableByGroup!: boolean

  @RunTyped.field(Boolean, {
    gql: {},
  })
  writable?: boolean

  @RunTyped.field(Boolean, {
    sql: {},
    gql: {},
  })
  readableByPublic!: boolean

  @RunTyped.field(String, {
    sql: {},
    gql: { only: "output" },
  })
  createdAt!: string

  @RunTyped.field(String, {
    sql: {},
    gql: { only: "output" },
  })
  updatedAt!: string

  @gqlclass.resolver({
    type: String,
    resolve: (self: UploadedFile, args, ctx: SchemaContext) => {
      if (self.isDirectory) {
        return ""
      }
      return `/uploaded/${self.id}/${basename(self.path)}`
    },
  })
  location?: string
}

export const UploadedFileResolver: SchemaFields = {
  Query: {
    uploadedFiles: gqlResolver({
      type: arrayOf(UploadedFile),
      args: {
        dirname: {
          type: String,
        },
      },
      resolve: async (_, args, ctx, info) => {
        const user = await getCurrentUser(ctx.request)

        return await database
          .from(UploadedFile)
          .$plug(sqliteSelectWithGraphQL(info))
          .select(sql`
            ("ownerId" = ${user?.id}) OR
            ("groupId" IN (SELECT "UserGroup_id" FROM "N2M_UserGroup_User" WHERE "User_id" = ${user?.id}) AND "writableByGroup")
          `.as("writable"))
          .where("dirname", "=", sql.arg(args.dirname))
          .where(sql`
            ("ownerId" = ${user?.id}) OR
            ("groupId" IN (SELECT "UserGroup_id" FROM "N2M_UserGroup_User" WHERE "User_id" = ${user?.id})) OR
            ("readableByPublic")
          `)
      },
      description: "/",
      extensions: {
        complexity: Complexity.DEFAULT,
      },
    }),
  },
}
