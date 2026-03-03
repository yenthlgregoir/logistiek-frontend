import { api } from './client'

export const ordersApi = {
  list: (query) => api.get(`/live-orders?${query}`),
  getById: (id) => api.get(`/live-orders/${id}`), // 👈 toevoegen
  create: (data) => api.post('/live-orders', data),
  update: (id, data) => api.patch(`/live-orders/${id}`, data),
  archive: (id) => api.post(`/live-orders/${id}/archive`),
  remove: (id) => api.del(`/live-orders/${id}`),
  addProductToOrder: (id, data) => api.post(`/live-orders/${id}/product`, data),
  getArchive: (query) => api.get(`/archive-orders?${query}`),

  orderToPdf: (id) => api.get(`/live-orders/${id}/pdf`, { responseType: 'blob' }),
}
