from django.urls import path
from .views import DashboardView, ReporteProductividadView, ReporteCausalView, ExportarExcelView

urlpatterns = [
    path('dashboard/',      DashboardView.as_view(),          name='dashboard'),
    path('productividad/',  ReporteProductividadView.as_view(), name='productividad'),
    path('causales/',       ReporteCausalView.as_view(),      name='causales'),
    path('exportar/',       ExportarExcelView.as_view(),      name='exportar'),
]
