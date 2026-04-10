import { WebPush } from "gazatu-api-lib"
import { database } from "./database.ts"
import { User } from "./misc/User.ts"

export const webpush = new WebPush(async userId => {
  const user = await database
    .findOne(User)
    .byId(userId)
  if (!user) {
    return undefined
  }
  return {
    ...user,
    pushSubscriptions: (await User.getPushSubscriptions(user))
      .map(sub => ({
        ...sub,
        data: JSON.parse(sub.json),
        onError(error) {
          console.error("failed to push notification", error)
          // TODO: advance failures counter or delete subscription
        },
      })),
  }
})
