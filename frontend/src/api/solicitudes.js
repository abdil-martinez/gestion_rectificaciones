import api from './axios'

export const getSolicitudes = (params) => api.get('/solicitudes/solicitudes/', { params })
export const getSolicitud = (id) => api.get(`/solicitudes/solicitudes/${id}/`)
export const createSolicitud = (data) => api.post('/solicitudes/solicitudes/', data)
export const updateSolicitud = (id, data) => api.patch(`/solicitudes/solicitudes/${id}/`, data)
export const cambiarEstado = (id, data) => api.post(`/solicitudes/solicitudes/${id}/cambiar_estado/`, data)
export const getBitacora = (id) => api.get(`/solicitudes/solicitudes/${id}/bitacora/`)
export const getTransiciones = (id) => api.get(`/solicitudes/solicitudes/${id}/transiciones/`)
export const exportarExcel = (params) =>
  api.get('/solicitudes/solicitudes/exportar/', { params, responseType: 'blob' })
export const enviarNotificacion = (id, destinatariosExtra = []) =>
  api.post(`/solicitudes/solicitudes/${id}/enviar_notificacion/`, { destinatarios_extra: destinatariosExtra })
export const reasignarSolicitudes = (data) => api.post('/solicitudes/solicitudes/reasignar/', data)

export const getAsegurados = (params) => api.get('/solicitudes/asegurados/', { params })
export const getAsegurado = (id) => api.get(`/solicitudes/asegurados/${id}/`)
export const createAsegurado = (data) => api.post('/solicitudes/asegurados/', data)
export const updateAsegurado = (id, data) => api.patch(`/solicitudes/asegurados/${id}/`, data)

export const getEmpleadores = (params) => api.get('/solicitudes/empleadores/', { params })
export const createEmpleador = (data) => api.post('/solicitudes/empleadores/', data)

export const getFormularios = (solicitudId) =>
  api.get('/solicitudes/formularios/', { params: { solicitud: solicitudId } })
export const createFormulario = (data) => api.post('/solicitudes/formularios/', data)
export const updateFormulario = (id, data) => api.patch(`/solicitudes/formularios/${id}/`, data)
export const deleteFormulario = (id) => api.delete(`/solicitudes/formularios/${id}/`)

export const getDocumentosRespaldo = (solicitudId) =>
  api.get('/solicitudes/documentos-respaldo/', { params: { solicitud: solicitudId } })
export const createDocumentoRespaldo = (formData) =>
  api.post('/solicitudes/documentos-respaldo/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateDocumentoRespaldo = (id, formData) =>
  api.patch(`/solicitudes/documentos-respaldo/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteDocumentoRespaldo = (id) => api.delete(`/solicitudes/documentos-respaldo/${id}/`)
