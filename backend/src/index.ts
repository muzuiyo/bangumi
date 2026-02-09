import { Hono } from 'hono'
import { cors } from 'hono/cors'
import items from './routes/items'
import docs from './routes/docs'
import type { Env } from './types/env'
import auth from './routes/auth'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/items', items)
app.route('/docs', docs)
app.route('/auth', auth)

export default app
