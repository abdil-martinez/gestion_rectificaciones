from rest_framework import serializers
from .models import Solicitud, Solicitante, Asegurado, Empleador, Formulario, DocumentoRespaldo, BitacoraSolicitud


class AseguradoSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model  = Asegurado
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_nombre_completo(self, obj):
        return obj.nombre_completo


class AseguradoNestedSerializer(AseguradoSerializer):
    """Igual a AseguradoSerializer pero sin validador de unicidad en cedula.
    Se usa al crear solicitudes: si ya existe el asegurado se reutiliza."""
    cedula = serializers.CharField(max_length=30)

    class Meta(AseguradoSerializer.Meta):
        pass


class EmpleadorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Empleador
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class SolicitanteSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model  = Solicitante
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_nombre_completo(self, obj):
        return obj.nombre_completo


class FormularioSerializer(serializers.ModelSerializer):
    tipo_planilla_nombre = serializers.CharField(source='tipo_planilla.nombre', read_only=True)

    class Meta:
        model  = Formulario
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DocumentoRespaldoSerializer(serializers.ModelSerializer):
    documento_nombre    = serializers.CharField(source='documento.descripcion', read_only=True)
    estado_doc_nombre   = serializers.CharField(source='estado_documentacion.nombre', read_only=True)

    class Meta:
        model  = DocumentoRespaldo
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class BitacoraSerializer(serializers.ModelSerializer):
    usuario_nombre      = serializers.SerializerMethodField()
    estado_anterior_label = serializers.SerializerMethodField()
    estado_nuevo_label    = serializers.SerializerMethodField()

    class Meta:
        model  = BitacoraSolicitud
        fields = '__all__'

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or obj.usuario.username
        return 'Sistema'

    def get_estado_anterior_label(self, obj):
        from .models import ESTADO_CHOICES
        return dict(ESTADO_CHOICES).get(obj.estado_anterior, obj.estado_anterior)

    def get_estado_nuevo_label(self, obj):
        from .models import ESTADO_CHOICES
        return dict(ESTADO_CHOICES).get(obj.estado_nuevo, obj.estado_nuevo)


class SolicitudListSerializer(serializers.ModelSerializer):
    asegurado_nombre        = serializers.CharField(source='asegurado.nombre_completo', read_only=True)
    asegurado_cedula        = serializers.CharField(source='asegurado.cedula', read_only=True)
    asegurado_cua           = serializers.CharField(source='asegurado.cua', read_only=True)
    tipo_causal_nombre      = serializers.CharField(source='tipo_causal.nombre', read_only=True)
    tipo_solicitud_nombre   = serializers.CharField(source='tipo_solicitud.descripcion', read_only=True)
    regional_nombre         = serializers.CharField(source='regional.nombre', read_only=True)
    tipo_regional_nombre    = serializers.CharField(source='regional.tipo_regional.nombre', read_only=True)
    analista_nombre         = serializers.SerializerMethodField()
    estado_label            = serializers.SerializerMethodField()
    vencida                 = serializers.SerializerMethodField()

    class Meta:
        model  = Solicitud
        fields = [
            'id', 'numero_solicitud', 'estado', 'estado_label', 'prioridad',
            'asegurado_nombre', 'asegurado_cedula', 'asegurado_cua',
            'tipo_causal_nombre', 'tipo_solicitud_nombre',
            'regional_nombre', 'tipo_regional_nombre',
            'analista_nombre', 'fecha_recepcion', 'fecha_limite', 'monto_total',
            'vencida', 'created_at', 'updated_at',
        ]

    def get_analista_nombre(self, obj):
        if obj.analista_asignado:
            return obj.analista_asignado.get_full_name() or obj.analista_asignado.username
        return None

    def get_estado_label(self, obj):
        from .models import ESTADO_CHOICES
        return dict(ESTADO_CHOICES).get(obj.estado, obj.estado)

    def get_vencida(self, obj):
        return obj.vencida


class SolicitudDetailSerializer(serializers.ModelSerializer):
    asegurado           = AseguradoSerializer(read_only=True)
    empleador           = EmpleadorSerializer(read_only=True)
    solicitante         = SolicitanteSerializer(read_only=True)
    formularios         = FormularioSerializer(many=True, read_only=True)
    documentos_respaldo = DocumentoRespaldoSerializer(many=True, read_only=True)
    estado_label        = serializers.SerializerMethodField()
    tipo_causal_nombre  = serializers.CharField(source='tipo_causal.nombre', read_only=True)
    tipo_solicitud_nombre = serializers.CharField(source='tipo_solicitud.descripcion', read_only=True)
    regional_nombre     = serializers.CharField(source='regional.nombre', read_only=True)
    analista_nombre     = serializers.SerializerMethodField()
    vencida             = serializers.SerializerMethodField()

    class Meta:
        model  = Solicitud
        fields = '__all__'

    def get_estado_label(self, obj):
        from .models import ESTADO_CHOICES
        return dict(ESTADO_CHOICES).get(obj.estado, obj.estado)

    def get_analista_nombre(self, obj):
        if obj.analista_asignado:
            return obj.analista_asignado.get_full_name() or obj.analista_asignado.username
        return None

    def get_vencida(self, obj):
        return obj.vencida


class SolicitudCreateSerializer(serializers.ModelSerializer):
    asegurado_data  = AseguradoNestedSerializer(write_only=True, required=False)
    empleador_data  = EmpleadorSerializer(write_only=True, required=False)

    class Meta:
        model  = Solicitud
        fields = [
            'tipo_solicitud', 'tipo_causal', 'administradora', 'regional',
            'area_solicitante', 'formulario_contribucion', 'prioridad',
            'detalle_causal', 'observaciones', 'fecha_recepcion', 'fecha_limite',
            'asegurado', 'empleador', 'solicitante',
            'asegurado_data', 'empleador_data',
        ]
        extra_kwargs = {
            'asegurado': {'required': False},
            'empleador': {'required': False},
        }

    def create(self, validated_data):
        asegurado_data = validated_data.pop('asegurado_data', None)
        empleador_data = validated_data.pop('empleador_data', None)

        if asegurado_data and not validated_data.get('asegurado'):
            asegurado, _ = Asegurado.objects.get_or_create(
                cedula=asegurado_data['cedula'],
                defaults=asegurado_data
            )
            validated_data['asegurado'] = asegurado

        if empleador_data and not validated_data.get('empleador'):
            empleador = Empleador.objects.create(**empleador_data)
            validated_data['empleador'] = empleador

        return super().create(validated_data)
