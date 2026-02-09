/// <reference types="@cloudflare/workers-types" />
import type { Env } from '../types/env'
import type { Item } from '../types/item'
import type { GetItemsQuery } from '../types/query'

type CreateItemData = {
  external_id?: string
  title: string
  media_type: Item['media_type']
  status: Item['status']
  rating?: number
  comment?: string
  updated_at?: string
}

type UpdateItemData = {
  title?: string
  media_type?: Item['media_type']
  status?: Item['status']
  rating?: number
  comment?: string
}

export async function getAllItems(env: Env) {
  const { results } = await env.media_log
    .prepare(`SELECT * FROM items ORDER BY id DESC`)
    .all()

  return results as Item[]
}

export async function getItems(
  env: Env,
  query?: GetItemsQuery
): Promise<Item[]> {
  const db = env.media_log

  // 构建可选筛选条件
  const conditions: string[] = []
  const values: any[] = []

  if (query?.status) {
    conditions.push('status = ?')
    values.push(query.status)
  }

  if (query?.media_type) {
    conditions.push('media_type = ?')
    values.push(query.media_type)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  // 查询数据库
  const { results } = await db
    .prepare(`
      SELECT * FROM items
      ${whereClause}
      ORDER BY created_at DESC
    `)
    .bind(...values)
    .all()

  // 直接返回数据库结果
  return results as Item[]
}

/**
 * 新增条目，如果传了 external_id，则先检查是否存在，存在就更新，否则插入
 */
export async function createItem(env: Env, data: CreateItemData) {
  const db = env.media_log

  if (data.external_id) {
    // 查询是否已有同 external_id 的条目
    const { results } = await db
      .prepare(`SELECT id FROM items WHERE external_id = ?`)
      .bind(data.external_id)
      .all()

    if (results && results.length > 0) {
      // 已存在 → 更新
      const id = results[0].id
      const updateSql = data.updated_at
        ? `UPDATE items
           SET title = ?, media_type = ?, status = ?, rating = ?, comment = ?, updated_at = ?
           WHERE id = ?`
        : `UPDATE items
           SET title = ?, media_type = ?, status = ?, rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
      
      const updateBinds = data.updated_at
        ? [data.title, data.media_type, data.status, data.rating ?? null, data.comment ?? null, data.updated_at, id]
        : [data.title, data.media_type, data.status, data.rating ?? null, data.comment ?? null, id]
      
      await db.prepare(updateSql).bind(...updateBinds).run()
      return
    }
  }

  // 不存在或没 external_id → 新增
  const insertSql = data.updated_at
    ? `INSERT INTO items (external_id, title, media_type, status, rating, comment, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    : `INSERT INTO items (external_id, title, media_type, status, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`
  
  const insertBinds = data.updated_at
    ? [data.external_id ?? null, data.title, data.media_type, data.status, data.rating ?? null, data.comment ?? null, data.updated_at]
    : [data.external_id ?? null, data.title, data.media_type, data.status, data.rating ?? null, data.comment ?? null]
  
  await db.prepare(insertSql).bind(...insertBinds).run()
}

export async function updateItem(
  env: Env,
  identifier: { id?: string; external_id?: string },
  data: UpdateItemData
) {
  const db = env.media_log

  const fields: string[] = []
  const values: any[] = []

  if (data.title !== undefined) {
    fields.push('title = ?')
    values.push(data.title)
  }

  if (data.media_type !== undefined) {
    fields.push('media_type = ?')
    values.push(data.media_type)
  }

  if (data.status !== undefined) {
    fields.push('status = ?')
    values.push(data.status)
  }

  if (data.rating !== undefined) {
    fields.push('rating = ?')
    values.push(data.rating)
  }

  if (data.comment !== undefined) {
    fields.push('comment = ?')
    values.push(data.comment)
  }

  if (fields.length === 0) throw new Error('No fields to update')

  values.push(identifier.id ?? identifier.external_id)

  const sql = `
    UPDATE items
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE ${identifier.id ? 'id = ?' : 'external_id = ?'}
  `

  const { success } = await db.prepare(sql).bind(...values).run()
  if (!success) throw new Error('Item not found')
}

export async function deleteItem(
  env: Env,
  identifier: { id?: string; external_id?: string }
) {
  const db = env.media_log

  const sql = `
    DELETE FROM items
    WHERE ${identifier.id ? 'id = ?' : 'external_id = ?'}
  `

  const { success } = await db
    .prepare(sql)
    .bind(identifier.id ?? identifier.external_id)
    .run()

  if (!success) throw new Error('Item not found')
}


