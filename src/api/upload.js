import { api } from './client'

export const uploadApi = {
  get: (id) => api.get(`/uploads/${id}/files`),
  upload: (id, formData) => api.postFormData(`/uploads/${id}/upload`, formData),
  remove: (id, filename) => api.del(`/uploads/${id}/files/${encodeURIComponent(filename)}`),
  openFile: (id, filename) => api.get(`/uploads/${id}/files/${encodeURIComponent(filename)}/open`),
  exportBoekingen: () => api.get(`/uploads/export-pdf`, { responseType: 'blob' }),
  exportBoeking: (id) => api.get(`/uploads/export-pdf/${id}`, { responseType: 'blob' }),
}
