import { arrayOf, Complexity, defineN2MRelation, gqlclass, nullable, RunTyped, sql, sqlclass } from "gazatu-api-lib"
import { database } from "../database.ts"
import type { SchemaContext } from "../schema.ts"

@sqlclass()
@gqlclass()
export class UserRole {
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

  @RunTyped.field(nullable(String), {
    sql: {},
    gql: {},
  })
  description!: string
}

@sqlclass()
@gqlclass()
export class User {
  @RunTyped.field(String, {
    sql: { pk: true },
    gql: { optional: true },
  })
  id!: string

  @RunTyped.field(String, {
    sql: {},
    gql: {},
  })
  username!: string

  @RunTyped.field(nullable(String), {
    sql: {},
    gql: {},
  })
  email!: string | null

  @RunTyped.field(Boolean, {
    sql: {},
    gql: { only: "output" },
  })
  activated!: boolean

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
    type: arrayOf(UserRole),
    resolve: async (self: User, args, ctx: SchemaContext) => {
      return await User.getRoles(self)
    },
    description: "",
    extensions: {
      complexity: Complexity.SIMPLE_QUERY,
    },
    allowInput: "optional",
  })
  roles?: UserRole[]

  static async getRoles(user: User) {
    const result = await database
      .n2m(UserRole, User)
      .findMany(null, user.id)
    return result
  }

  static async getPushSubscriptions(user: User) {
    const result = await database
      .findMany(UserPushSubscription)
      .where("userId", "=", sql.arg(user.id))
    return result
  }
}

export const N2M_User_UserRole = defineN2MRelation(User, UserRole)

@gqlclass()
export class UserSharable implements Partial<User> {
  @RunTyped.field(String, {
    gql: {},
  })
  id!: string

  @RunTyped.field(String, {
    gql: {},
  })
  username!: string
}

@sqlclass()
export class UserPrivate {
  @RunTyped.field(String, {
    sql: { pk: true, ref: User },
  })
  userId!: string

  @RunTyped.field(nullable(String), {
    sql: {},
  })
  password?: string | null

  @RunTyped.field(nullable(String), {
    sql: {},
  })
  passwordResetId?: string | null

  @RunTyped.field(nullable(String), {
    sql: {},
  })
  passwordResetAt?: string | null

  @RunTyped.field(nullable(String), {
    sql: {},
  })
  webpush?: string | null
}

@sqlclass()
export class UserPushSubscription {
  @RunTyped.field(String, {
    sql: { pk: true },
  })
  id!: string

  @RunTyped.field(String, {
    sql: { ref: User },
  })
  userId!: string

  @RunTyped.field(String, {
    sql: {},
  })
  info!: string

  @RunTyped.field(String, {
    sql: {},
  })
  json!: string

  @RunTyped.field(Number, {
    sql: {},
  })
  failures!: number
}

@gqlclass()
export class Auth {
  @RunTyped.field(String, {
    gql: {},
  })
  token!: string

  @RunTyped.field(String, {
    gql: {},
  })
  user!: User
}

// @gqlclass()
// export class UserPasswordRules {
// }
