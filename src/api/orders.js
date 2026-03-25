import { api } from './client'

export const ordersApi = {
  list: (query) => api.get(`/purchase/live-orders?${query}`),
  getById: (id) => api.get(`/purchase/live-orders/${id}`), // 👈 toevoegen
  create: (data) => api.post('/purchase/live-orders', data),
  update: (id, data) => api.patch(`/lpurchase/ive-orders/${id}`, data),
  archive: (id) => api.post(`/purchase/live-orders/${id}/archive`),
  remove: (id) => api.del(`/purchase/live-orders/${id}`),
  addProductToOrder: (id, data) => api.post(`/purchase/live-orders/${id}/product`, data),
  getArchive: (query) => api.get(`/purchase/archive-orders?${query}`),

  orderToPdf: (id) => api.get(`/purchase/live-orders/${id}/pdf`, { responseType: 'blob' }),
}
