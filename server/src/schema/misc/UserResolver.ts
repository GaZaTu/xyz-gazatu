import { createHttpError, Request, Status } from "@oak/oak"
import { argon2HashPassword, argon2VerifyPassword, arrayOf, Complexity, gqlResolver, JWT, nullable, sql, Void } from "gazatu-api-lib"
import type { GraphQLFieldResolver } from "graphql"
import config from "../../config.ts"
import { assertAuth, getCurrentUser, hasAuth } from "../auth.ts"
import { database } from "../database.ts"
import type { SchemaContext, SchemaFields } from "../schema.ts"
import smtp from "../smtp.ts"
import { Auth, User, UserPrivate, UserRole } from "./User.ts"

interface AuthAttempt {
  count: number
  timestamp: number
}

const recentAuthAttempts = new Map<string, AuthAttempt>()

const authenticate: GraphQLFieldResolver<Record<any, any>, SchemaContext, { username: string, password?: string | null }, Promise<Auth>> = async (_, args, ctx) => {
  const { request } = ctx
  if (!request) {
    throw new Error("!http")
  }

  const recentAuthAttempt = recentAuthAttempts.get(request.ip)
  if (recentAuthAttempt) {
    const seconds = (s: number) => s * 1000
    const minutes = (m: number) => seconds(m * 60)

    let waitMs = 0

    if (recentAuthAttempt.count > 12) {
      waitMs = minutes(5)
    } else if (recentAuthAttempt.count > 6) {
      waitMs = minutes(1)
    } else if (recentAuthAttempt.count > 3) {
      waitMs = seconds(5)
    }

    if (recentAuthAttempt.timestamp > (Date.now() - waitMs)) {
      throw createHttpError(Status.TooManyRequests, "Too many failed authentication attempts")
    }

    recentAuthAttempt.count += 1
    recentAuthAttempt.timestamp = Date.now()
  }

  const user = await database
    .findOne(User)
    .where("username", "=", sql.arg(args.username))
  const userPrivate = await database
    .findOne(UserPrivate)
    .where("userId", "=", sql.arg(user?.id))

  if (user && userPrivate && user.activated && args.password) {
    try {
      await argon2VerifyPassword(args.password, userPrivate.password!)

      if (recentAuthAttempt) {
        recentAuthAttempts.delete(request.ip)
      }

      return {
        token: await JWT.create({ userId: user.id }),
        user: {
          ...user,
          roles: await User.getRoles(user),
        },
      }
    } catch {
      // ignore
    }
  }

  if (!recentAuthAttempt) {
    recentAuthAttempts.set(request.ip, {
      count: 1,
      timestamp: Date.now(),
    })
  }

  throw createHttpError(Status.BadRequest, "username and password do not match")
}

const requestPasswordReset = async (user: User, { request }: { request?: Request }, subject: string) => {
  const userPrivate = await database
    .findOne(UserPrivate)
    .where("userId", "=", sql.arg(user.id))
  if (!userPrivate) {
    throw new Error()
  }

  userPrivate.passwordResetId = database.newid()
  userPrivate.passwordResetAt = new Date().toISOString()
  await database
    .store(UserPrivate, userPrivate)

  const host = config.behindProxy ? request?.headers.get("X-Forwarded-Host") : request?.headers.get("Host")
  const prefix = config.prefix ?? ""
  const url = `${host}${prefix}/reset-password?id=${userPrivate.passwordResetId}`

  try {
    await smtp!.send({
      to: user.email!,
      subject,
      text: url,
      html: `<a href="${url}">${url}</a>`,
    })
  } catch (error) {
    userPrivate.passwordResetId = null
    userPrivate.passwordResetAt = null
    await database
      .store(UserPrivate, userPrivate)

    throw error
  }
}

export const UserResolver: SchemaFields = {
  Query: {
    emailsAreSupported: gqlResolver({
      type: Boolean,
      resolve: () => !!smtp,
      description: "/",
      extensions: {
        complexity: Complexity.DEFAULT,
      },
    }),
    userById: gqlResolver({
      type: nullable(User),
      args: {
        id: {
          type: String,
        },
      },
      resolve: async (_, args, ctx) => {
        await assertAuth(ctx.request)

        const user = await getCurrentUser(ctx.request)
        if (args.id !== user!.id) {
          await assertAuth(ctx.request, ["admin"])
        } else {
          // TODO: log activity
        }

        const result = await database
          .findOne(User)
          .byId(args.id)
        return result
      },
      description: "requires role: admin or (id == currentUser.id)",
      extensions: {
        complexity: Complexity.SIMPLE_QUERY,
      },
    }),
    userList: gqlResolver({
      type: arrayOf(User),
      resolve: async (_, args, ctx) => {
        await assertAuth(ctx.request, ["admin"])

        const result = await database
          .findMany(User)
        return result
      },
      description: "requires role: admin",
      extensions: {
        complexity: Complexity.PAGINATION,
      },
    }),
    userRoleList: gqlResolver({
      type: arrayOf(UserRole),
      resolve: async (_, args, ctx) => {
        const result = await database
          .findMany(UserRole)
        return result
      },
      description: "/",
      extensions: {
        complexity: Complexity.PAGINATION,
      },
    }),
    userAuthenticate: gqlResolver({
      type: Auth,
      args: {
        username: {
          type: String,
        },
        password: {
          type: String,
        },
      },
      resolve: authenticate,
      description: "/",
      extensions: {
        complexity: Complexity.MUTATION,
      },
    }),
    // userPasswordRules: gqlResolver({
    //   type: UserPasswordRules,
    //   args: {},
    //   resolve: async (_, args, ctx) => {
    //     return new UserPasswordRules()
    //   },
    //   description: "/",
    //   extensions: {
    //     complexity: Complexity.VIRTUAL_FIELD,
    //   },
    // }),
  },
  Mutation: {
    userCreate: gqlResolver({
      type: nullable(Auth),
      args: {
        username: {
          type: String,
        },
        password: {
          type: nullable(String),
        },
      },
      resolve: async (_, args, ctx, info) => {
        if (smtp && args.password) {
          throw new Error("password is not allowed")
        }
        if (!smtp && !args.password) {
          throw new Error("password is required")
        }

        if (args.username.length < 6 || args.username.length > 128) {
          throw new Error("username.length not between (6...128)")
        }

        if (args.password && (args.password.length < 8 || args.password.length > 64)) {
          throw new Error("password.length not between (8...64)")
        }

        const username = args.username
        const password = args.password ? await argon2HashPassword(args.password) : null

        const user = await database
          .store(User, { username, email: username, activated: !!password })
        const userPrivate = await database
          .store(UserPrivate, { userId: user.id, password })

        if (config.defaultUserRoleMapping) {
          const defaultUserRoles = config.defaultUserRoleMapping[username]
          for (const defaultUserRole of defaultUserRoles ?? []) {
            const [role] = await database
              .into(UserRole)
              .insert({ name: defaultUserRole, id: database.newid() })
              .onConflict("name").doMerge("name")
              .returning("id")

            await database
              .n2m(User, UserRole)
              .insert(user.id, role!.id)
          }
        }

        if (smtp) {
          await requestPasswordReset(user, ctx, "Account created @ZEUGE-Helfer")
          return null
        } else {
          const result = await authenticate(self, args, ctx, info)
          return result
        }
      },
      description: "/",
      extensions: {
        complexity: Complexity.MUTATION,
      },
    }),
    userUpdate: gqlResolver({
      type: Void,
      args: {
        input: {
          type: User,
        },
      },
      resolve: async (_, { input }, ctx) => {
        await assertAuth(ctx.request)

        if (!input.id) {
          return
        }

        const user = await getCurrentUser(ctx.request)
        if (input.id !== user!.id) {
          await assertAuth(ctx.request, ["admin"])
        }

        await database
          .store(User, input, await ctx.dbenv)

        if (await hasAuth(ctx.request, ["admin"])) {
          for (const role of input.roles ?? []) {
            if (!role.id) {
              const newRole = await database
                .store(UserRole, role)
              role.id = newRole.id
            }
          }

          await database
            .n2m(User, UserRole)
            .connect(input, input.roles, await ctx.dbenv)
        }
      },
      description: "requires role: admin or (input.id == currentUser.id)",
      extensions: {
        complexity: Complexity.MUTATION,
      },
    }),
    userUpdatePassword: gqlResolver({
      type: Void,
      args: {
        userId: {
          type: String,
        },
        password: {
          type: String,
        },
      },
      resolve: async (_, args, ctx, info) => {
        await assertAuth(ctx.request)

        if (args.password.length < 8 || args.password.length > 64) {
          throw new Error("password.length not between (8...64)")
        }

        const currentUser = await getCurrentUser(ctx.request)
        if (args.userId !== currentUser!.id) {
          await assertAuth(ctx.request, ["admin"])
        }

        const user = await database
          .findOne(User)
          .where("id", "=", sql.arg(args.userId))
        const userPrivate = await database
          .findOne(UserPrivate)
          .where("userId", "=", sql.arg(user?.id))
        if (!user || !userPrivate) {
          return
        }

        user.activated = true

        userPrivate.passwordResetId = null
        userPrivate.passwordResetAt = null
        userPrivate.password = await argon2HashPassword(args.password)

        await database
          .store(User, user, await ctx.dbenv)
        await database
          .store(UserPrivate, userPrivate, await ctx.dbenv)
      },
      description: "requires role: admin or (userId == currentUser.id)",
      extensions: {
        complexity: Complexity.MUTATION,
      },
    }),
    userRequestPasswordReset: gqlResolver({
      type: Void,
      args: {
        username: {
          type: String,
        },
      },
      resolve: async (_, args, ctx) => {
        if (!smtp) {
          throw new Error("email is not enabled")
        }

        const user = await database
          .findOne(User)
          .where("username", "=", sql.arg(args.username))
        const userPrivate = await database
          .findOne(UserPrivate)
          .where("userId", "=", sql.arg(user?.id))
        if (!user || !userPrivate) {
          return
        }

        userPrivate.password = null

        await database
          .store(UserPrivate, userPrivate, await ctx.dbenv)

        await requestPasswordReset(user, ctx, "Reset Password @ZEUGE-Helfer")
      },
      description: "/",
      extensions: {
        complexity: Complexity.MUTATION,
      },
    }),
    userResetPassword: gqlResolver({
      type: nullable(Auth),
      args: {
        passwordResetId: {
          type: String,
        },
        password: {
          type: String,
        },
      },
      resolve: async (_, args, ctx, info) => {
        if (args.password.length < 8 || args.password.length > 64) {
          throw new Error("password.length not between (8...64)")
        }

        const userPrivate = await database
          .findOne(UserPrivate)
          .byId(args.passwordResetId)
        if (!userPrivate) {
          return null
        }

        const user = await database
          .findOne(User)
          .byId(userPrivate.userId)
        if (!user) {
          return null
        }

        user.activated = true

        userPrivate.passwordResetId = null
        userPrivate.passwordResetAt = null
        userPrivate.password = await argon2HashPassword(args.password)

        await database
          .store(User, user, await ctx.dbenv)
        await database
          .store(UserPrivate, userPrivate, await ctx.dbenv)

        const result = await authenticate({}, { username: user.username!, password: args.password }, ctx, info)
        return result
      },
      description: "/",
      extensions: {
        complexity: Complexity.MUTATION,
      },
    }),
    userListRemoveByIds: gqlResolver({
      type: Number,
      args: {
        ids: {
          type: arrayOf(String),
        },
      },
      resolve: async (_, args, ctx) => {
        await assertAuth(ctx.request)

        const user = await getCurrentUser(ctx.request)
        if (args.ids.length !== 1 || args.ids[0] !== user!.id) {
          await assertAuth(ctx.request, ["admin"])
        }

        return await database
          .deleteMany(User)
          .byId(args.ids, await ctx.dbenv)
      },
      description: "requires role: admin or (ids[0] == currentUser.id)",
      extensions: {
        complexity: Complexity.MUTATION,
      },
    }),
  },
}
