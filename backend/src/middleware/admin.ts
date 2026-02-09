import { createMiddleware } from 'hono/factory'
import type { Env } from '../types/env'
import { encrypt } from '../utils/crypto'

export const adminOnly = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const encryptedToken = c.req.header('x-admin-token')

    if (!encryptedToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // 加密环境变量中的密钥
    const encryptedAdminToken = encrypt(c.env.ADMIN_TOKEN)

    // 比较加密后的 token
    if (encryptedToken !== encryptedAdminToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    await next()
  }
)
