from django.db import models
from django.db.models import Q
from django.conf import settings


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

    def all_with_deleted(self):
        return super().get_queryset()


class AuditoriaModel(models.Model):
    usuario_creador     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(class)s_creados',
    )
    usuario_modificador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(class)s_modificados',
    )
    usuario_eliminador  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(class)s_eliminados',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False, user=None):
        """Soft delete: marca como eliminado en lugar de borrar la fila."""
        from django.utils import timezone
        self.deleted_at = timezone.now()
        if user:
            self.usuario_eliminador = user
        self.save(update_fields=['deleted_at', 'usuario_eliminador_id'])

    def hard_delete(self, using=None, keep_parents=False):
        """Elimina físicamente el registro de la base de datos."""
        super().delete(using=using, keep_parents=keep_parents)

    # Alias explícito para compatibilidad con código existente
    def soft_delete(self, user=None):
        self.delete(user=user)

    def restore(self):
        self.deleted_at = None
        self.usuario_eliminador = None
        self.save(update_fields=['deleted_at', 'usuario_eliminador_id'])

    @property
    def activo(self):
        return self.deleted_at is None


class TipoSolicitud(AuditoriaModel):
    codigo      = models.CharField(max_length=20)
    descripcion = models.CharField(max_length=200)

    class Meta:
        verbose_name        = 'Tipo de Solicitud'
        verbose_name_plural = 'Tipos de Solicitud'
        ordering            = ['codigo']
        constraints         = [
            models.UniqueConstraint(fields=['codigo'], condition=Q(deleted_at__isnull=True), name='unique_tiposolicitud_codigo_active'),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"


class Administradora(AuditoriaModel):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20)
    nit    = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        verbose_name        = 'Administradora'
        verbose_name_plural = 'Administradoras'
        ordering            = ['nombre']
        constraints         = [
            models.UniqueConstraint(fields=['codigo'], condition=Q(deleted_at__isnull=True), name='unique_administradora_codigo_active'),
        ]

    def __str__(self):
        return self.nombre


class CategoriaCausal(AuditoriaModel):
    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name        = 'Categoría de Causal'
        verbose_name_plural = 'Categorías de Causal'
        ordering            = ['nombre']

    def __str__(self):
        return self.nombre


class TipoCausal(AuditoriaModel):
    nombre = models.CharField(max_length=200)
    tipo   = models.ForeignKey(
        CategoriaCausal,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='causales',
    )

    class Meta:
        verbose_name        = 'Tipo de Causal'
        verbose_name_plural = 'Tipos de Causal'
        ordering            = ['nombre']

    def __str__(self):
        return self.nombre


class Unidad(AuditoriaModel):
    nombre      = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name        = 'Unidad'
        verbose_name_plural = 'Unidades'
        ordering            = ['nombre']

    def __str__(self):
        return self.nombre


class TipoRegional(AuditoriaModel):
    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name        = 'Tipo de Regional'
        verbose_name_plural = 'Tipos de Regional'
        ordering            = ['nombre']
        constraints         = [
            models.UniqueConstraint(fields=['nombre'], condition=Q(deleted_at__isnull=True), name='unique_tiporegional_nombre_active'),
        ]

    def __str__(self):
        return self.nombre


class FormularioContribucion(AuditoriaModel):
    nombre = models.CharField(max_length=200)

    class Meta:
        verbose_name        = 'Formulario de Contribución'
        verbose_name_plural = 'Formularios de Contribución'
        ordering            = ['nombre']

    def __str__(self):
        return self.nombre


class TipoIdentificacion(AuditoriaModel):
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20)

    class Meta:
        verbose_name        = 'Tipo de Identificación'
        verbose_name_plural = 'Tipos de Identificación'
        ordering            = ['nombre']
        constraints         = [
            models.UniqueConstraint(fields=['codigo'], condition=Q(deleted_at__isnull=True), name='unique_tipoidentificacion_codigo_active'),
        ]

    def __str__(self):
        return self.nombre


class AreaSolicitante(AuditoriaModel):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20)

    class Meta:
        verbose_name        = 'Área Solicitante'
        verbose_name_plural = 'Áreas Solicitantes'
        ordering            = ['nombre']
        constraints         = [
            models.UniqueConstraint(fields=['codigo'], condition=Q(deleted_at__isnull=True), name='unique_areasolicitante_codigo_active'),
        ]

    def __str__(self):
        return self.nombre


class EstadoPlazo(AuditoriaModel):
    nombre       = models.CharField(max_length=100)
    descripcion  = models.TextField(blank=True, null=True)
    limite_dias  = models.PositiveIntegerField(default=30)

    class Meta:
        verbose_name        = 'Estado de Plazo'
        verbose_name_plural = 'Estados de Plazo'
        ordering            = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.limite_dias} días)"


class TipoPlanilla(AuditoriaModel):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20)

    class Meta:
        verbose_name        = 'Tipo de Planilla'
        verbose_name_plural = 'Tipos de Planilla'
        ordering            = ['nombre']
        constraints         = [
            models.UniqueConstraint(fields=['codigo'], condition=Q(deleted_at__isnull=True), name='unique_tipoplanilla_codigo_active'),
        ]

    def __str__(self):
        return self.nombre


class EstadoDocumentacion(AuditoriaModel):
    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name        = 'Estado de Documentación'
        verbose_name_plural = 'Estados de Documentación'
        ordering            = ['nombre']

    def __str__(self):
        return self.nombre


class Documento(AuditoriaModel):
    codigo      = models.CharField(max_length=20)
    descripcion = models.CharField(max_length=300)

    class Meta:
        verbose_name        = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering            = ['codigo']
        constraints         = [
            models.UniqueConstraint(fields=['codigo'], condition=Q(deleted_at__isnull=True), name='unique_documento_codigo_active'),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"


class Regional(AuditoriaModel):
    usuario       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='regionales_a_cargo',
    )
    tipo_regional = models.ForeignKey(
        TipoRegional,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='regionales',
    )
    nombre = models.CharField(max_length=200)
    tipo   = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        verbose_name        = 'Regional'
        verbose_name_plural = 'Regionales'
        ordering            = ['nombre']

    def __str__(self):
        return self.nombre


class Agencia(AuditoriaModel):
    regional = models.ForeignKey(
        Regional,
        on_delete=models.CASCADE,
        related_name='agencias',
    )
    nombre = models.CharField(max_length=200)

    class Meta:
        verbose_name        = 'Agencia'
        verbose_name_plural = 'Agencias'
        ordering            = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.regional.nombre})"
