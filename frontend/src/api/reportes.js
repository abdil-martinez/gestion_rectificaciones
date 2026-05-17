import api from './axios'

export const getDashboard      = ()       => api.get('/reportes/dashboard/')
export const getProductividad  = (params) => api.get('/reportes/productividad/', { params })
export const getCausales       = (params) => api.get('/reportes/causales/', { params })
export const getTipoRegional   = (params) => api.get('/reportes/tipo-regional/', { params })
export const exportarExcel     = (params) =>
  api.get('/reportes/exportar/', { params, responseType: 'blob' })
