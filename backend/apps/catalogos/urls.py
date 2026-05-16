from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoSolicitudViewSet, AdministradoraViewSet, TipoCausalViewSet,
    UnidadViewSet, TipoRegionalViewSet, FormularioContribucionViewSet,
    TipoIdentificacionViewSet, AreaSolicitanteViewSet, EstadoPlazoViewSet,
    TipoPlanillaViewSet, EstadoDocumentacionViewSet, DocumentoViewSet,
    RegionalViewSet, AgenciaViewSet,
)

router = DefaultRouter()
router.register('tipo-solicitud',          TipoSolicitudViewSet,          basename='tipo-solicitud')
router.register('administradoras',         AdministradoraViewSet,         basename='administradoras')
router.register('tipo-causal',             TipoCausalViewSet,             basename='tipo-causal')
router.register('unidades',                UnidadViewSet,                 basename='unidades')
router.register('tipo-regional',           TipoRegionalViewSet,           basename='tipo-regional')
router.register('formulario-contribucion', FormularioContribucionViewSet, basename='formulario-contribucion')
router.register('tipo-identificacion',     TipoIdentificacionViewSet,     basename='tipo-identificacion')
router.register('area-solicitante',        AreaSolicitanteViewSet,        basename='area-solicitante')
router.register('estado-plazo',            EstadoPlazoViewSet,            basename='estado-plazo')
router.register('tipo-planilla',           TipoPlanillaViewSet,           basename='tipo-planilla')
router.register('estado-documentacion',    EstadoDocumentacionViewSet,    basename='estado-documentacion')
router.register('documentos',              DocumentoViewSet,              basename='documentos')
router.register('regionales',              RegionalViewSet,               basename='regionales')
router.register('agencias',               AgenciaViewSet,                basename='agencias')

urlpatterns = [
    path('', include(router.urls)),
]
