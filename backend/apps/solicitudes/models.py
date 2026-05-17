from django.db import models
from django.conf import settings
from apps.catalogos.models import (
    AuditoriaModel, TipoSolicitud, TipoCausal, TipoPlanilla,
    TipoIdentificacion, Unidad, Regional, Administradora,
    AreaSolicitante, EstadoDocumentacion, Documento, FormularioContribucion,
)

ESTADO_CHOICES = [
    ('BOR',  'Borrador'),
    ('PEND', 'Pendiente'),
    ('ASIG', 'Asignado'),
    ('REV',  'En Revisión'),
    ('APRO', 'Aprobado'),
    ('RECH', 'Rechazado'),
    ('DEV',  'Devuelto'),
    ('FIN',  'Finalizado'),
    ('ANU',  'Anulado'),
]

TIPO_PERSONA_CHOICES = [
    ('NAT', 'Natural'),
    ('JUR', 'Jurídica'),
]

TIPO_EMPLEADOR_CHOICES = [
    ('PUBLICO',  'Público'),
    ('PRIVADO',  'Privado'),
    ('MIXTO',    'Mixto'),
]

PRIORIDAD_CHOICES = [
    ('BAJA',   'Baja'),
    ('NORMAL', 'Normal'),
    ('ALTA',   'Alta'),
    ('URGENTE','Urgente'),
]


class Solicitante(AuditoriaModel):
    unidad      = models.ForeignKey(
        Unidad, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitantes'
    )
    nombre      = models.CharField(max_length=200)
    ap_paterno  = models.CharField(max_length=100, blank=True, null=True)
    ap_materno  = models.CharField(max_length=100, blank=True, null=True)
    usuario     = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solicitante_perfil',
        unique=True,
        null=True, blank=True,
    )
    cargo       = models.CharField(max_length=200, blank=True, null=True)
    telefono    = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        verbose_name        = 'Solicitante'
        verbose_name_plural = 'Solicitantes'

    def __str__(self):
        return f"{self.nombre} {self.ap_paterno or ''} {self.ap_materno or ''}".strip()

    @property
    def nombre_completo(self):
        partes = [self.nombre, self.ap_paterno, self.ap_materno]
        return ' '.join(p for p in partes if p)


class Asegurado(AuditoriaModel):
    tipo_identificacion = models.ForeignKey(
        TipoIdentificacion, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='asegurados'
    )
    nombre                  = models.CharField(max_length=200)
    ap_paterno              = models.CharField(max_length=100, blank=True, null=True)
    ap_materno              = models.CharField(max_length=100, blank=True, null=True)
    cedula                  = models.CharField(max_length=30, unique=True)
    cua                     = models.CharField(max_length=30, blank=True, null=True)
    tipo_persona            = models.CharField(max_length=10, choices=TIPO_PERSONA_CHOICES, default='NAT')
    numero_identificacion   = models.CharField(max_length=30, blank=True, null=True)
    razon_social            = models.CharField(max_length=300, blank=True, null=True)
    celular                 = models.CharField(max_length=20, blank=True, null=True)
    email                   = models.EmailField(blank=True, null=True)

    class Meta:
        verbose_name        = 'Asegurado'
        verbose_name_plural = 'Asegurados'

    def __str__(self):
        return f"{self.nombre} {self.ap_paterno or ''} ({self.cedula})".strip()

    @property
    def nombre_completo(self):
        partes = [self.nombre, self.ap_paterno, self.ap_materno]
        return ' '.join(p for p in partes if p)


class Empleador(AuditoriaModel):
    tipo_identificacion             = models.ForeignKey(
        TipoIdentificacion, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='empleadores'
    )
    tipo_empleador                  = models.CharField(max_length=20, choices=TIPO_EMPLEADOR_CHOICES, default='PRIVADO')
    numero_documento_identidad      = models.CharField(max_length=30, blank=True, null=True)
    nombre_razon_social             = models.CharField(max_length=300)
    tipo_documento_identidad        = models.CharField(max_length=100, blank=True, null=True)
    nombre_representante_legal      = models.CharField(max_length=200, blank=True, null=True)
    cua_representante_legal         = models.CharField(max_length=30, blank=True, null=True)
    numero_documento_representante  = models.CharField(max_length=30, blank=True, null=True)
    nit                             = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        verbose_name        = 'Empleador'
        verbose_name_plural = 'Empleadores'

    def __str__(self):
        return self.nombre_razon_social


class Solicitud(AuditoriaModel):
    numero_solicitud    = models.CharField(max_length=30, unique=True, blank=True)
    asegurado           = models.ForeignKey(
        Asegurado, on_delete=models.CASCADE, related_name='solicitudes'
    )
    empleador           = models.ForeignKey(
        Empleador, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes'
    )
    solicitante         = models.ForeignKey(
        Solicitante, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes'
    )
    tipo_solicitud      = models.ForeignKey(
        TipoSolicitud, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes'
    )
    tipo_causal         = models.ForeignKey(
        TipoCausal, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes'
    )
    administradora      = models.ForeignKey(
        Administradora, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes'
    )
    regional            = models.ForeignKey(
        Regional, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes'
    )
    analista_asignado   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='solicitudes_asignadas',
    )
    area_solicitante    = models.ForeignKey(
        Unidad, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes_unidad'
    )
    formulario_contribucion = models.ForeignKey(
        FormularioContribucion, on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes'
    )
    estado              = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='BOR')
    prioridad           = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='NORMAL')
    detalle_causal      = models.TextField(blank=True, null=True)
    observaciones       = models.TextField(blank=True, null=True)
    fecha_recepcion     = models.DateField(null=True, blank=True)
    fecha_limite        = models.DateField(null=True, blank=True)
    fecha_resolucion    = models.DateField(null=True, blank=True)
    monto_total         = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    adjunto_resolución  = models.FileField(upload_to='resoluciones/', blank=True, null=True)

    class Meta:
        verbose_name        = 'Solicitud'
        verbose_name_plural = 'Solicitudes'
        ordering            = ['-created_at']

    def __str__(self):
        return f"SOL-{self.numero_solicitud} | {self.asegurado}"

    def save(self, *args, **kwargs):
        if not self.numero_solicitud:
            from django.utils import timezone
            year  = timezone.now().year
            count = Solicitud.all_objects.filter(
                created_at__year=year
            ).count() + 1
            self.numero_solicitud = f"RE{year}-{count:06d}"
        super().save(*args, **kwargs)

    @property
    def dias_transcurridos(self):
        from django.utils import timezone
        if self.fecha_recepcion:
            return (timezone.now().date() - self.fecha_recepcion).days
        return 0

    @property
    def vencida(self):
        from django.utils import timezone
        if self.fecha_limite and self.estado not in ('FIN', 'ANU', 'APRO'):
            return timezone.now().date() > self.fecha_limite
        return False


class Formulario(AuditoriaModel):
    tipo_planilla = models.ForeignKey(
        TipoPlanilla, on_delete=models.SET_NULL, null=True, blank=True, related_name='formularios'
    )
    solicitud   = models.ForeignKey(
        Solicitud, on_delete=models.CASCADE, related_name='formularios'
    )
    periodo      = models.CharField(max_length=10)
    fecha_pago   = models.DateField(null=True, blank=True)
    numero       = models.CharField(max_length=30, blank=True, null=True)
    codigo       = models.CharField(max_length=30, blank=True, null=True)
    total_ganado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    monto_pago   = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        verbose_name        = 'Formulario'
        verbose_name_plural = 'Formularios'

    def __str__(self):
        return f"Form {self.numero} - {self.periodo} ({self.solicitud.numero_solicitud})"


class DocumentoRespaldo(AuditoriaModel):
    solicitud           = models.ForeignKey(
        Solicitud, on_delete=models.CASCADE, related_name='documentos_respaldo'
    )
    estado_documentacion = models.ForeignKey(
        EstadoDocumentacion, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='documentos_respaldo'
    )
    documento   = models.ForeignKey(
        Documento, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='documentos_respaldo'
    )
    archivo      = models.FileField(upload_to='documentos_respaldo/%Y/%m/', blank=True, null=True)
    observacion  = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name        = 'Documento de Respaldo'
        verbose_name_plural = 'Documentos de Respaldo'

    def __str__(self):
        return f"{self.documento} - {self.solicitud.numero_solicitud}"


class BitacoraSolicitud(models.Model):
    solicitud       = models.ForeignKey(
        Solicitud, on_delete=models.CASCADE, related_name='bitacora'
    )
    usuario         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='bitacora_acciones',
    )
    estado_anterior = models.CharField(max_length=10, choices=ESTADO_CHOICES, blank=True, null=True)
    estado_nuevo    = models.CharField(max_length=10, choices=ESTADO_CHOICES, blank=True, null=True)
    accion          = models.CharField(max_length=100)
    comentario      = models.TextField(blank=True, null=True)
    ip_address      = models.GenericIPAddressField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Entrada de Bitácora'
        verbose_name_plural = 'Bitácora de Solicitudes'
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.solicitud.numero_solicitud} | {self.accion} ({self.created_at})"
