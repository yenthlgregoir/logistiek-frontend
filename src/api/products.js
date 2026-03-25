import { api } from './client'

export const productApi = {
  list: (query) => api.get(`/purchase/products?${query}`),
  create: (data) => api.post('/purchase/products', data),
  update: (id, data) => api.patch(`/purchase/productss/${id}`, data),
  remove: (id) => api.del(`/${id}/purchase/product`),
}
