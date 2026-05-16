from django.contrib import admin
from .models import Solicitud, Solicitante, Asegurado, Empleador, Formulario, DocumentoRespaldo, BitacoraSolicitud


class FormularioInline(admin.TabularInline):
    model  = Formulario
    extra  = 0
    fields = ('tipo_planilla', 'periodo', 'fecha_pago', 'numero', 'codigo', 'monto_pago')


class DocumentoRespaldoInline(admin.TabularInline):
    model  = DocumentoRespaldo
    extra  = 0
    fields = ('documento', 'estado_documentacion', 'archivo', 'observacion')


class BitacoraInline(admin.TabularInline):
    model     = BitacoraSolicitud
    extra     = 0
    readonly_fields = ('usuario', 'estado_anterior', 'estado_nuevo', 'accion', 'comentario', 'ip_address', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display    = ('numero_solicitud', 'asegurado', 'estado', 'prioridad', 'regional', 'analista_asignado', 'created_at')
    list_filter     = ('estado', 'prioridad', 'regional', 'tipo_causal')
    search_fields   = ('numero_solicitud', 'asegurado__nombre', 'asegurado__cedula')
    readonly_fields = ('numero_solicitud', 'created_at', 'updated_at', 'usuario_creador', 'usuario_modificador')
    inlines         = [FormularioInline, DocumentoRespaldoInline, BitacoraInline]
    date_hierarchy  = 'created_at'


@admin.register(Asegurado)
class AseguradoAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'ap_paterno', 'cedula', 'cua', 'tipo_persona')
    search_fields = ('nombre', 'ap_paterno', 'cedula', 'cua')
    list_filter   = ('tipo_persona',)


@admin.register(Empleador)
class EmpleadorAdmin(admin.ModelAdmin):
    list_display  = ('nombre_razon_social', 'tipo_empleador', 'nit')
    search_fields = ('nombre_razon_social', 'nit')
    list_filter   = ('tipo_empleador',)


@admin.register(Solicitante)
class SolicitanteAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'ap_paterno', 'unidad', 'usuario')
    search_fields = ('nombre', 'ap_paterno')
    list_filter   = ('unidad',)


@admin.register(BitacoraSolicitud)
class BitacoraAdmin(admin.ModelAdmin):
    list_display  = ('solicitud', 'usuario', 'estado_anterior', 'estado_nuevo', 'accion', 'created_at')
    list_filter   = ('estado_nuevo', 'accion')
    search_fields = ('solicitud__numero_solicitud',)
    readonly_fields = ('created_at',)
