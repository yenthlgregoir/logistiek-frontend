const API_BASE = import.meta.env.VITE_API_BASE_URL
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch (err) {
    return true
  }
}
async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const token = localStorage.getItem('token')

  // 🔥 Check of token verlopen is
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return
  }

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  })

  // 🔥 Backend zegt token ongeldig/verlopen
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'API error')
  }

  if (options.responseType === 'blob') return res.blob()
  if (options.responseType === 'arraybuffer') return res.arrayBuffer()

  return res.status === 204 ? null : res.json()
}
// Helper functies
export const api = {
  get: (path, options) => request(path, options),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  postFormData: (path, formData) => request(path, { method: 'POST', body: formData }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
}
