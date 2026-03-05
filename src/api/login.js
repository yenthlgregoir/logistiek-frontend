import { api } from '@/api/client.js'
export const loginApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  createUser: (email  , role) => api.post('/auth/create-user' , {email, role}),
  setPassword: (token , password) => api.post(`/auth/set-password/${token}`, {password})
}
