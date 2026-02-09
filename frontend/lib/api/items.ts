import type { Item, ItemFormData, Status, MediaType } from '@/interfaces/items'

const DEFAULT_API_BASE_URL = 'http://localhost:8787'
const STORAGE_KEY = 'admin_token'

type FetchOptions = {
	adminToken?: string
	signal?: AbortSignal
}

type GetItemsQuery = {
	status?: Status
	media_type?: MediaType
}

function resolveBaseUrl() {
	return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
}

function buildHeaders(options?: FetchOptions) {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	}

	// 优先使用传入的 token，否则从 localStorage 读取
	const token = options?.adminToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)
	if (token) {
		headers['x-admin-token'] = token
	}

	return headers
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const message = await response.text().catch(() => '')
		const errorMessage = message || `Request failed: ${response.status}`
		throw new Error(errorMessage)
	}

	return (await response.json()) as T
}

export async function getItems(query?: GetItemsQuery, options?: FetchOptions) {
	const baseUrl = resolveBaseUrl()
	const params = new URLSearchParams()

	if (query?.status) params.set('status', query.status)
	if (query?.media_type) params.set('media_type', query.media_type)

	const url = params.toString() ? `${baseUrl}/items?${params}` : `${baseUrl}/items`
	const response = await fetch(url, {
		method: 'GET',
		headers: buildHeaders(options),
		signal: options?.signal
	})

	return handleJsonResponse<Item[]>(response)
}

export async function createItem(data: ItemFormData, options?: FetchOptions) {
	const baseUrl = resolveBaseUrl()
	const response = await fetch(`${baseUrl}/items`, {
		method: 'POST',
		headers: buildHeaders(options),
		body: JSON.stringify(data),
		signal: options?.signal
	})

	return handleJsonResponse<{ ok: boolean }>(response)
}

export async function updateItem(
	identifier: { id?: number; external_id?: string },
	data: Partial<ItemFormData>,
	options?: FetchOptions
) {
	const baseUrl = resolveBaseUrl()
	const idSegment = identifier.id ? `/${identifier.id}` : ''
	const response = await fetch(`${baseUrl}/items${idSegment}`, {
		method: 'PATCH',
		headers: buildHeaders(options),
		body: JSON.stringify({ ...data, external_id: identifier.external_id }),
		signal: options?.signal
	})

	return handleJsonResponse<{ success: boolean }>(response)
}

export async function deleteItem(
	identifier: { id?: number; external_id?: string },
	options?: FetchOptions
) {
	const baseUrl = resolveBaseUrl()
	const idSegment = identifier.id ? `/${identifier.id}` : ''
	const params = new URLSearchParams()

	if (!identifier.id && identifier.external_id) {
		params.set('external_id', identifier.external_id)
	}

	const url = params.toString()
		? `${baseUrl}/items${idSegment}?${params}`
		: `${baseUrl}/items${idSegment}`

	const response = await fetch(url, {
		method: 'DELETE',
		headers: buildHeaders(options),
		signal: options?.signal
	})

	return handleJsonResponse<{ success: boolean }>(response)
}