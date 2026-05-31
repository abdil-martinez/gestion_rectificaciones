from django.utils import timezone

TRANSICIONES_VALIDAS = {
    'BOR':  ['PEND'],
    'PEND': ['ASIG'],
    'ASIG': ['REV', 'DEV'],
    'REV':  ['RECT', 'RECH', 'DEV'],
    'DEV':  ['PEND'],
    'RECT': ['FIN'],
    'RECH': ['FIN'],
    'FIN':  [],
}

ROLES_POR_TRANSICION = {
    ('BOR',  'PEND'): ['ADMIN', 'SUPER', 'ANALIST'],
    ('PEND', 'ASIG'): ['ADMIN', 'SUPER'],
    ('ASIG', 'REV'):  ['ADMIN', 'SUPER', 'ANALIST'],
    ('ASIG', 'DEV'):  ['ADMIN', 'SUPER', 'ANALIST'],
    ('REV',  'RECT'): ['ADMIN', 'SUPER'],
    ('REV',  'RECH'): ['ADMIN', 'SUPER'],
    ('REV',  'DEV'):  ['ADMIN', 'SUPER', 'ANALIST'],
    ('DEV',  'PEND'): ['ADMIN', 'SUPER', 'ANALIST'],
    ('RECT', 'FIN'):  ['ADMIN', 'SUPER', 'ANALIST'],
    ('RECH', 'FIN'):  ['ADMIN', 'SUPER', 'ANALIST'],
}

ETIQUETAS_ESTADO = {
    'BOR':  'Borrador',
    'PEND': 'Pendiente',
    'ASIG': 'Asignado',
    'REV':  'En Revisión',
    'RECT': 'Rectificado',
    'RECH': 'Rechazado',
    'DEV':  'Devuelto',
    'FIN':  'Finalizado',
}


def puede_transitar(usuario_rol, estado_actual, estado_nuevo):
    """
    Verifica si una transición de estado es válida para el rol del usuario dado.
    Retorna (bool, str) — (permitido, mensaje).
    """
    if estado_nuevo not in TRANSICIONES_VALIDAS.get(estado_actual, []):
        return False, (
            f"La transición de '{ETIQUETAS_ESTADO.get(estado_actual)}' "
            f"a '{ETIQUETAS_ESTADO.get(estado_nuevo)}' no está permitida."
        )

    roles_permitidos = ROLES_POR_TRANSICION.get((estado_actual, estado_nuevo), [])
    if usuario_rol not in roles_permitidos:
        return False, (
            f"Su rol '{usuario_rol}' no tiene permiso para realizar esta transición."
        )

    return True, "Transición permitida."


def transiciones_disponibles(usuario_rol, estado_actual):
    """
    Retorna la lista de estados a los que puede transitar el usuario desde el estado actual.
    """
    posibles = TRANSICIONES_VALIDAS.get(estado_actual, [])
    return [
        est for est in posibles
        if usuario_rol in ROLES_POR_TRANSICION.get((estado_actual, est), [])
    ]


def registrar_bitacora(solicitud, usuario, estado_anterior, estado_nuevo, accion, comentario='', ip=''):
    """
    Crea una entrada en la bitácora de la solicitud.
    """
    from .models import BitacoraSolicitud
    BitacoraSolicitud.objects.create(
        solicitud=solicitud,
        usuario=usuario,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        accion=accion,
        comentario=comentario,
        ip_address=ip or None,
    )
