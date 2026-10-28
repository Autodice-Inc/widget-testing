// The API's base, /v1 included. Locally it's this dev server, which proxies /v1 to the API.
const API_BASE = import.meta.env.VITE_API_BASE || '/v1'

export type CurrentUser = {
  fullName?: string
  dealershipStatus?: string | null
  widgetConfig?: {
    widgetId?: string
    enabled?: boolean
    branding?: { dealershipName?: string; logo?: string | null }
  } | null
}

export type Vehicle = {
  stockNumber: string
  year?: number | null
  make: string
  model: string
  trim?: string | null
  price?: number | null
  mileage?: number | null
  condition?: string | null
  photos?: string[]
}

export type DistanceUnit = 'km' | 'mi'

export type SaleType = 'new' | 'used'

export type VehiclePage = {
  items: Vehicle[]
  totalItems: number
  currentPage: number
  totalPages: number
  /** What the whole stock has, whatever the page's filters. */
  saleTypes: SaleType[]
  distanceUnit: DistanceUnit
}

export type StockQuery = { page: number; search: string; saleType: SaleType | null }

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

/** A page of the vehicles Miles knows for the dealership. */
export function getVehiclePage({ page, search, saleType }: StockQuery) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  if (saleType) params.set('saleType', saleType)
  return call<VehiclePage>(`/users/widget-config/inventory/vehicles?${params}`)
}

export function login(email: string, password: string) {
  return call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function logout() {
  return call('/auth/logout', { method: 'POST' })
}
