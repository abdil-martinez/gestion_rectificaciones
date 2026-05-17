import io
from rest_framework import viewsets, status, filters, parsers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from django.utils import timezone

from .models import Solicitud, BitacoraSolicitud, Formulario, DocumentoRespaldo, Asegurado, Empleador, Solicitante
from .serializers import (
    SolicitudListSerializer, SolicitudDetailSerializer, SolicitudCreateSerializer,
    BitacoraSerializer, FormularioSerializer, DocumentoRespaldoSerializer,
    AseguradoSerializer, EmpleadorSerializer, SolicitanteSerializer,
)
from .workflow import puede_transitar, registrar_bitacora, transiciones_disponibles


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class SolicitudViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['estado', 'regional', 'regional__tipo_regional', 'analista_asignado', 'prioridad', 'tipo_causal']
    search_fields      = ['numero_solicitud', 'asegurado__nombre', 'asegurado__cedula',
                          'asegurado__ap_paterno', 'asegurado__ap_materno']
    ordering_fields    = ['created_at', 'fecha_recepcion', 'fecha_limite', 'numero_solicitud', 'estado']
    ordering           = ['-created_at']

    def get_queryset(self):
        qs = Solicitud.objects.select_related(
            'asegurado', 'empleador', 'solicitante',
            'tipo_solicitud', 'tipo_causal', 'regional',
            'analista_asignado', 'area_solicitante',
        )
        user = self.request.user
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(created_at__date__lte=fecha_hasta)

        if user.rol == 'ANALIST':
            qs = qs.filter(analista_asignado=user)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return SolicitudCreateSerializer
        if self.action in ('list',):
            return SolicitudListSerializer
        return SolicitudDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        # Auto-asignar solicitante vinculado al usuario actual
        extra = {'usuario_creador': user}
        if not request.data.get('solicitante'):
            solicitante, _ = Solicitante.objects.get_or_create(
                usuario=user,
                defaults={
                    'nombre':     user.first_name or user.username,
                    'ap_paterno': user.last_name or '',
                }
            )
            extra['solicitante'] = solicitante

        solicitud = serializer.save(**extra)
        registrar_bitacora(
            solicitud=solicitud,
            usuario=user,
            estado_anterior=None,
            estado_nuevo='BOR',
            accion='CREACION',
            comentario='Solicitud creada.',
            ip=get_client_ip(request),
        )
        return Response(
            SolicitudDetailSerializer(solicitud, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        pass

    @action(detail=True, methods=['post'], url_path='cambiar_estado')
    def cambiar_estado(self, request, pk=None):
        solicitud       = self.get_object()
        nuevo_estado    = request.data.get('estado')
        comentario      = request.data.get('comentario', '')
        analista_id     = request.data.get('analista_asignado')

        if not nuevo_estado:
            return Response({'detail': 'Debe indicar el nuevo estado.'}, status=status.HTTP_400_BAD_REQUEST)

        permitido, mensaje = puede_transitar(request.user.rol, solicitud.estado, nuevo_estado)
        if not permitido:
            return Response({'detail': mensaje}, status=status.HTTP_403_FORBIDDEN)

        estado_anterior = solicitud.estado
        solicitud.estado = nuevo_estado

        if analista_id and nuevo_estado == 'ASIG':
            from apps.accounts.models import CustomUser
            try:
                analista = CustomUser.objects.get(pk=analista_id)
                solicitud.analista_asignado = analista
            except CustomUser.DoesNotExist:
                pass

        if nuevo_estado in ('APRO', 'FIN'):
            solicitud.fecha_resolucion = timezone.now().date()

        solicitud.usuario_modificador = request.user
        solicitud.save()

        registrar_bitacora(
            solicitud=solicitud,
            usuario=request.user,
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado,
            accion=f"CAMBIO_ESTADO:{estado_anterior}->{nuevo_estado}",
            comentario=comentario,
            ip=get_client_ip(request),
        )

        if nuevo_estado == 'PEND':
            from .email_utils import enviar_notificacion_solicitud
            enviar_notificacion_solicitud(solicitud)

        return Response(SolicitudDetailSerializer(solicitud, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='bitacora')
    def bitacora(self, request, pk=None):
        solicitud = self.get_object()
        entradas  = solicitud.bitacora.select_related('usuario').order_by('-created_at')
        serializer = BitacoraSerializer(entradas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='transiciones')
    def transiciones(self, request, pk=None):
        solicitud   = self.get_object()
        disponibles = transiciones_disponibles(request.user.rol, solicitud.estado)
        return Response({'transiciones': disponibles})

    @action(detail=True, methods=['post'], url_path='enviar_notificacion')
    def enviar_notificacion(self, request, pk=None):
        solicitud = self.get_object()
        from .email_utils import enviar_notificacion_solicitud
        extras = request.data.get('destinatarios_extra', [])
        if isinstance(extras, str):
            extras = [e.strip() for e in extras.split(',') if e.strip()]
        ok, mensaje = enviar_notificacion_solicitud(solicitud, destinatarios_extra=extras or None)
        if ok:
            return Response({'detail': mensaje})
        return Response({'detail': mensaje}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='exportar')
    def exportar_excel(self, request):
        import openpyxl
        from openpyxl.styles import PatternFill, Font, Alignment, Border, Side

        qs = self.filter_queryset(self.get_queryset())
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'Solicitudes'

        ORO_HEX  = 'CBab58'
        NAVY_HEX = '0F1932'

        header_fill   = PatternFill('solid', fgColor=ORO_HEX)
        header_font   = Font(bold=True, color=NAVY_HEX)
        header_align  = Alignment(horizontal='center', vertical='center')
        thin_border   = Border(
            left=Side(style='thin'), right=Side(style='thin'),
            top=Side(style='thin'), bottom=Side(style='thin'),
        )

        headers = [
            'N° Solicitud', 'Estado', 'Prioridad',
            'Asegurado', 'CI Asegurado', 'Empleador',
            'Tipo Causal', 'Regional', 'Analista Asignado',
            'Fecha Recepción', 'Fecha Límite', 'Monto Total',
        ]

        for col_idx, header in enumerate(headers, start=1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.fill    = header_fill
            cell.font    = header_font
            cell.alignment = header_align
            cell.border  = thin_border

        ws.row_dimensions[1].height = 22

        from .models import ESTADO_CHOICES, PRIORIDAD_CHOICES
        estado_map   = dict(ESTADO_CHOICES)
        prioridad_map = dict(PRIORIDAD_CHOICES)

        for row_idx, sol in enumerate(qs, start=2):
            row_data = [
                sol.numero_solicitud,
                estado_map.get(sol.estado, sol.estado),
                prioridad_map.get(sol.prioridad, sol.prioridad),
                sol.asegurado.nombre_completo if sol.asegurado else '',
                sol.asegurado.cedula if sol.asegurado else '',
                sol.empleador.nombre_razon_social if sol.empleador else '',
                sol.tipo_causal.nombre if sol.tipo_causal else '',
                sol.regional.nombre if sol.regional else '',
                sol.analista_asignado.get_full_name() if sol.analista_asignado else '',
                sol.fecha_recepcion,
                sol.fecha_limite,
                float(sol.monto_total),
            ]
            for col_idx, value in enumerate(row_data, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                cell.border = thin_border

        for col in ws.columns:
            max_len = max((len(str(cell.value or '')) for cell in col), default=10)
            ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 40)

        buffer   = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        filename = f"solicitudes_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class BitacoraViewSet(viewsets.ReadOnlyModelViewSet):
    queryset           = BitacoraSolicitud.objects.select_related('solicitud', 'usuario').order_by('-created_at')
    serializer_class   = BitacoraSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['solicitud', 'usuario', 'estado_nuevo']


class FormularioViewSet(viewsets.ModelViewSet):
    queryset           = Formulario.objects.select_related('solicitud', 'tipo_planilla').all()
    serializer_class   = FormularioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['solicitud', 'tipo_planilla']

    def perform_create(self, serializer):
        serializer.save(usuario_creador=self.request.user)


class AseguradoViewSet(viewsets.ModelViewSet):
    queryset           = Asegurado.objects.all()
    serializer_class   = AseguradoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['cedula', 'cua', 'tipo_identificacion']
    search_fields      = ['nombre', 'ap_paterno', 'ap_materno', 'cedula', 'cua']

    def perform_create(self, serializer):
        serializer.save(usuario_creador=self.request.user)


class EmpleadorViewSet(viewsets.ModelViewSet):
    queryset           = Empleador.objects.all()
    serializer_class   = EmpleadorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['numero_documento_identidad', 'nit', 'tipo_identificacion']
    search_fields      = ['nombre_razon_social', 'nit', 'numero_documento_identidad']

    def perform_create(self, serializer):
        serializer.save(usuario_creador=self.request.user)


class DocumentoRespaldoViewSet(viewsets.ModelViewSet):
    queryset           = DocumentoRespaldo.objects.select_related('documento', 'estado_documentacion').all()
    serializer_class   = DocumentoRespaldoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['solicitud', 'documento', 'estado_documentacion']
    parser_classes     = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def perform_create(self, serializer):
        serializer.save(usuario_creador=self.request.user)

    def perform_update(self, serializer):
        serializer.save(usuario_modificador=self.request.user)


class SolicitanteViewSet(viewsets.ModelViewSet):
    queryset           = Solicitante.objects.select_related('unidad', 'usuario').all()
    serializer_class   = SolicitanteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['unidad']
    search_fields      = ['nombre', 'ap_paterno', 'ap_materno']

    def perform_create(self, serializer):
        serializer.save(usuario_creador=self.request.user)
