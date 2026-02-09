const DEFAULT_API_BASE_URL = 'http://localhost:8787'
const STORAGE_KEY = 'admin_token'

type FetchOptions = {
    adminToken?: string
    signal?: AbortSignal
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

export async function verifyToken(options?: FetchOptions) {
    const baseUrl = resolveBaseUrl()
    const response = await fetch(`${baseUrl}/auth/verify`, {
        method: 'GET',
        headers: buildHeaders(options),
        signal: options?.signal
    })

    return handleJsonResponse<{ valid: boolean; message: string }>(response)
}
