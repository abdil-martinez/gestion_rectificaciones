from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from middleware import get_current_user
from .models import (
    TipoSolicitud, Administradora, TipoCausal, Unidad, TipoRegional,
    FormularioContribucion, TipoIdentificacion, AreaSolicitante,
    EstadoPlazo, TipoPlanilla, EstadoDocumentacion, Documento,
    Regional, Agencia,
)
from .serializers import (
    TipoSolicitudSerializer, AdministradoraSerializer, TipoCausalSerializer,
    UnidadSerializer, TipoRegionalSerializer, FormularioContribucionSerializer,
    TipoIdentificacionSerializer, AreaSolicitanteSerializer, EstadoPlazoSerializer,
    TipoPlanillaSerializer, EstadoDocumentacionSerializer, DocumentoSerializer,
    RegionalSerializer, AgenciaSerializer,
)


class AdminWritePermission(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.rol in ('ADMIN',)


class BaseCatalogoViewSet(viewsets.ModelViewSet):
    permission_classes = [AdminWritePermission]
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    def perform_create(self, serializer):
        user = get_current_user()
        serializer.save(usuario_creador=user)

    def perform_update(self, serializer):
        user = get_current_user()
        serializer.save(usuario_modificador=user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        instance.soft_delete(user=user)
        return Response({'detail': 'Registro eliminado correctamente.'}, status=status.HTTP_200_OK)


class TipoSolicitudViewSet(BaseCatalogoViewSet):
    queryset         = TipoSolicitud.objects.all()
    serializer_class = TipoSolicitudSerializer
    search_fields    = ['codigo', 'descripcion']
    ordering_fields  = ['codigo', 'descripcion', 'created_at']


class AdministradoraViewSet(BaseCatalogoViewSet):
    queryset         = Administradora.objects.all()
    serializer_class = AdministradoraSerializer
    search_fields    = ['nombre', 'codigo', 'nit']
    ordering_fields  = ['nombre', 'codigo', 'created_at']


class TipoCausalViewSet(BaseCatalogoViewSet):
    queryset         = TipoCausal.objects.all()
    serializer_class = TipoCausalSerializer
    filterset_fields = ['tipo']
    search_fields    = ['nombre']
    ordering_fields  = ['nombre', 'tipo', 'created_at']


class UnidadViewSet(BaseCatalogoViewSet):
    queryset         = Unidad.objects.all()
    serializer_class = UnidadSerializer
    search_fields    = ['nombre']
    ordering_fields  = ['nombre', 'created_at']


class TipoRegionalViewSet(BaseCatalogoViewSet):
    queryset         = TipoRegional.objects.all()
    serializer_class = TipoRegionalSerializer
    search_fields    = ['nombre']
    ordering_fields  = ['nombre', 'created_at']


class FormularioContribucionViewSet(BaseCatalogoViewSet):
    queryset         = FormularioContribucion.objects.all()
    serializer_class = FormularioContribucionSerializer
    search_fields    = ['nombre']
    ordering_fields  = ['nombre', 'created_at']


class TipoIdentificacionViewSet(BaseCatalogoViewSet):
    queryset         = TipoIdentificacion.objects.all()
    serializer_class = TipoIdentificacionSerializer
    search_fields    = ['nombre', 'codigo']
    ordering_fields  = ['nombre', 'codigo', 'created_at']


class AreaSolicitanteViewSet(BaseCatalogoViewSet):
    queryset         = AreaSolicitante.objects.all()
    serializer_class = AreaSolicitanteSerializer
    search_fields    = ['nombre', 'codigo']
    ordering_fields  = ['nombre', 'codigo', 'created_at']


class EstadoPlazoViewSet(BaseCatalogoViewSet):
    queryset         = EstadoPlazo.objects.all()
    serializer_class = EstadoPlazoSerializer
    search_fields    = ['nombre']
    ordering_fields  = ['nombre', 'limite_dias', 'created_at']


class TipoPlanillaViewSet(BaseCatalogoViewSet):
    queryset         = TipoPlanilla.objects.all()
    serializer_class = TipoPlanillaSerializer
    search_fields    = ['nombre', 'codigo']
    ordering_fields  = ['nombre', 'codigo', 'created_at']


class EstadoDocumentacionViewSet(BaseCatalogoViewSet):
    queryset         = EstadoDocumentacion.objects.all()
    serializer_class = EstadoDocumentacionSerializer
    search_fields    = ['nombre']
    ordering_fields  = ['nombre', 'created_at']


class DocumentoViewSet(BaseCatalogoViewSet):
    queryset         = Documento.objects.all()
    serializer_class = DocumentoSerializer
    search_fields    = ['codigo', 'descripcion']
    ordering_fields  = ['codigo', 'descripcion', 'created_at']


class RegionalViewSet(BaseCatalogoViewSet):
    queryset         = Regional.objects.select_related('tipo_regional', 'usuario').all()
    serializer_class = RegionalSerializer
    filterset_fields = ['tipo_regional']
    search_fields    = ['nombre']
    ordering_fields  = ['nombre', 'created_at']


class AgenciaViewSet(BaseCatalogoViewSet):
    queryset         = Agencia.objects.select_related('regional').all()
    serializer_class = AgenciaSerializer
    filterset_fields = ['regional']
    search_fields    = ['nombre']
    ordering_fields  = ['nombre', 'regional__nombre', 'created_at']
