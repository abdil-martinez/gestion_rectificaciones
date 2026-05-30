from django.contrib import admin
from .models import (
    TipoSolicitud, Administradora, TipoCausal, Unidad, TipoRegional,
    TipoIdentificacion, AreaSolicitante,
    EstadoPlazo, TipoPlanilla, EstadoDocumentacion, Documento,
    Regional, Agencia,
)


class AuditoriaAdmin(admin.ModelAdmin):
    readonly_fields = ('created_at', 'updated_at', 'deleted_at',
                       'usuario_creador', 'usuario_modificador', 'usuario_eliminador')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.usuario_creador = request.user
        else:
            obj.usuario_modificador = request.user
        super().save_model(request, obj, form, change)


@admin.register(TipoSolicitud)
class TipoSolicitudAdmin(AuditoriaAdmin):
    list_display  = ('codigo', 'descripcion', 'created_at')
    search_fields = ('codigo', 'descripcion')


@admin.register(Administradora)
class AdministradoraAdmin(AuditoriaAdmin):
    list_display  = ('nombre', 'codigo', 'nit', 'created_at')
    search_fields = ('nombre', 'codigo', 'nit')


@admin.register(TipoCausal)
class TipoCausalAdmin(AuditoriaAdmin):
    list_display  = ('nombre', 'tipo', 'created_at')
    list_filter   = ('tipo',)
    search_fields = ('nombre',)


@admin.register(Unidad)
class UnidadAdmin(AuditoriaAdmin):
    list_display  = ('nombre', 'created_at')
    search_fields = ('nombre',)


@admin.register(TipoRegional)
class TipoRegionalAdmin(AuditoriaAdmin):
    list_display  = ('nombre', 'created_at')
    search_fields = ('nombre',)


@admin.register(Regional)
class RegionalAdmin(AuditoriaAdmin):
    list_display  = ('nombre', 'tipo_regional', 'usuario', 'created_at')
    list_filter   = ('tipo_regional',)
    search_fields = ('nombre',)


@admin.register(Agencia)
class AgenciaAdmin(AuditoriaAdmin):
    list_display  = ('nombre', 'regional', 'created_at')
    list_filter   = ('regional',)
    search_fields = ('nombre',)


admin.site.register(TipoIdentificacion)
admin.site.register(AreaSolicitante)
admin.site.register(EstadoPlazo)
admin.site.register(TipoPlanilla)
admin.site.register(EstadoDocumentacion)
admin.site.register(Documento)
