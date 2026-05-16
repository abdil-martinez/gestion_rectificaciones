from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SolicitudViewSet, BitacoraViewSet, FormularioViewSet,
    AseguradoViewSet, EmpleadorViewSet, SolicitanteViewSet,
)

router = DefaultRouter()
router.register('solicitudes',  SolicitudViewSet,  basename='solicitudes')
router.register('bitacora',     BitacoraViewSet,   basename='bitacora')
router.register('formularios',  FormularioViewSet, basename='formularios')
router.register('asegurados',   AseguradoViewSet,  basename='asegurados')
router.register('empleadores',  EmpleadorViewSet,  basename='empleadores')
router.register('solicitantes', SolicitanteViewSet, basename='solicitantes')

urlpatterns = [
    path('', include(router.urls)),
]
