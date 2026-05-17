import React from 'react'
import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer'
import dayjs from 'dayjs'

const NAVY  = '#0F1932'
const NAVY2 = '#162040'
const ORO   = '#CBab58'

const PRIORIDAD_LABEL = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja', NORMAL: 'Normal' }

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#222',
    backgroundColor: '#ffffff',
    paddingBottom: 0,
    paddingTop: 0,
  },
  watermark: {
    position: 'absolute',
    top: '18%',
    left: '5%',
    width: '90%',
    opacity: 0.07,
  },
  headerImg: { width: '100%' },
  titleBar: {
    backgroundColor: NAVY,
    borderTopWidth: 3,
    borderTopColor: ORO,
    paddingVertical: 8,
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleMain: {
    color: ORO,
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  titleSub: { color: '#9aa', fontSize: 7, marginTop: 2 },
  numBox: { alignItems: 'flex-end' },
  numLabel: { color: '#9aa', fontSize: 7, textTransform: 'uppercase' },
  numValue: { color: ORO, fontFamily: 'Helvetica-Bold', fontSize: 12 },
  content: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 120 },
  sectionHdr: {
    backgroundColor: NAVY,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    color: ORO,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  row: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  field: { flex: 1 },
  fieldLabel: {
    fontSize: 6,
    color: '#777',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 8.5,
    color: '#111',
    backgroundColor: '#f7f6f2',
    borderLeftWidth: 2,
    borderLeftColor: ORO,
    paddingVertical: 3,
    paddingHorizontal: 5,
    minHeight: 15,
  },
  // Table
  tHead: { flexDirection: 'row', backgroundColor: NAVY },
  tHCell: {
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    padding: '4 5',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  tRowAlt: { backgroundColor: '#f9f8f5' },
  tCell: { fontSize: 7.5, padding: '3 5', color: '#222' },
  tTotalRow: {
    flexDirection: 'row',
    backgroundColor: NAVY2,
    borderTopWidth: 1,
    borderTopColor: ORO,
  },
  tTotalCell: {
    color: ORO,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    padding: '4 5',
  },
  sigArea: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  sigBox: { width: '38%', alignItems: 'center' },
  sigLine: {
    borderTopWidth: 0.5,
    borderTopColor: '#444',
    width: '100%',
    marginTop: 28,
    marginBottom: 3,
  },
  sigLabel: {
    fontSize: 6.5,
    color: '#555',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  genDate: {
    fontSize: 6,
    color: '#bbb',
    textAlign: 'right',
    marginTop: 6,
    paddingRight: 2,
  },
  stampWrap: {
    position: 'absolute',
    top: 110,
    right: 28,
    borderWidth: 2,
    borderColor: '#cc0000',
    paddingVertical: 3,
    paddingHorizontal: 8,
    transform: 'rotate(-15deg)',
    opacity: 0.45,
  },
  stampText: {
    color: '#cc0000',
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
  },
  footerImg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
  },
})

function Field({ label, value, flex = 1 }) {
  return (
    <View style={[S.field, { flex }]}>
      <Text style={S.fieldLabel}>{label}</Text>
      <Text style={S.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

function SectionHdr({ title }) {
  return (
    <View style={S.sectionHdr}>
      <Text style={S.sectionTitle}>{title}</Text>
    </View>
  )
}

export default function SolicitudPDF({
  values,
  fpcRows,
  docsChecked,
  tiposPlanilla,
  catalogosDocs,
  tiposCausal,
  regionales,
  numero,
}) {
  const BASE = typeof window !== 'undefined' ? window.location.origin : ''

  const fpcValidos = (fpcRows || []).filter((r) => r.periodo)
  const getPlanilla = (id) => (tiposPlanilla || []).find((t) => t.id === Number(id))?.nombre || '—'
  const getDoc      = (id) => (catalogosDocs  || []).find((d) => d.id === Number(id))
  const getCausal   = (id) => (tiposCausal    || []).find((t) => t.id === Number(id))?.nombre
  const getRegional = (id) => (regionales     || []).find((r) => r.id === Number(id))?.nombre

  const asegurado = values?.asegurado_data || {}
  const empleador = values?.empleador_data || {}
  const nombreAseg = [asegurado.nombre, asegurado.ap_paterno, asegurado.ap_materno]
    .filter(Boolean).join(' ')

  const causalNombre   = getCausal(values?.tipo_causal) || values?.tipo_causal_nombre || '—'
  const regionalNombre = getRegional(values?.regional)  || values?.regional_nombre    || '—'

  const totalGanado = fpcValidos.reduce((s, r) => s + (Number(r.total_ganado) || 0), 0)
  const fmt = (n) => Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Marca de agua */}
        <Image src={`${BASE}/pdf_watermark.png`} style={S.watermark} />

        {/* Encabezado oficial */}
        <Image src={`${BASE}/pdf_header.png`} style={S.headerImg} />

        {/* Barra título */}
        <View style={S.titleBar}>
          <View>
            <Text style={S.titleMain}>FORMULARIO DE SOLICITUD DE RECTIFICACIÓN</Text>
            <Text style={S.titleSub}>Gestora Pública de la Seguridad Social de Largo Plazo</Text>
          </View>
          <View style={S.numBox}>
            <Text style={S.numLabel}>N° de Solicitud</Text>
            <Text style={S.numValue}>{numero || 'BORRADOR'}</Text>
          </View>
        </View>

        {/* Sello BORRADOR */}
        {!numero && (
          <View style={S.stampWrap}>
            <Text style={S.stampText}>BORRADOR</Text>
          </View>
        )}

        {/* Cuerpo */}
        <View style={S.content}>

          {/* I. Datos de la Solicitud */}
          <SectionHdr title="I.  Datos de la Solicitud" />
          <View style={S.row}>
            <Field label="Fecha de Recepción"
              value={values?.fecha_recepcion ? dayjs(values.fecha_recepcion).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')} />
            <Field label="Fecha Límite"
              value={values?.fecha_limite ? dayjs(values.fecha_limite).format('DD/MM/YYYY') : '—'} />
            <Field label="Prioridad"
              value={PRIORIDAD_LABEL[values?.prioridad] || values?.prioridad || 'Normal'} />
            <Field label="Tipo de Solicitud"
              value={values?.tipo_solicitud || '—'} />
          </View>
          <View style={S.row}>
            <Field label="Regional / Área Solicitante" value={regionalNombre} flex={2} />
            <Field label="Administradora" value="GESTORA PÚBLICA" flex={1} />
          </View>

          {/* II. Causal */}
          <SectionHdr title="II.  Causal de Rectificación (Desacreditación)" />
          <View style={S.row}>
            <Field label="Tipo de Causal" value={causalNombre} flex={2} />
          </View>
          {values?.detalle_causal && (
            <View style={S.row}>
              <Field label="Descripción de la Solicitud" value={values.detalle_causal} flex={1} />
            </View>
          )}

          {/* III. Asegurado */}
          <SectionHdr title="III.  Datos del Asegurado" />
          <View style={S.row}>
            <Field label="Nombre Completo" value={nombreAseg || '—'} flex={3} />
            <Field label="C.I. / Cédula" value={asegurado.cedula || '—'} />
            <Field label="CUA" value={asegurado.cua || '—'} />
          </View>

          {/* IV. Empleador */}
          <SectionHdr title="IV.  Datos del Empleador" />
          <View style={S.row}>
            <Field label="Nombre / Razón Social" value={empleador.nombre_razon_social || '—'} flex={3} />
            <Field label="N° Documento" value={empleador.numero_documento_identidad || '—'} />
          </View>

          {/* V. Documentos */}
          {docsChecked && docsChecked.length > 0 && (
            <>
              <SectionHdr title="V.  Documentos Adjuntos" />
              <View>
                <View style={S.tHead}>
                  <Text style={[S.tHCell, { width: '7%'  }]}>#</Text>
                  <Text style={[S.tHCell, { width: '18%' }]}>Código</Text>
                  <Text style={[S.tHCell, { width: '53%' }]}>Descripción del Documento</Text>
                  <Text style={[S.tHCell, { width: '22%' }]}>Estado / Archivo</Text>
                </View>
                {docsChecked.map(([docId, sel], idx) => {
                  const doc = getDoc(docId)
                  return (
                    <View key={docId} style={[S.tRow, idx % 2 === 1 ? S.tRowAlt : {}]}>
                      <Text style={[S.tCell, { width: '7%',  color: '#999' }]}>{idx + 1}</Text>
                      <Text style={[S.tCell, { width: '18%', fontFamily: 'Helvetica-Bold', fontSize: 7 }]}>
                        {doc?.codigo || `DOC-${docId}`}
                      </Text>
                      <Text style={[S.tCell, { width: '53%' }]}>{doc?.descripcion || doc?.nombre || '—'}</Text>
                      <Text style={[S.tCell, { width: '22%', color: '#555', fontSize: 6.5 }]}>
                        {sel.file?.name || '✓ Recibido'}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </>
          )}

          {/* VI. Formularios FPC */}
          <SectionHdr title="VI.  Formularios FPC — Detalle de Rectificación" />
          {fpcValidos.length === 0 ? (
            <Text style={{ fontSize: 7.5, color: '#888', paddingLeft: 8, paddingTop: 4, fontStyle: 'italic' }}>
              Sin formularios FPC registrados.
            </Text>
          ) : (
            <View>
              <View style={S.tHead}>
                <Text style={[S.tHCell, { width: '7%'  }]}>#</Text>
                <Text style={[S.tHCell, { width: '24%' }]}>N° FPC</Text>
                <Text style={[S.tHCell, { width: '24%' }]}>Período de Cotización</Text>
                <Text style={[S.tHCell, { width: '24%' }]}>Tipo de Planilla</Text>
                <Text style={[S.tHCell, { width: '21%', textAlign: 'right' }]}>Total Ganado (Bs.)</Text>
              </View>
              {fpcValidos.map((row, idx) => (
                <View key={idx} style={[S.tRow, idx % 2 === 1 ? S.tRowAlt : {}]}>
                  <Text style={[S.tCell, { width: '7%',  color: '#999' }]}>{idx + 1}</Text>
                  <Text style={[S.tCell, { width: '24%', fontFamily: 'Helvetica-Bold', fontSize: 7 }]}>
                    {row.numero || '—'}
                  </Text>
                  <Text style={[S.tCell, { width: '24%' }]}>{row.periodo || '—'}</Text>
                  <Text style={[S.tCell, { width: '24%' }]}>{getPlanilla(row.tipo_planilla)}</Text>
                  <Text style={[S.tCell, { width: '21%', textAlign: 'right' }]}>
                    {row.total_ganado ? fmt(row.total_ganado) : '0.00'}
                  </Text>
                </View>
              ))}
              <View style={S.tTotalRow}>
                <Text style={[S.tTotalCell, { width: '79%', textAlign: 'right' }]}>TOTAL GENERAL</Text>
                <Text style={[S.tTotalCell, { width: '21%', textAlign: 'right' }]}>{fmt(totalGanado)}</Text>
              </View>
            </View>
          )}

          {/* Firmas */}
          <View style={S.sigArea}>
            <View style={S.sigBox}>
              <View style={S.sigLine} />
              <Text style={S.sigLabel}>Firma y Sello del Solicitante</Text>
            </View>
            <View style={S.sigBox}>
              <View style={S.sigLine} />
              <Text style={S.sigLabel}>Firma — Recepciona (Analista)</Text>
            </View>
          </View>

          <Text style={S.genDate}>
            Documento generado: {dayjs().format('DD/MM/YYYY HH:mm')}
          </Text>

        </View>

        {/* Pie de página oficial */}
        <Image src={`${BASE}/pdf_footer.png`} style={S.footerImg} />

      </Page>
    </Document>
  )
}
