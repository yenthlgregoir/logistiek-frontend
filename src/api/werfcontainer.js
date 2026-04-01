import { api } from './client'

export const werfcontainerApi = {
 list: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return api.get(`/logistics/werfcontainer?${params}`)
  },
  create: (data) => api.post('/logistics/werfcontainer', data),
  update: (id , data) => api.patch(`/logistics/werfcontainer/${id}` , data),
  getTypes: () => api.get('/logistics/werfcontainer/types/all'),
  createType : (data) => api.post('/logistics/hoogtewerker/types' , data)
  
}
