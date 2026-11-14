import { useLoadingStore } from '@/stores/LoadingStore'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api')
  .replace(/\/$/, '')

function handleUnauthorized() {
  localStorage.removeItem('token')

  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function responseError(response) {
  const text = await response.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { message: text || `API-fout (${response.status})` }
  }

  const error = new Error(data?.message || `API-fout (${response.status})`)

  // Behoud ondersteuning voor bestaande err.response-controles.
  error.response = {
    status: response.status,
    data,
  }

  if (response.status === 401) {
    handleUnauthorized()
  }

  return error
}

async function getCsrfToken() {
  const response = await fetch('/api/csrf', {
    credentials: 'same-origin',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw await responseError(response)
  }

  return response.json()
}

export async function request(path, options = {}) {
  const loading = useLoadingStore()

  const {
    key = null,
    responseType,
    headers: customHeaders,
    ...fetchOptions
  } = options

  const method = (fetchOptions.method || 'GET').toUpperCase()
  const isFormData = fetchOptions.body instanceof FormData
  const headers = new Headers(customHeaders)

  headers.delete('Authorization')

  if (
    fetchOptions.body != null &&
    !isFormData &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  loading.start(key)

  try {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrf = await getCsrfToken()
      headers.set(csrf.headerName, csrf.token)
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      method,
      credentials: 'same-origin',
      headers,
    })

    if (!response.ok) {
      throw await responseError(response)
    }

    if (response.status === 204 || method === 'HEAD') {
      return null
    }

    if (responseType === 'blob') return response.blob()
    if (responseType === 'arraybuffer') return response.arrayBuffer()

    const text = await response.text()
    if (!text) return null

    const contentType = response.headers.get('content-type') || ''

    return contentType.includes('json') ? JSON.parse(text) : text
  } finally {
    loading.stop(key)
  }
}

export const api = {
  get: (path, options = {}) =>
    request(path, { ...options, method: 'GET' }),

  post: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  postFormData: (path, formData, options = {}) =>
    request(path, {
      ...options,
      method: 'POST',
      body: formData,
    }),

  put: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  del: (path, options = {}) =>
    request(path, { ...options, method: 'DELETE' }),
}