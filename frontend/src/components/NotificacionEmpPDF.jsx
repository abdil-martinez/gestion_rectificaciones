import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import dayjs from 'dayjs'

const NAVY = '#0F1932'
const ORO  = '#CBab58'

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#111', backgroundColor: '#fff', paddingTop: 0, paddingBottom: 0 },
  headerImg:  { width: '100%' },
  footerImg:  { position: 'absolute', bottom: 0, left: 0, width: '100%' },
  watermark:  { position: 'absolute', top: '14%', left: '5%', width: '90%', opacity: 0.85 },
  titleBar: {
    backgroundColor: NAVY, borderTopWidth: 3, borderTopColor: ORO,
    paddingVertical: 5, paddingHorizontal: 28,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  titleMain: { color: ORO, fontFamily: 'Helvetica-Bold', fontSize: 9, letterSpacing: 0.4 },
  titleSub:  { color: '#9aa', fontSize: 6.5, marginTop: 1 },
  citeBox:   { alignItems: 'flex-end' },
  citeLabel: { color: '#9aa', fontSize: 6, textTransform: 'uppercase' },
  citeValue: { color: ORO, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  content: { paddingHorizontal: 40, paddingTop: 14, paddingBottom: 60, flex: 1 },
  lugarFecha: { fontSize: 8.5, textAlign: 'right', marginBottom: 16 },
  destinatario: { marginBottom: 12 },
  destNombre:  { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  destDato:    { fontSize: 8.5, color: '#333' },
  presente:    { fontSize: 8.5, marginTop: 4, fontStyle: 'italic' },
  refLine:   { marginBottom: 12 },
  refLabel:  { fontFamily: 'Helvetica-Bold', fontSize: 8.5, textDecoration: 'underline' },
  refValue:  { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  saludo:    { fontSize: 8.5, marginBottom: 8 },
  parrafo:   { fontSize: 8.5, lineHeight: 1.5, marginBottom: 10, textAlign: 'justify' },
  tHead: { flexDirection: 'row', backgroundColor: NAVY, marginTop: 8 },
  tHCell: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7, padding: '3 6', textTransform: 'uppercase' },
  tRow:    { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  tRowAlt: { backgroundColor: '#f7f6f2' },
  tCell:   { fontSize: 7.5, padding: '3 6', color: '#222' },
  cierre: { marginTop: 16, fontSize: 8.5 },
  firmaArea: { marginTop: 40, alignItems: 'flex-start' },
  firmaLine: { borderTopWidth: 0.5, borderTopColor: '#444', width: 180, marginBottom: 3 },
  firmaLabel:    { fontSize: 7, color: '#555', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  firmaSubLabel: { fontSize: 6.5, color: '#888' },
})

export default function NotificacionEmpPDF({ data }) {
  const BASE = typeof window !== 'undefined' ? window.location.origin : ''
  const {
    lugar = 'La Paz', fecha, cite,
    empleador = {}, estadoResultado = 'APROBADA',
    textoObservacion = '',
    fpcs = [], firmaNombre = '', firmaCargo = '',
  } = data

  const fechaStr = fecha ? dayjs(fecha).format('DD [de] MMMM [de] YYYY') : dayjs().format('DD [de] MMMM [de] YYYY')

  return (
    <Document>
      <Page size="A4" style={S.page}>

        <Image src={`${BASE}/pdf_header.png`} style={S.headerImg} />

        <View style={S.titleBar}>
          <View>
            <Text style={S.titleMain}>NOTIFICACIÓN AL EMPLEADOR</Text>
            <Text style={S.titleSub}>Gestora Pública de la Seguridad Social de Largo Plazo</Text>
          </View>
          <View style={S.citeBox}>
            <Text style={S.citeLabel}>CITE</Text>
            <Text style={S.citeValue}>{cite || '—'}</Text>
          </View>
        </View>

        <View style={S.content}>

          <Text style={S.lugarFecha}>{lugar}, {fechaStr}</Text>

          <View style={S.destinatario}>
            {empleador.nombre_representante_legal
              ? <Text style={S.destNombre}>Señor(a) {empleador.nombre_representante_legal}</Text>
              : <Text style={S.destNombre}>Señor(a) Representante Legal</Text>
            }
            {empleador.cargo_representante && (
              <Text style={S.destDato}>{empleador.cargo_representante}</Text>
            )}
            <Text style={[S.destDato, { fontFamily: 'Helvetica-Bold' }]}>
              {empleador.nombre_razon_social || '—'}
            </Text>
            <Text style={S.presente}>Presente.-</Text>
          </View>

          <View style={S.refLine}>
            <Text><Text style={S.refLabel}>Ref.:</Text><Text style={S.refValue}> RESPUESTA A SU NOTA</Text></Text>
          </View>

          <Text style={S.saludo}>De mi consideración:</Text>
          <Text style={S.parrafo}>
            En respuesta a su solicitud, comunicamos que la misma fue <Text style={{ fontFamily: 'Helvetica-Bold' }}>{estadoResultado}</Text> bajo el siguiente detalle:
          </Text>

          {/* Tabla FPC */}
          <View style={S.tHead}>
            <Text style={[S.tHCell, { width: '7%'  }]}>N°</Text>
            <Text style={[S.tHCell, { width: '28%' }]}>N° FPC</Text>
            <Text style={[S.tHCell, { width: '22%' }]}>Período</Text>
            <Text style={[S.tHCell, { width: '43%' }]}>Observación</Text>
          </View>
          {fpcs.length === 0 ? (
            <View style={S.tRow}>
              <Text style={[S.tCell, { width: '100%', color: '#888', fontStyle: 'italic' }]}>Sin formularios FPC registrados.</Text>
            </View>
          ) : fpcs.map((f, idx) => (
            <View key={idx} style={[S.tRow, idx % 2 === 1 ? S.tRowAlt : {}]}>
              <Text style={[S.tCell, { width: '7%',  color: '#999' }]}>{idx + 1}</Text>
              <Text style={[S.tCell, { width: '28%', fontFamily: 'Helvetica-Bold', fontSize: 7 }]}>{f.numero || '—'}</Text>
              <Text style={[S.tCell, { width: '22%' }]}>{f.periodo || '—'}</Text>
              <Text style={[S.tCell, { width: '43%' }]}>{f.observacion || ''}</Text>
            </View>
          ))}

          {/* Observación general */}
          {!!textoObservacion && (
            <Text style={[S.parrafo, { marginTop: 10 }]}>{textoObservacion}</Text>
          )}

          <Text style={S.cierre}>Atentamente,</Text>
          <View style={S.firmaArea}>
            <View style={S.firmaLine} />
            <Text style={S.firmaLabel}>{firmaNombre || 'Jefe(a) de Área'}</Text>
            {firmaCargo && <Text style={S.firmaSubLabel}>{firmaCargo}</Text>}
            <Text style={S.firmaSubLabel}>Gestora Pública de la Seguridad Social de Largo Plazo</Text>
          </View>

        </View>

        <Image src={`${BASE}/pdf_watermark.png`} style={S.watermark} />
        <Image src={`${BASE}/pdf_footer.png`}    style={S.footerImg} />

      </Page>
    </Document>
  )
}
