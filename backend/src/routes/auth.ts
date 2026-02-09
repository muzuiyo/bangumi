import { Hono } from 'hono'
import { encrypt } from '../utils/crypto'
import type { Env } from '../types/env'
const auth = new Hono<{ Bindings: Env }>()

auth.get('/verify', async (c) => {
    const encryptedToken = c.req.header('x-admin-token')

    if (!encryptedToken) {
        return c.json({ 
            valid: false,
            error: 'No token provided' 
    }, 401)}

    const encryptedAdminToken = encrypt(c.env.ADMIN_TOKEN)
    const isValid = encryptedToken === encryptedAdminToken

    if(isValid) {
        return c.json({
            valid: true,
            message: 'Token is valid'
        })
    } else {
        return c.json({
            valid: false,
            error: 'Invalid token'
        }, 401)
    }
})

export default auth
