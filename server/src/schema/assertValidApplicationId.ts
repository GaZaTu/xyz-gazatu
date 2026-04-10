import { createHttpError, Request, Status } from "@oak/oak"
import config from "../config.ts"

const assertValidApplicationId = (request: Request) => {
  if (config.applicationIdList?.length) {
    const appId = request.headers.get("X-Application-Id")
    if (!appId || !config.applicationIdList.includes(appId)) {
      throw createHttpError(Status.Forbidden)
    }
  }
}
export default assertValidApplicationId
