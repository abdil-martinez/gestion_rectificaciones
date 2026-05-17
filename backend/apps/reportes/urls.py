from django.urls import path
from .views import (
    DashboardView, ReporteProductividadView, ReporteCausalView,
    ReporteTipoRegionalView, ReporteRegionalView, ExportarExcelView,
)

urlpatterns = [
    path('dashboard/',      DashboardView.as_view(),             name='dashboard'),
    path('productividad/',  ReporteProductividadView.as_view(),  name='productividad'),
    path('causales/',       ReporteCausalView.as_view(),         name='causales'),
    path('tipo-regional/',  ReporteTipoRegionalView.as_view(),   name='tipo-regional'),
    path('regional/',       ReporteRegionalView.as_view(),       name='regional'),
    path('exportar/',       ExportarExcelView.as_view(),         name='exportar'),
]
