import { Hono } from 'hono'
import { createItem, getItems, updateItem, deleteItem } from '../services/items'
import { verifyBangumiToken } from '../services/bangumi'
import { adminOnly } from '../middleware/admin'
import type { Env } from '../types/env'
import { MEDIA_STATUS, MEDIA_TYPES } from '../constants'

const items = new Hono<{ Bindings: Env }>()

items.post('/', adminOnly, async (c) => {
  const body = await c.req.json()
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const media_type = body?.media_type
  const status = body?.status

  if (!title) {
    return c.json({ error: 'Missing title' }, 400)
  }

  if (!MEDIA_TYPES.includes(media_type)) {
    return c.json({ error: 'Invalid media_type' }, 400)
  }

  if (!MEDIA_STATUS.includes(status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  if (body?.rating !== undefined) {
    const rating = body.rating
    const ratingValid = typeof rating === 'number' && Number.isFinite(rating) && rating >= 0 && rating <= 10
    if (!ratingValid) {
      return c.json({ error: 'Invalid rating' }, 400)
    }
  }

  if (body?.comment !== undefined && typeof body.comment !== 'string') {
    return c.json({ error: 'Invalid comment' }, 400)
  }

  if (body?.external_id !== undefined && typeof body.external_id !== 'string') {
    return c.json({ error: 'Invalid external_id' }, 400)
  }

  if (body?.updated_at !== undefined && typeof body.updated_at !== 'string') {
    return c.json({ error: 'Invalid updated_at' }, 400)
  }

  await createItem(c.env, body)
  return c.json({ ok: true })
})

items.get('/', async (c) => {
  // 获取 query 参数
  const status = c.req.query('status')
  const media_type = c.req.query('media_type')

  const results = await getItems(c.env, { status, media_type })
  return c.json(results)
})


items.patch('/:id?', adminOnly, async (c) => {
  const id = c.req.param('id')  // 可选
  const body = await c.req.json()
  const external_id = body.external_id  // 如果前端传 external_id

  if (!id && !external_id) {
    return c.json({ error: 'Missing id or external_id' }, 400)
  }

  const hasUpdateFields =
    body?.title !== undefined ||
    body?.media_type !== undefined ||
    body?.status !== undefined ||
    body?.rating !== undefined ||
    body?.comment !== undefined

  if (!hasUpdateFields) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  if (body?.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return c.json({ error: 'Invalid title' }, 400)
    }
  }

  if (body?.media_type !== undefined && !MEDIA_TYPES.includes(body.media_type)) {
    return c.json({ error: 'Invalid media_type' }, 400)
  }

  if (body?.status !== undefined && !MEDIA_STATUS.includes(body.status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  if (body?.rating !== undefined) {
    const rating = body.rating
    const ratingValid = typeof rating === 'number' && Number.isFinite(rating) && rating >= 0 && rating <= 10
    if (!ratingValid) {
      return c.json({ error: 'Invalid rating' }, 400)
    }
  }

  if (body?.comment !== undefined && typeof body.comment !== 'string') {
    return c.json({ error: 'Invalid comment' }, 400)
  }

  if (body?.external_id !== undefined && typeof body.external_id !== 'string') {
    return c.json({ error: 'Invalid external_id' }, 400)
  }

  try {
    await updateItem(c.env, { id, external_id }, body)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 404)
  }
})

items.delete('/:id?', adminOnly, async (c) => {
  const id = c.req.param('id') // 可选
  const external_id = c.req.query('external_id') // 或者 query 传

  if (!id && !external_id) {
    return c.json({ error: 'Missing id or external_id' }, 400)
  }

  try {
    await deleteItem(c.env, { id, external_id })
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 404)
  }
})

items.post('/bangumi', async (c) => {
  try {
    // 从请求头获取 token
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401)
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    // 验证 token
    const verifyResult = await verifyBangumiToken(token, c.env.USERNAME)
    if (!verifyResult.success) {
      return c.json({ error: verifyResult.error }, 401)
    }

    // Token 验证通过，继续处理请求
    const body = await c.req.json()
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const media_type = body?.media_type
    const status = body?.status

    // 验证必填字段
    if (!title) {
      return c.json({ error: 'Missing title' }, 400)
    }

    if (!MEDIA_TYPES.includes(media_type)) {
      return c.json({ error: 'Invalid media_type' }, 400)
    }

    if (!MEDIA_STATUS.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }

    // 验证可选字段
    if (body?.rating !== undefined) {
      const rating = body.rating
      const ratingValid = typeof rating === 'number' && Number.isFinite(rating) && rating >= 0 && rating <= 10
      if (!ratingValid) {
        return c.json({ error: 'Invalid rating' }, 400)
      }
    }

    if (body?.comment !== undefined && typeof body.comment !== 'string') {
      return c.json({ error: 'Invalid comment' }, 400)
    }

    if (body?.external_id !== undefined && typeof body.external_id !== 'string') {
      return c.json({ error: 'Invalid external_id' }, 400)
    }

    if (body?.updated_at !== undefined && typeof body.updated_at !== 'string') {
      return c.json({ error: 'Invalid updated_at' }, 400)
    }

    // 直接调用 createItem，内部会自动判断是新增还是更新
    await createItem(c.env, body)
    return c.json({ ok: true })
  } catch (error) {
    console.error('Bangumi request error:', error)
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

export default items
