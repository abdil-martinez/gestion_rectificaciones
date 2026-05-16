import api from './axios'

const makeEndpoint = (resource) => ({
  getAll:  (params) => api.get(`/catalogos/${resource}/`, { params }),
  getOne:  (id) => api.get(`/catalogos/${resource}/${id}/`),
  create:  (data) => api.post(`/catalogos/${resource}/`, data),
  update:  (id, data) => api.patch(`/catalogos/${resource}/${id}/`, data),
  remove:  (id) => api.delete(`/catalogos/${resource}/${id}/`),
})

export const tipoSolicitud          = makeEndpoint('tipo-solicitud')
export const administradoras        = makeEndpoint('administradoras')
export const tipoCausal             = makeEndpoint('tipo-causal')
export const unidades               = makeEndpoint('unidades')
export const tipoRegional           = makeEndpoint('tipo-regional')
export const formularioContribucion = makeEndpoint('formulario-contribucion')
export const tipoIdentificacion     = makeEndpoint('tipo-identificacion')
export const areaSolicitante        = makeEndpoint('area-solicitante')
export const estadoPlazo            = makeEndpoint('estado-plazo')
export const tipoPlanilla           = makeEndpoint('tipo-planilla')
export const estadoDocumentacion    = makeEndpoint('estado-documentacion')
export const documentos             = makeEndpoint('documentos')
export const regionales             = makeEndpoint('regionales')
export const agencias               = makeEndpoint('agencias')

export default {
  tipoSolicitud, administradoras, tipoCausal, unidades, tipoRegional,
  formularioContribucion, tipoIdentificacion, areaSolicitante,
  estadoPlazo, tipoPlanilla, estadoDocumentacion, documentos,
  regionales, agencias,
}
