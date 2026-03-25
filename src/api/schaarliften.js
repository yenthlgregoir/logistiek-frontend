import { api } from './client'

export const schaarliftenApi = {
 list: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return api.get(`/logistics/schaarlift?${params}`)
  },
  create: (data) => api.post('/logistics/schaarlift', data),
  update: (id , data) => api.patch(`/logistics/schaarlift/${id}` , data),
  getTypes: () => api.get('/logistics/schaarlift/types'),
  createType : (data) => api.post('/logistics/schaarlift/types' , data)
  
}
