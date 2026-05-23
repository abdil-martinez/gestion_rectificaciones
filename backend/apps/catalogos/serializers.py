from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import (
    TipoSolicitud, Administradora, CategoriaCausal, TipoCausal, Unidad, TipoRegional,
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
    codigo = serializers.CharField(
        max_length=20,
        validators=[UniqueValidator(queryset=TipoSolicitud.objects.all(), message='Ya existe un Tipo de Solicitud con ese código.')],
    )

    class Meta:
        model  = TipoSolicitud
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class AdministradoraSerializer(AuditoriaReadMixin):
    codigo = serializers.CharField(
        max_length=20,
        validators=[UniqueValidator(queryset=Administradora.objects.all(), message='Ya existe una Administradora con ese código.')],
    )

    class Meta:
        model  = Administradora
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class CategoriaCausalSerializer(AuditoriaReadMixin):
    class Meta:
        model  = CategoriaCausal
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class TipoCausalSerializer(AuditoriaReadMixin):
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True, default=None)

    class Meta:
        model  = TipoCausal
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class UnidadSerializer(AuditoriaReadMixin):
    class Meta:
        model  = Unidad
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class TipoRegionalSerializer(AuditoriaReadMixin):
    nombre = serializers.CharField(
        max_length=100,
        validators=[UniqueValidator(queryset=TipoRegional.objects.all(), message='Ya existe un Tipo de Regional con ese nombre.')],
    )

    class Meta:
        model  = TipoRegional
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class FormularioContribucionSerializer(AuditoriaReadMixin):
    class Meta:
        model  = FormularioContribucion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class TipoIdentificacionSerializer(AuditoriaReadMixin):
    codigo = serializers.CharField(
        max_length=20,
        validators=[UniqueValidator(queryset=TipoIdentificacion.objects.all(), message='Ya existe un Tipo de Identificación con ese código.')],
    )

    class Meta:
        model  = TipoIdentificacion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class AreaSolicitanteSerializer(AuditoriaReadMixin):
    codigo = serializers.CharField(
        max_length=20,
        validators=[UniqueValidator(queryset=AreaSolicitante.objects.all(), message='Ya existe un Área Solicitante con ese código.')],
    )

    class Meta:
        model  = AreaSolicitante
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class EstadoPlazoSerializer(AuditoriaReadMixin):
    class Meta:
        model  = EstadoPlazo
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class TipoPlanillaSerializer(AuditoriaReadMixin):
    codigo = serializers.CharField(
        max_length=20,
        validators=[UniqueValidator(queryset=TipoPlanilla.objects.all(), message='Ya existe un Tipo de Planilla con ese código.')],
    )

    class Meta:
        model  = TipoPlanilla
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class EstadoDocumentacionSerializer(AuditoriaReadMixin):
    class Meta:
        model  = EstadoDocumentacion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class DocumentoSerializer(AuditoriaReadMixin):
    codigo = serializers.CharField(
        max_length=20,
        validators=[UniqueValidator(queryset=Documento.objects.all(), message='Ya existe un Documento con ese código.')],
    )

    class Meta:
        model  = Documento
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class RegionalSerializer(AuditoriaReadMixin):
    tipo_regional_nombre = serializers.CharField(source='tipo_regional.nombre', read_only=True)

    class Meta:
        model  = Regional
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']


class AgenciaSerializer(AuditoriaReadMixin):
    regional_nombre = serializers.CharField(source='regional.nombre', read_only=True)

    class Meta:
        model  = Agencia
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'deleted_at', 'usuario_creador', 'usuario_modificador', 'usuario_eliminador', 'usuario_creador_nombre']
