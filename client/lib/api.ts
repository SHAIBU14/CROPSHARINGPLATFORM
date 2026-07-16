export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/$/, '')

export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '') || 'http://localhost:5001'

export function apiPath(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (normalizedPath.startsWith('/api/')) {
    return `${SOCKET_URL}${normalizedPath}`
  }

  return `${API_URL}${normalizedPath}`
}

export function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' }
  }

  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(init.headers || {}),
  }

  if (init.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type']
  }

  return fetch(apiPath(path), {
    ...init,
    headers,
  })
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message
    if (message === 'Network Error') {
      return 'Cannot reach the server. Make sure the backend is running on port 5001.'
    }
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; errors?: Array<{ msg: string }> } } }).response
    if (response?.data?.message) {
      return response.data.message
    }
    if (response?.data?.errors?.length) {
      return response.data.errors.map((entry) => entry.msg).join(', ')
    }
  }

  return fallback
}
