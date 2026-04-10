import { Request } from "@oak/oak"
import { AuthorizationHelper } from "gazatu-api-lib"
import { database } from "./database.ts"
import { User } from "./misc/User.ts"

const authHelper = new AuthorizationHelper(async userId => {
  const user = await database
    .findOne(User)
    .byId(userId)
  if (!user) {
    return undefined
  }
  return {
    ...user,
    roles: await User.getRoles(user),
  }
})

export const knownAuthTokens = authHelper.knownUsers

export const getCurrentUser = authHelper.findUserByRequest.bind(authHelper)
export const hasAuth = authHelper.hasAuth.bind(authHelper)
export const assertAuth = authHelper.assertAuth.bind(authHelper)

export const createDatabaseEnv = async (request: Request | undefined) => {
  const env = {} as Record<string, string>

  const user = await getCurrentUser(request)
  if (user) {
    env["USER"] = user.id
  }

  return env
}
