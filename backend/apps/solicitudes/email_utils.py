import os
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone

ORO   = '#CBab58'
NAVY  = '#0F1932'
NAVY2 = '#1a2a50'


def _html_body(solicitud):
    aseg  = solicitud.asegurado
    empl  = solicitud.empleador
    causal = solicitud.tipo_causal

    nombre_aseg = ' '.join(filter(None, [
        aseg.nombre, aseg.ap_paterno, aseg.ap_materno
    ])) if aseg else '—'

    # Formularios FPC
    formularios = solicitud.formularios.select_related('tipo_planilla').all()
    total_ganado = sum(float(f.total_ganado) for f in formularios)

    filas_fpc = ''
    for idx, f in enumerate(formularios):
        bg = '#f5f4f0' if idx % 2 == 0 else '#ffffff'
        planilla = f.tipo_planilla.nombre if f.tipo_planilla else '—'
        monto = '{:,.2f}'.format(float(f.total_ganado))
        filas_fpc += f'''
        <tr style="background:{bg}">
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0">{idx+1}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0;font-weight:600">{f.numero or "—"}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0">{f.periodo}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0">{planilla}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0;text-align:right">{monto}</td>
        </tr>'''

    fila_total = f'''
        <tr style="background:{NAVY2}">
          <td colspan="4" style="padding:6px 10px;color:{ORO};font-weight:700;text-align:right">TOTAL GENERAL</td>
          <td style="padding:6px 10px;color:{ORO};font-weight:800;text-align:right">
            {'{:,.2f}'.format(total_ganado)}
          </td>
        </tr>'''

    tabla_fpc = f'''
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:6px;font-size:13px">
      <thead>
        <tr style="background:{NAVY}">
          <th style="padding:7px 10px;color:#fff;text-align:left">#</th>
          <th style="padding:7px 10px;color:#fff;text-align:left">N° FPC</th>
          <th style="padding:7px 10px;color:#fff;text-align:left">Período</th>
          <th style="padding:7px 10px;color:#fff;text-align:left">Tipo Planilla</th>
          <th style="padding:7px 10px;color:#fff;text-align:right">Total Ganado (Bs.)</th>
        </tr>
      </thead>
      <tbody>
        {filas_fpc}
        {fila_total if formularios.exists() else ''}
      </tbody>
    </table>''' if formularios.exists() else '<p style="color:#888;font-style:italic">Sin formularios FPC registrados.</p>'

    # Documentos adjuntos
    documentos = solicitud.documentos_respaldo.select_related('documento').all()
    filas_docs = ''
    for idx, d in enumerate(documentos):
        bg = '#f5f4f0' if idx % 2 == 0 else '#ffffff'
        codigo = d.documento.codigo if d.documento else '—'
        nombre = d.documento.descripcion or d.documento.nombre if d.documento else '—'
        archivo = os.path.basename(d.archivo.name) if d.archivo else '—'
        filas_docs += f'''
        <tr style="background:{bg}">
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0">{idx+1}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0;font-weight:600">{codigo}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0">{nombre}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #e0e0e0;color:#555">{archivo}</td>
        </tr>'''

    tabla_docs = f'''
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:6px;font-size:13px">
      <thead>
        <tr style="background:{NAVY}">
          <th style="padding:7px 10px;color:#fff;text-align:left">#</th>
          <th style="padding:7px 10px;color:#fff;text-align:left">Código</th>
          <th style="padding:7px 10px;color:#fff;text-align:left">Documento</th>
          <th style="padding:7px 10px;color:#fff;text-align:left">Archivo</th>
        </tr>
      </thead>
      <tbody>{filas_docs}</tbody>
    </table>''' if documentos.exists() else '<p style="color:#888;font-style:italic">Sin documentos adjuntos.</p>'

    fecha_creacion = solicitud.created_at.astimezone(
        timezone.get_current_timezone()
    ).strftime('%d/%m/%Y %H:%M')

    def campo(label, valor):
        return f'''
        <tr>
          <td style="padding:6px 14px;color:#888;font-size:11px;text-transform:uppercase;
                     font-weight:700;white-space:nowrap;width:160px">{label}</td>
          <td style="padding:6px 14px;font-size:13px;border-left:2px solid {ORO};
                     background:#f7f6f2">{valor or '—'}</td>
        </tr>'''

    return f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0f2f5">
<tr><td align="center" style="padding:24px 12px">

  <table width="620" cellpadding="0" cellspacing="0"
         style="background:#ffffff;border-radius:8px;overflow:hidden;
                box-shadow:0 2px 12px rgba(0,0,0,.12)">

    <!-- ENCABEZADO -->
    <tr>
      <td style="background:{NAVY};padding:20px 28px;border-bottom:3px solid {ORO}">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <p style="margin:0;color:{ORO};font-size:18px;font-weight:700;letter-spacing:.5px">
                GESTORA PÚBLICA
              </p>
              <p style="margin:2px 0 0;color:#9aa;font-size:11px">
                de la Seguridad Social de Largo Plazo
              </p>
            </td>
            <td align="right">
              <p style="margin:0;color:#9aa;font-size:10px;text-transform:uppercase">N° Solicitud</p>
              <p style="margin:0;color:{ORO};font-size:22px;font-weight:800">
                {solicitud.numero_solicitud}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- TÍTULO -->
    <tr>
      <td style="background:#162040;padding:12px 28px">
        <p style="margin:0;color:{ORO};font-size:14px;font-weight:700;letter-spacing:.3px">
          FORMULARIO DE SOLICITUD DE RECTIFICACIÓN
        </p>
        <p style="margin:3px 0 0;color:#9aa;font-size:11px">
          Creada el {fecha_creacion}
        </p>
      </td>
    </tr>

    <!-- CUERPO -->
    <tr><td style="padding:20px 28px">

      <!-- I. Datos de la Solicitud -->
      <p style="margin:0 0 6px;color:{NAVY};font-size:12px;font-weight:700;
                text-transform:uppercase;letter-spacing:.5px;
                border-left:3px solid {ORO};padding-left:8px">
        I. Datos de la Solicitud
      </p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:16px">
        {campo('Regional', solicitud.regional.nombre if solicitud.regional else None)}
        {campo('Causal', causal.nombre if causal else None)}
        {campo('Prioridad', solicitud.get_prioridad_display())}
        {campo('Fecha de Recepción', solicitud.fecha_recepcion.strftime('%d/%m/%Y') if solicitud.fecha_recepcion else None)}
        {campo('Fecha Límite', solicitud.fecha_limite.strftime('%d/%m/%Y') if solicitud.fecha_limite else None)}
        {campo('Estado', solicitud.get_estado_display())}
      </table>

      <!-- II. Asegurado -->
      <p style="margin:0 0 6px;color:{NAVY};font-size:12px;font-weight:700;
                text-transform:uppercase;letter-spacing:.5px;
                border-left:3px solid {ORO};padding-left:8px">
        II. Datos del Asegurado
      </p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:16px">
        {campo('Nombre Completo', nombre_aseg)}
        {campo('C.I. / Cédula', aseg.cedula if aseg else None)}
        {campo('CUA', aseg.cua if aseg else None)}
      </table>

      <!-- III. Empleador -->
      <p style="margin:0 0 6px;color:{NAVY};font-size:12px;font-weight:700;
                text-transform:uppercase;letter-spacing:.5px;
                border-left:3px solid {ORO};padding-left:8px">
        III. Datos del Empleador
      </p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:16px">
        {campo('Nombre / Razón Social', empl.nombre_razon_social if empl else None)}
        {campo('N° Documento', empl.numero_documento_identidad if empl else None)}
      </table>

      <!-- IV. FPC -->
      <p style="margin:0 0 6px;color:{NAVY};font-size:12px;font-weight:700;
                text-transform:uppercase;letter-spacing:.5px;
                border-left:3px solid {ORO};padding-left:8px">
        IV. Formularios FPC
      </p>
      {tabla_fpc}

      <!-- V. Documentos -->
      <p style="margin:16px 0 6px;color:{NAVY};font-size:12px;font-weight:700;
                text-transform:uppercase;letter-spacing:.5px;
                border-left:3px solid {ORO};padding-left:8px">
        V. Documentos Adjuntos
      </p>
      {tabla_docs}

    </td></tr>

    <!-- PIE -->
    <tr>
      <td style="background:{NAVY};padding:14px 28px;border-top:3px solid {ORO}">
        <p style="margin:0;color:#9aa;font-size:11px;text-align:center">
          Este es un correo automático generado por el sistema GNARC ·
          Gestora Pública de la Seguridad Social de Largo Plazo ·
          <a href="https://www.gestora.bo" style="color:{ORO}">www.gestora.bo</a>
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>"""


def enviar_notificacion_solicitud(solicitud, destinatarios_extra=None):
    """
    Envía correo de notificación al creador + asegurado (si tiene email)
    con los documentos adjuntos como attachments.
    """
    aseg = solicitud.asegurado

    # Construir lista de destinatarios
    to_list = []
    if solicitud.usuario_creador and solicitud.usuario_creador.email:
        to_list.append(solicitud.usuario_creador.email)
    if aseg and aseg.email:
        to_list.append(aseg.email)
    if destinatarios_extra:
        to_list.extend(destinatarios_extra)

    # Eliminar duplicados manteniendo orden
    seen = set()
    to_list = [e for e in to_list if e and not (e in seen or seen.add(e))]

    if not to_list:
        return False, 'No hay destinatarios configurados.'

    asunto = (
        f'Solicitud de Rectificación {solicitud.numero_solicitud} – '
        f'{solicitud.tipo_causal.nombre if solicitud.tipo_causal else "GNARC"}'
    )

    html = _html_body(solicitud)
    text = (
        f'Solicitud {solicitud.numero_solicitud} creada.\n'
        f'Asegurado: {aseg.nombre_completo if aseg else "—"}\n'
        f'Causal: {solicitud.tipo_causal.nombre if solicitud.tipo_causal else "—"}\n'
    )

    email_msg = EmailMultiAlternatives(
        subject=asunto,
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=to_list,
    )
    email_msg.attach_alternative(html, 'text/html')

    # Adjuntar archivos de DocumentoRespaldo
    documentos = solicitud.documentos_respaldo.all()
    for doc in documentos:
        if doc.archivo:
            try:
                archivo_path = doc.archivo.path
                with open(archivo_path, 'rb') as f:
                    nombre = os.path.basename(archivo_path)
                    email_msg.attach(nombre, f.read())
            except (FileNotFoundError, ValueError):
                pass

    try:
        email_msg.send(fail_silently=False)
        return True, f'Correo enviado a: {", ".join(to_list)}'
    except Exception as e:
        return False, str(e)
