import { api } from '@/api/client.js'
export const loginApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
}
