import { createSmtpClient } from "gazatu-api-lib"
import config from "../config.ts"

const smtp = createSmtpClient(config.smtp)
export default smtp
