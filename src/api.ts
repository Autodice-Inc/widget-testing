// The API's base, /v1 included. Locally it's this dev server, which proxies /v1 to the API.
const API_BASE = import.meta.env.VITE_API_BASE || '/v1'

export type CurrentUser = {
  fullName?: string
  dealershipStatus?: string | null
  widgetConfig?: {
    widgetId?: string
    enabled?: boolean
    branding?: { dealershipName?: string }
  } | null
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// The API keeps the login in cookies (an access and a refresh token), so every call sends them.
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, body?.message || response.statusText)
  return body as T
}

/** The logged-in account, or null when nobody is. An expired access token is renewed once. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await call<CurrentUser>('/users')
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error
  }

  try {
    await call('/auth/refresh-token', { method: 'POST' })
  } catch (error) {
    if (error instanceof ApiError) return null
    throw error
  }

  return call<CurrentUser>('/users')
}

export function login(email: string, password: string) {
  return call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function logout() {
  return call('/auth/logout', { method: 'POST' })
}
