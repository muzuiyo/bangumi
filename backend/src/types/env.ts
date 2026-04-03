import { D1Database } from '@cloudflare/workers-types'

export type Env = {
  media_log: D1Database
  ADMIN_TOKEN: string
  USERNAME: string
}
