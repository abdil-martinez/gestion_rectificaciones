import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

import datetime
from apps.catalogos.models import TipoSolicitud, TipoCausal, Regional, TipoPlanilla
from apps.solicitudes.models import Solicitud, Asegurado, Empleador, Formulario, BitacoraSolicitud
from apps.accounts.models import CustomUser

admin = CustomUser.objects.get(username='admin')

tipo_sol    = TipoSolicitud.objects.get(codigo='REC')
tipo_causal = TipoCausal.objects.get(nombre='Error en monto de aporte')
regional    = Regional.objects.get(nombre='Cochabamba')
tipo_plan   = TipoPlanilla.objects.get(codigo='ORD')

print('=== PASO 1: ASEGURADO ===')
asegurado = Asegurado.objects.create(
    nombre='Carlos Alberto',
    ap_paterno='Gutierrez',
    ap_materno='Mamani',
    cedula='3456789',
    cua='1234567890',
    tipo_persona='NAT',
    celular='70123456',
    email='cgutierrez@ejemplo.bo',
    usuario_creador=admin,
)
print(f'  {asegurado.nombre_completo} | CI: {asegurado.cedula} | CUA: {asegurado.cua}')

print('=== PASO 2: EMPLEADOR ===')
empleador = Empleador.objects.create(
    nombre_razon_social='Constructora Andina S.R.L.',
    tipo_empleador='PRI',
    nit='1023456780',
    nombre_representante_legal='Jorge Medina Flores',
    usuario_creador=admin,
)
print(f'  {empleador.nombre_razon_social} | NIT: {empleador.nit}')

print('=== PASO 3: SOLICITUD ===')
solicitud = Solicitud.objects.create(
    tipo_solicitud=tipo_sol,
    tipo_causal=tipo_causal,
    regional=regional,
    asegurado=asegurado,
    empleador=empleador,
    prioridad='ALTA',
    fecha_recepcion=datetime.date(2026, 5, 17),
    fecha_limite=datetime.date(2026, 6, 16),
    monto_total='1850.50',
    detalle_causal='Error en monto de aporte correspondiente a los periodos enero-marzo 2025. El empleador registro Bs. 200 menos por mes durante 3 meses consecutivos.',
    usuario_creador=admin,
)
BitacoraSolicitud.objects.create(
    solicitud=solicitud,
    usuario=admin,
    estado_anterior=None,
    estado_nuevo='BOR',
    accion='CREACION',
    comentario='Solicitud creada con datos de prueba.',
)
print(f'  Numero    : SOL-{solicitud.numero_solicitud}')
print(f'  Estado    : {solicitud.estado}')
print(f'  Prioridad : {solicitud.prioridad}')
print(f'  Monto     : Bs. {solicitud.monto_total}')
print(f'  F. Limite : {solicitud.fecha_limite}')

print('=== PASO 4: FORMULARIOS ===')
periodos = [('2025-01', 'F-202501', '650.00'), ('2025-02', 'F-202502', '650.00'), ('2025-03', 'F-202503', '550.50')]
for periodo, numero, monto in periodos:
    f = Formulario.objects.create(
        solicitud=solicitud,
        tipo_planilla=tipo_plan,
        periodo=periodo,
        numero=numero,
        monto_pago=monto,
        usuario_creador=admin,
    )
    print(f'  {f.numero} | {f.periodo} | Bs. {f.monto_pago}')

print('=== VERIFICACION VIA API SERIALIZER ===')
from apps.solicitudes.serializers import SolicitudDetailSerializer
data = SolicitudDetailSerializer(solicitud).data
print(f'  numero_solicitud : {data["numero_solicitud"]}')
print(f'  estado           : {data["estado"]}')
print(f'  asegurado_nombre : {data["asegurado_nombre"]}')
print(f'  tipo_solicitud   : {data["tipo_solicitud_nombre"]}')
print(f'  tipo_causal      : {data["tipo_causal_nombre"]}')
print(f'  regional         : {data["regional_nombre"]}')
print(f'  formularios      : {len(data["formularios"])} registros')
print(f'  monto_total      : {data["monto_total"]}')
print()
print(f'SOLICITUD CREADA EXITOSAMENTE: SOL-{solicitud.numero_solicitud}')
