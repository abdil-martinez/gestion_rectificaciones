import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import dayjs from 'dayjs'

const NAVY = '#0F1932'
const ORO  = '#CBab58'
const GRAY = '#555'

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8, color: '#222', backgroundColor: '#fff' },

  // Imagen de fondo completa
  bgImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  // Área de contenido — respeta encabezado (~3.5cm) y pie (~2.5cm)
  content: {
    position: 'absolute',
    top: 100,
    left: 42,
    right: 42,
    bottom: 72,
  },

  // Título
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY, textTransform: 'uppercase' },
  fechaBox: { alignItems: 'flex-end' },
  fechaLabel: { fontSize: 6.5, color: GRAY, textTransform: 'uppercase' },
  fechaValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY },

  // Sección
  sectionHdr: {
    backgroundColor: NAVY,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 7,
    marginBottom: 3,
  },
  sectionTitle: { color: ORO, fontFamily: 'Helvetica-Bold', fontSize: 6.5, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Campos
  row: { flexDirection: 'row', gap: 5, marginBottom: 3 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 5.5, color: GRAY, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 1 },
  fieldValue: {
    fontSize: 8, color: '#111',
    borderBottomWidth: 0.5, borderBottomColor: '#bbb',
    paddingBottom: 2, minHeight: 13,
  },

  // Tabla periodos
  tHdr: { flexDirection: 'row', backgroundColor: NAVY, marginTop: 3 },
  tHCell: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 5.5, padding: '2 3', textTransform: 'uppercase', textAlign: 'center' },
  tRow: { flexDirection: 'row', borderBottomWidth: 0.3, borderBottomColor: '#ddd' },
  tRowAlt: { backgroundColor: '#f9f8f5' },
  tCell: { fontSize: 7, padding: '2 3', color: '#222', textAlign: 'center' },

  // Documentación adjunta
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2.5 },
  checkBox: {
    width: 8, height: 8,
    borderWidth: 0.8, borderColor: NAVY,
    marginRight: 4, flexShrink: 0,
  },
  checkLabel: { fontSize: 7, color: '#333' },

  // Firmas
  sigArea: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 10 },
  sigBox: { width: '42%', alignItems: 'center' },
  sigLine: { borderTopWidth: 0.5, borderTopColor: '#444', width: '100%', marginTop: 22, marginBottom: 3 },
  sigLabel: { fontSize: 5.8, color: GRAY, textAlign: 'center', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  // Aviso legal
  aviso: {
    marginTop: 6,
    borderTopWidth: 0.5, borderTopColor: '#ccc',
    paddingTop: 4,
    fontSize: 5.5, color: GRAY, textAlign: 'center', fontStyle: 'italic',
  },
})

function Field({ label, value, flex = 1 }) {
  return (
    <View style={[S.field, { flex }]}>
      <Text style={S.fieldLabel}>{label}</Text>
      <Text style={S.fieldValue}>{value || ''}</Text>
    </View>
  )
}

// Parsea "MM/AAAA", "AAAA-MM" → { mes, anio }
function parsePeriodo(p = '') {
  if (p.includes('/')) {
    const [a, b] = p.split('/')
    return a.length <= 2 ? { mes: a, anio: b } : { mes: b, anio: a }
  }
  if (p.includes('-')) {
    const [a, b] = p.split('-')
    return a.length === 4 ? { mes: b, anio: a } : { mes: a, anio: b }
  }
  return { mes: p, anio: '' }
}

const DOCS_LISTA = [
  'Copia del FPC o Century',
  'Carta del Empleador debidamente firmado',
  'Fotocopia del documento de identidad Asegurado / Derechohabiente',
  'Nota de la AFP con documentación que certifique el motivo del Ajuste',
  'Certificado de Defunción del Asegurado, si corresponde',
  'Otros: _______________________________________________',
]

// Renderiza hasta 10 períodos en 2 filas de 5
function TablaPeriodos({ formularios }) {
  const slots = Array.from({ length: 10 }, (_, i) => {
    const f = formularios[i]
    if (!f) return { mes: '', anio: '', total: '' }
    const { mes, anio } = parsePeriodo(f.periodo)
    return { mes, anio, total: f.total_ganado ? Number(f.total_ganado).toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '' }
  })

  const fila1 = slots.slice(0, 5)
  const fila2 = slots.slice(5, 10)

  const colWidths = [22, 26, 36]

  return (
    <View>
      <View style={S.tHdr}>
        {fila1.map((_, i) => (
          <React.Fragment key={i}>
            <Text style={[S.tHCell, { width: colWidths[0] }]}>Mes</Text>
            <Text style={[S.tHCell, { width: colWidths[1] }]}>Año</Text>
            <Text style={[S.tHCell, { width: colWidths[2] }]}>Total Ganado</Text>
          </React.Fragment>
        ))}
      </View>
      {[fila1, fila2].map((fila, ri) => (
        <View key={ri} style={[S.tRow, ri % 2 === 1 && S.tRowAlt]}>
          {fila.map((slot, ci) => (
            <React.Fragment key={ci}>
              <Text style={[S.tCell, { width: colWidths[0] }]}>{slot.mes}</Text>
              <Text style={[S.tCell, { width: colWidths[1] }]}>{slot.anio}</Text>
              <Text style={[S.tCell, { width: colWidths[2] }]}>{slot.total}</Text>
            </React.Fragment>
          ))}
        </View>
      ))}
    </View>
  )
}

export default function FormularioRegularizacionPDF({ sol, formularios = [] }) {
  const BASE   = typeof window !== 'undefined' ? window.location.origin : ''
  const aseg   = sol?.asegurado  || {}
  const empl   = sol?.empleador  || {}

  const nombreAseg = [aseg.nombre, aseg.ap_paterno, aseg.ap_materno].filter(Boolean).join(' ')
  const tipoIdAseg = aseg.tipo_identificacion?.codigo || aseg.tipo_identificacion_codigo || ''
  const tipoIdEmpl = empl.tipo_identificacion?.codigo || empl.tipo_identificacion_codigo || ''

  const fecha = sol?.fecha_recepcion
    ? dayjs(sol.fecha_recepcion).format('DD/MM/YYYY')
    : dayjs().format('DD/MM/YYYY')

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Imagen de fondo (encabezado + pie institucional) */}
        <Image src={`${BASE}/encabezadopie_image1.png`} style={S.bgImg} />

        {/* Contenido superpuesto */}
        <View style={S.content}>

          {/* Título y fecha */}
          <View style={S.titleRow}>
            <Text style={S.title}>Formulario de Regularización</Text>
            <View style={S.fechaBox}>
              <Text style={S.fechaLabel}>N° Solicitud</Text>
              <Text style={S.fechaValue}>{sol?.numero_solicitud || '—'}</Text>
              <Text style={[S.fechaLabel, { marginTop: 3 }]}>Fecha</Text>
              <Text style={S.fechaValue}>{fecha}</Text>
            </View>
          </View>

          {/* Datos del asegurado */}
          <View style={S.sectionHdr}>
            <Text style={S.sectionTitle}>Datos del Asegurado / Derechohabiente</Text>
          </View>
          <View style={S.row}>
            <Field label="Nombres y Apellidos" value={nombreAseg} flex={3} />
          </View>
          <View style={S.row}>
            <Field label="Tipo de Documento" value={tipoIdAseg} flex={1} />
            <Field label="N° de Documento de Identidad" value={aseg.cedula} flex={2} />
            <Field label="CUA" value={aseg.cua} flex={1.5} />
          </View>

          {/* Datos del empleador */}
          <View style={S.sectionHdr}>
            <Text style={S.sectionTitle}>Datos del Empleador</Text>
          </View>
          <View style={S.row}>
            <Field label="Nombre o Razón Social" value={empl.nombre_razon_social} flex={3} />
          </View>
          <View style={S.row}>
            <Field label="Tipo de Identificación" value={tipoIdEmpl} flex={1} />
            <Field label="Número de Identificación" value={empl.numero_documento_identidad} flex={2} />
          </View>

          {/* Causal */}
          <View style={S.sectionHdr}>
            <Text style={S.sectionTitle}>Causal de Ajuste</Text>
          </View>
          <View style={S.row}>
            <Field label="Detalle de la causal de conformidad a normativa" value={sol?.detalle_causal} />
          </View>

          {/* Periodos */}
          <View style={S.sectionHdr}>
            <Text style={S.sectionTitle}>Solicito la Exclusión de los Siguientes Períodos (MM/AAAA)</Text>
          </View>
          <TablaPeriodos formularios={formularios} />

          {/* Documentación adjunta */}
          <View style={S.sectionHdr}>
            <Text style={S.sectionTitle}>Documentación Adjunta (marcar la presentada)</Text>
          </View>
          <View style={{ marginTop: 2 }}>
            {DOCS_LISTA.map((doc, i) => (
              <View key={i} style={S.checkRow}>
                <View style={S.checkBox} />
                <Text style={S.checkLabel}>{doc}</Text>
              </View>
            ))}
          </View>

          {/* Aviso */}
          <Text style={S.aviso}>
            Señor Asegurado/Empleador: en el plazo de 10 días hábiles proceda a apersonarse por las
            oficinas de la Gestora para dar continuidad a su trámite.
          </Text>

          {/* Firmas */}
          <View style={S.sigArea}>
            <View style={S.sigBox}>
              <View style={S.sigLine} />
              <Text style={S.sigLabel}>Firma y Huella del{'\n'}Asegurado / Empleador / Derechohabiente</Text>
            </View>
            <View style={S.sigBox}>
              <View style={S.sigLine} />
              <Text style={S.sigLabel}>Nombre y Firma del{'\n'}Funcionario de la Gestora</Text>
            </View>
          </View>

          {/* Pie declaración */}
          <Text style={[S.aviso, { marginTop: 8, fontFamily: 'Helvetica-Bold', color: NAVY }]}>
            EL PRESENTE FORMULARIO CONSTITUYE UNA DECLARACIÓN JURADA
          </Text>

        </View>
      </Page>
    </Document>
  )
}
