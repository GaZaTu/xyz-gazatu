import { buildGraphQLSchema } from "gazatu-api-lib"
import { AuditLogEntryResolver } from "./AuditLogEntry.ts"
import { ServerLoadResolver } from "./ServerLoad.ts"
import { SQLResolver } from "./SQL.ts"
import { UserResolver } from "./UserResolver.ts"

export const miscSchema = buildGraphQLSchema([
  AuditLogEntryResolver,
  ServerLoadResolver,
  SQLResolver,
  UserResolver,
])
