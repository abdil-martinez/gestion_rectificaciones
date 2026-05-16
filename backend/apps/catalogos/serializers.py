from rest_framework import serializers
from .models import (
    TipoSolicitud, Administradora, TipoCausal, Unidad, TipoRegional,
    FormularioContribucion, TipoIdentificacion, AreaSolicitante,
    EstadoPlazo, TipoPlanilla, EstadoDocumentacion, Documento,
    Regional, Agencia,
)


class AuditoriaReadMixin(serializers.ModelSerializer):
    usuario_creador_nombre = serializers.SerializerMethodField(read_only=True)

    def get_usuario_creador_nombre(self, obj):
        if obj.usuario_creador:
            return obj.usuario_creador.get_full_name() or obj.usuario_creador.username
        return None


class TipoSolicitudSerializer(AuditoriaReadMixin):
    class Meta:
        model  = TipoSolicitud
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class AdministradoraSerializer(AuditoriaReadMixin):
    class Meta:
        model  = Administradora
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class TipoCausalSerializer(AuditoriaReadMixin):
    class Meta:
        model  = TipoCausal
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class UnidadSerializer(AuditoriaReadMixin):
    class Meta:
        model  = Unidad
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class TipoRegionalSerializer(AuditoriaReadMixin):
    class Meta:
        model  = TipoRegional
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class FormularioContribucionSerializer(AuditoriaReadMixin):
    class Meta:
        model  = FormularioContribucion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class TipoIdentificacionSerializer(AuditoriaReadMixin):
    class Meta:
        model  = TipoIdentificacion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class AreaSolicitanteSerializer(AuditoriaReadMixin):
    class Meta:
        model  = AreaSolicitante
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class EstadoPlazoSerializer(AuditoriaReadMixin):
    class Meta:
        model  = EstadoPlazo
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class TipoPlanillaSerializer(AuditoriaReadMixin):
    class Meta:
        model  = TipoPlanilla
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class EstadoDocumentacionSerializer(AuditoriaReadMixin):
    class Meta:
        model  = EstadoDocumentacion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class DocumentoSerializer(AuditoriaReadMixin):
    class Meta:
        model  = Documento
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class RegionalSerializer(AuditoriaReadMixin):
    tipo_regional_nombre = serializers.CharField(source='tipo_regional.nombre', read_only=True)

    class Meta:
        model  = Regional
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']


class AgenciaSerializer(AuditoriaReadMixin):
    regional_nombre = serializers.CharField(source='regional.nombre', read_only=True)

    class Meta:
        model  = Agencia
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador_nombre']
