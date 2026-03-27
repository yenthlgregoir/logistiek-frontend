import { api } from '@/api/client.js'
export const loginApi = {
  login: (email, password) => api.post('/authentication/auth/login', { email, password }),
  createUser: (email, role , naam) => api.post('/authentication/auth/create-user', { email, role , naam }),
  setPassword: (token, password) => api.post(`/authentication/auth/set-password/${token}`, { password }),
  getUsers: () => api.get('/authentication/auth/users'),
}
