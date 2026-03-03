import { api } from './client'

export const productApi = {
  list: (query) => api.get(`/products?${query}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.patch(`/productss/${id}`, data),
  remove: (id) => api.del(`/${id}/product`),
}
