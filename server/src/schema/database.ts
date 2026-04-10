import { LocalSqlite3DatabaseAccess, sql } from "gazatu-api-lib"
import config from "../config.ts"
import { knownAuthTokens } from "./auth.ts"
import { AuditLogEntry } from "./misc/AuditLogEntry.ts"
import { N2M_User_UserRole, User } from "./misc/User.ts"

export const database = new LocalSqlite3DatabaseAccess()

await database.hooks.subscribe("change", ({ tables }) => {
  if (tables.includes(User.name) || tables.includes(N2M_User_UserRole.name)) {
    knownAuthTokens.clear()
  }
})
Deno.cron?.("knownAuthTokens-clear", "0 0 * * *", () => {
  knownAuthTokens.clear()
})

const deleteOldAuditLogEntries = async () => {
  try {
    await database
      .delete()
      .from(AuditLogEntry)
      .where("timestamp", "<", sql`date('now', '-1 month')`)
  } catch (error) {
    console.error("Failed to remove old audit log entries:", error)
  }
}

if (!config.development) {
  deleteOldAuditLogEntries()
  Deno.cron?.("deleteOldAuditLogEntries", "0 0 * * *", deleteOldAuditLogEntries)
}
