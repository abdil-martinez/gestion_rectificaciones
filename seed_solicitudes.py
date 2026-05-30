"""
Poblar GNARC con 20 solicitudes de ejemplo distribuidas en todos los estados.
Ejecutar: python manage.py shell < seed_solicitudes.py
  o desde el directorio backend: python -c "exec(open('../seed_solicitudes.py').read())"
"""
import os, sys, django
from datetime import date, timedelta
from django.utils import timezone

# ── setup Django ──────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from apps.solicitudes.models import (
    Solicitud, Asegurado, Empleador, Solicitante, BitacoraSolicitud
)
from apps.accounts.models import CustomUser
from apps.catalogos.models import (
    TipoSolicitud, TipoCausal, Regional, Agencia, Administradora
)

# ── Referencias a catálogos ───────────────────────────────────────────────────
admin_user = CustomUser.objects.get(username='admin')

ts_int = TipoSolicitud.objects.get(id=17)   # INTERNO
ts_ext = TipoSolicitud.objects.get(id=18)   # EXTERNO

tc = {
    'DEBITO':     TipoCausal.objects.get(id=13),
    'CREDITO':    TipoCausal.objects.get(id=14),
    'MOD_ASEG':   TipoCausal.objects.get(id=16),
    'MOD_EMPL':   TipoCausal.objects.get(id=15),
    'RETIRO':     TipoCausal.objects.get(id=17),
}

reg = {
    'LP':    Regional.objects.get(id=20),
    'ELALTO':Regional.objects.get(id=11),
    'SCZ':   Regional.objects.get(id=17),
    'CBBA':  Regional.objects.get(id=14),
    'ORU':   Regional.objects.get(id=21),
    'SUCIA': Regional.objects.get(id=16),
    'BENI':  Regional.objects.get(id=18),
    'TAR':   Regional.objects.get(id=15),
}

ag = {
    'LP_CENTRAL':  Agencia.objects.get(id=1),
    'LP_SAN_PEDRO':Agencia.objects.get(id=3),
    'LP_SOPOCACHI':Agencia.objects.get(id=5),
    'LP_ZONA_SUR': Agencia.objects.get(id=7),
    'LP_MIRAF':    Agencia.objects.get(id=4),
    'ELALTO_16JUL':Agencia.objects.get(id=9),
    'CBBA_CENTRAL':Agencia.objects.get(id=10),
    'SCZ_CENTRAL': Agencia.objects.get(id=12),
    'SCZ_PLAN3000':Agencia.objects.get(id=13),
    'ORU_CENTRAL': Agencia.objects.get(id=15),
    'SUC_CENTRAL': Agencia.objects.get(id=17),
    'TAR_CENTRAL': Agencia.objects.get(id=18),
    'TRI_CENTRAL': Agencia.objects.get(id=19),
}

adm_gst = Administradora.objects.get(id=7)   # GST — Gestora

# Analistas disponibles
analistas = list(CustomUser.objects.filter(rol='ANALIST', is_active=True))
supervisores = list(CustomUser.objects.filter(rol__in=['SUPER','ADMIN'], is_active=True))
analist_mireya = CustomUser.objects.get(username='mireya')
analist_keytlin = CustomUser.objects.get(username='keytlin')
super_ivan = CustomUser.objects.get(username='ivan')
super_camilo = CustomUser.objects.get(username='camilo')

today = date.today()


# ── Datos de asegurados y empleadores ────────────────────────────────────────
ASEGURADOS_DATA = [
    dict(nombre='Carlos',   ap_paterno='Mamani',    ap_materno='Quispe',   cedula='1234567 LP',  cua='10000001'),
    dict(nombre='Maria',    ap_paterno='Flores',    ap_materno='Condori',  cedula='2345678 SC',  cua='10000002'),
    dict(nombre='Roberto',  ap_paterno='Gutierrez', ap_materno='Alcon',    cedula='3456789 CB',  cua='10000003'),
    dict(nombre='Ana',      ap_paterno='Torrez',    ap_materno='Lima',     cedula='4567890 OR',  cua='10000004'),
    dict(nombre='Luis',     ap_paterno='Choque',    ap_materno='Vega',     cedula='5678901 LP',  cua='10000005'),
    dict(nombre='Patricia', ap_paterno='Espinoza',  ap_materno='Calle',    cedula='6789012 SC',  cua='10000006'),
    dict(nombre='Diego',    ap_paterno='Quispe',    ap_materno='Mamani',   cedula='7890123 CB',  cua='10000007'),
    dict(nombre='Silvia',   ap_paterno='Colque',    ap_materno='Huanca',   cedula='8901234 LP',  cua='10000008'),
    dict(nombre='Jorge',    ap_paterno='Vargas',    ap_materno='Perez',    cedula='9012345 SC',  cua='10000009'),
    dict(nombre='Carmen',   ap_paterno='Laime',     ap_materno='Apaza',    cedula='0123456 OR',  cua='10000010'),
    dict(nombre='Pedro',    ap_paterno='Baldelomar', ap_materno='Cruz',    cedula='1122334 LP',  cua='10000011'),
    dict(nombre='Rosa',     ap_paterno='Mendoza',   ap_materno='Salinas',  cedula='2233445 SC',  cua='10000012'),
    dict(nombre='Hector',   ap_paterno='Villca',    ap_materno='Nina',     cedula='3344556 CB',  cua='10000013'),
    dict(nombre='Lucia',    ap_paterno='Poma',      ap_materno='Tito',     cedula='4455667 TA',  cua='10000014'),
    dict(nombre='Fernando', ap_paterno='Barriga',   ap_materno='Soria',    cedula='5566778 BE',  cua='10000015'),
    dict(nombre='Elena',    ap_paterno='Cusi',      ap_materno='Marca',    cedula='6677889 LP',  cua='10000016'),
    dict(nombre='Marco',    ap_paterno='Alanoca',   ap_materno='Calcina',  cedula='7788990 SC',  cua='10000017'),
    dict(nombre='Claudia',  ap_paterno='Rojas',     ap_materno='Ticona',   cedula='8899001 CB',  cua='10000018'),
    dict(nombre='Alberto',  ap_paterno='Condori',   ap_materno='Flores',   cedula='9900112 OR',  cua='10000019'),
    dict(nombre='Daniela',  ap_paterno='Mamani',    ap_materno='Catari',   cedula='0011223 LP',  cua='10000020'),
]

EMPLEADORES_DATA = [
    dict(nombre_razon_social='MUNICIPIO DE LA PAZ',        tipo_empleador='PUBLICO',  nit='1000000001'),
    dict(nombre_razon_social='EMPRESA TEXTIL SA',          tipo_empleador='PRIVADO',  nit='2000000002'),
    dict(nombre_razon_social='GOBIERNO DEPARTAMENTAL SCZ', tipo_empleador='PUBLICO',  nit='3000000003'),
    dict(nombre_razon_social='CONSTRUCTORA ANDES SRL',     tipo_empleador='PRIVADO',  nit='4000000004'),
    dict(nombre_razon_social='MIN. DE SALUD',              tipo_empleador='PUBLICO',  nit='5000000005'),
    dict(nombre_razon_social='AGROPECUARIA DEL NORTE SA',  tipo_empleador='PRIVADO',  nit='6000000006'),
    dict(nombre_razon_social='HOSPITAL COCHABAMBA',        tipo_empleador='PUBLICO',  nit='7000000007'),
    dict(nombre_razon_social='TECNOLOGIA E INNOVACION SRL',tipo_empleador='PRIVADO',  nit='8000000008'),
    dict(nombre_razon_social='ALCALDIA DE ORURO',          tipo_empleador='PUBLICO',  nit='9000000009'),
    dict(nombre_razon_social='TRANSPORTE AEREO BOL SA',    tipo_empleador='MIXTO',    nit='1100000010'),
]

# ── Definición de las 20 solicitudes ─────────────────────────────────────────
# (tipo_sol, tipo_causal, regional, agencia, prioridad, estado,
#  analista_asignado, asignado_por, detalle, dias_desde_hoy)
SOLICITUDES = [
    # ── BOR (2) ─────────────────────────────────────────────────────────────
    (ts_int, tc['DEBITO'],   reg['LP'],     ag['LP_CENTRAL'],   'NORMAL', 'BOR',  None,           None,          'Débito incorrecto en planilla enero 2025. Se solicita corrección del monto descontado.',   -3),
    (ts_ext, tc['CREDITO'],  reg['SCZ'],    ag['SCZ_CENTRAL'],  'ALTA',   'BOR',  None,           None,          'Crédito no aplicado en el período 2024-06. Asegurado reporta descuento sin registro.',      -1),

    # ── PEND (3) ────────────────────────────────────────────────────────────
    (ts_int, tc['MOD_ASEG'], reg['CBBA'],   ag['CBBA_CENTRAL'], 'NORMAL', 'PEND', None,           None,          'Modificación de datos del asegurado. Nombre registrado incorrectamente en sistema AFP.',    -5),
    (ts_ext, tc['MOD_EMPL'], reg['ORU'],    ag['ORU_CENTRAL'],  'BAJA',   'PEND', None,           None,          'El empleador figura con NIT incorrecto. Afecta el cálculo de aportes desde 2023.',          -7),
    (ts_int, tc['RETIRO'],   reg['LP'],     ag['LP_SAN_PEDRO'], 'URGENTE','PEND', None,           None,          'Persona no registrada en sistema de retiro. Baja laboral efectiva desde 01/2024.',           -2),

    # ── ASIG (3) ────────────────────────────────────────────────────────────
    (ts_ext, tc['DEBITO'],   reg['SCZ'],    ag['SCZ_PLAN3000'], 'NORMAL', 'ASIG', analist_mireya, super_camilo,  'Doble débito detectado en período 2024-09. Empleador reporta el error.',                   -10),
    (ts_int, tc['CREDITO'],  reg['ELALTO'], ag['ELALTO_16JUL'], 'ALTA',   'ASIG', analist_keytlin,super_ivan,    'Crédito de reintegro pendiente de registro. Monto: Bs 1.450,00.',                          -8),
    (ts_ext, tc['MOD_ASEG'], reg['CBBA'],   ag['CBBA_CENTRAL'], 'NORMAL', 'ASIG', analist_mireya, super_camilo,  'CI registrado con error tipográfico. Documentación respaldatoria adjunta.',                -12),

    # ── REV (2) ─────────────────────────────────────────────────────────────
    (ts_int, tc['MOD_EMPL'], reg['LP'],     ag['LP_SOPOCACHI'], 'ALTA',   'REV',  analist_keytlin,super_ivan,    'Empleador con razón social modificada por fusión empresarial. Documentos notariales adjuntos.', -15),
    (ts_ext, tc['RETIRO'],   reg['SCZ'],    ag['SCZ_CENTRAL'],  'NORMAL', 'REV',  analist_mireya, super_camilo,  'Retiro no procesado en AFP. Asegurado con certificado de baja laboral vigente.',           -18),

    # ── RECT (3) ────────────────────────────────────────────────────────────
    (ts_int, tc['DEBITO'],   reg['ORU'],    ag['ORU_CENTRAL'],  'BAJA',   'RECT', analist_keytlin,super_ivan,    'Débito duplicado verificado. Se aprueba reversión del monto indebido.',                    -22),
    (ts_ext, tc['CREDITO'],  reg['CBBA'],   ag['CBBA_CENTRAL'], 'NORMAL', 'RECT', analist_mireya, super_camilo,  'Crédito verificado con FO. Total cuotas equivalentes confirmadas.',                        -20),
    (ts_int, tc['MOD_ASEG'], reg['LP'],     ag['LP_ZONA_SUR'],  'ALTA',   'RECT', analist_keytlin,super_ivan,    'Datos del asegurado verificados con CI original. Modificación aprobada.',                  -25),

    # ── RECH (2) ────────────────────────────────────────────────────────────
    (ts_ext, tc['MOD_EMPL'], reg['SCZ'],    ag['SCZ_CENTRAL'],  'NORMAL', 'RECH', analist_mireya, super_camilo,  'Solicitud rechazada: documentación incompleta. No se adjuntó acta notarial requerida.',    -30),
    (ts_int, tc['RETIRO'],   reg['CBBA'],   ag['CBBA_CENTRAL'], 'BAJA',   'RECH', analist_keytlin,super_ivan,    'Solicitud rechazada: datos inconsistentes con registros de la Gestora. Cerrar caso.',      -28),

    # ── DEV (2) ─────────────────────────────────────────────────────────────
    (ts_ext, tc['DEBITO'],   reg['ORU'],    ag['ORU_CENTRAL'],  'ALTA',   'DEV',  analist_mireya, super_camilo,  'Devuelta para subsanación: se requiere formulario FO firmado por el empleador.',           -14),
    (ts_int, tc['CREDITO'],  reg['LP'],     ag['LP_MIRAF'],     'NORMAL', 'DEV',  analist_keytlin,super_ivan,    'Devuelta: falta período de devengue en la planilla. Completar y reenviar.',                -11),

    # ── FIN (2) ─────────────────────────────────────────────────────────────
    (ts_int, tc['MOD_ASEG'], reg['SCZ'],    ag['SCZ_CENTRAL'],  'BAJA',   'FIN',  analist_mireya, super_camilo,  'Trámite finalizado. Modificación registrada en sistema AFP exitosamente.',                 -40),
    (ts_ext, tc['MOD_EMPL'], reg['CBBA'],   ag['CBBA_CENTRAL'], 'NORMAL', 'FIN',  analist_keytlin,super_ivan,    'Trámite finalizado. Empleador actualizado. Aportes recalculados correctamente.',           -35),

    # ── ANU (1) ─────────────────────────────────────────────────────────────
    (ts_int, tc['RETIRO'],   reg['LP'],     ag['LP_SAN_PEDRO'], 'BAJA',   'ANU',  None,           super_ivan,    'Anulada por solicitud duplicada. El asegurado presentó otra solicitud con más información.', -20),
]

# ── Crear solicitudes ─────────────────────────────────────────────────────────
created = []
errors  = []

with transaction.atomic():
    for i, (ts, causal, regional, agencia, prioridad, estado,
            analista, asig_por, detalle, dias) in enumerate(SOLICITUDES):

        ased = ASEGURADOS_DATA[i]
        empl = EMPLEADORES_DATA[i % len(EMPLEADORES_DATA)]

        # Asegurado (get_or_create por cedula)
        asegurado, _ = Asegurado.objects.get_or_create(
            cedula=ased['cedula'],
            defaults={
                'nombre':     ased['nombre'],
                'ap_paterno': ased['ap_paterno'],
                'ap_materno': ased['ap_materno'],
                'cua':        ased['cua'],
                'tipo_persona': 'NAT',
            }
        )

        # Empleador (crear nuevo cada vez)
        empleador = Empleador.objects.create(
            nombre_razon_social=empl['nombre_razon_social'],
            tipo_empleador=empl['tipo_empleador'],
            nit=empl['nit'],
        )

        fecha_rec = today + timedelta(days=dias)
        fecha_lim = fecha_rec + timedelta(days=30)

        sol = Solicitud(
            asegurado=asegurado,
            empleador=empleador,
            tipo_solicitud=ts,
            tipo_causal=causal,
            administradora=adm_gst,
            regional=regional,
            agencia=agencia,
            prioridad=prioridad,
            estado=estado,
            detalle_causal=detalle,
            observaciones=f'Solicitud de prueba #{i+1:02d} — generada automáticamente.',
            fecha_recepcion=fecha_rec,
            fecha_limite=fecha_lim,
            monto_total=round(1500 + i * 250.75, 2),
            analista_asignado=analista,
            asignado_por=asig_por,
            usuario_creador=admin_user,
            usuario_modificador=admin_user,
        )
        sol.save()

        # Bitácora coherente con el estado
        def bita(accion, est_ant, est_nuevo, user, comentario=''):
            BitacoraSolicitud.objects.create(
                solicitud=sol,
                usuario=user,
                estado_anterior=est_ant,
                estado_nuevo=est_nuevo,
                accion=accion,
                comentario=comentario,
            )

        if estado in ('PEND','ASIG','REV','RECT','RECH','DEV','FIN','ANU'):
            bita('CREACION', None, 'BOR', admin_user)
            bita('ENVIO',    'BOR', 'PEND', admin_user, 'Enviada para revisión.')
        if estado in ('ASIG','REV','RECT','RECH','DEV','FIN'):
            bita('ASIGNACION', 'PEND', 'ASIG', asig_por or admin_user,
                 f'Asignada a {analista.get_full_name() if analista else "analista"}.')
        if estado in ('REV','RECT','RECH','DEV','FIN'):
            bita('REVISION', 'ASIG', 'REV', asig_por or admin_user, 'Iniciada revisión técnica.')
        if estado == 'RECT':
            bita('RECTIFICACION', 'REV', 'RECT', asig_por or admin_user, 'Rectificación aprobada.')
        if estado == 'RECH':
            bita('RECHAZO', 'REV', 'RECH', asig_por or admin_user, 'Documentación insuficiente.')
        if estado == 'DEV':
            bita('DEVOLUCION', 'REV', 'DEV', asig_por or admin_user, 'Devuelta para subsanación.')
        if estado == 'FIN':
            bita('RECTIFICACION', 'REV', 'RECT', asig_por or admin_user, 'Rectificada.')
            bita('FINALIZACION', 'RECT', 'FIN', analista or admin_user, 'Trámite finalizado.')
        if estado == 'ANU':
            bita('ANULACION', 'PEND', 'ANU', asig_por or admin_user, 'Anulada: solicitud duplicada.')
        if estado == 'BOR':
            bita('CREACION', None, 'BOR', admin_user)

        created.append(sol.numero_solicitud)
        print(f'  [{i+1:02d}] {sol.numero_solicitud}  estado={estado:4s}  {ts.codigo}  {regional.nombre}  {prioridad}')

print(f'\n✓ {len(created)} solicitudes creadas:')
for n in created:
    print(f'   {n}')

# Resumen por estado
from collections import Counter
states = [s[5] for s in SOLICITUDES]
print('\nDistribución por estado:')
for st, cnt in sorted(Counter(states).items()):
    print(f'  {st:4s}: {cnt}')
