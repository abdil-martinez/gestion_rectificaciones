import React, { useState, useRef } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, Tabs, Tab, CircularProgress, Divider,
  Chip,
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { pdf } from '@react-pdf/renderer'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ORO, NAVY2 } from '../theme'
import NotificacionAsePDF from './NotificacionAsePDF'
import NotificacionEmpPDF from './NotificacionEmpPDF'
import { getDocumentosRespaldo, createDocumentoRespaldo, updateDocumentoRespaldo } from '../api/solicitudes'

const OBS_ASE = '__NOTIF_ASE__'
const OBS_EMP = '__NOTIF_EMP__'
const BASE_URL = 'http://localhost:8000'

const headSx = { py: 0.7, px: 1, color: ORO, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', borderBottom: `2px solid #2A3D6B`, whiteSpace: 'nowrap' }
const cellSx = { py: 0.6, px: 1, fontSize: '0.82rem', borderBottom: '1px solid #2A3D6B' }

function NotifForm({ tipo, sol, formularios, open, onClose }) {
  const isAse = tipo === 'ase'
  const [tab, setTab]         = useState(0)
  const [loading, setLoading] = useState(false)

  const [lugar,           setLugar]           = useState('La Paz')
  const [fecha,           setFecha]           = useState(dayjs().format('YYYY-MM-DD'))
  const [cite,            setCite]            = useState(`CITE-GNARC-${dayjs().format('YYYY')}-`)
  const [estadoResultado, setEstadoResultado] = useState('APROBADA')
  const [firmaNombre,     setFirmaNombre]     = useState('')
  const [firmaCargo,      setFirmaCargo]      = useState('')
  const [cargoRepLegal,   setCargoRepLegal]   = useState('')
  const [fpcsObs, setFpcsObs] = useState(
    (formularios || []).map((f) => ({ ...f, observacion: '' }))
  )

  const updateObs = (idx, val) =>
    setFpcsObs((rows) => rows.map((r, i) => i === idx ? { ...r, observacion: val } : r))

  const handleGenerar = async () => {
    setLoading(true)
    try {
      const commonData = { lugar, fecha, cite, estadoResultado, fpcs: fpcsObs, firmaNombre, firmaCargo }
      const blob = await pdf(
        isAse
          ? <NotificacionAsePDF data={{ ...commonData, asegurado: sol?.asegurado || {} }} />
          : <NotificacionEmpPDF data={{ ...commonData, empleador: { ...(sol?.empleador || {}), cargo_representante: cargoRepLegal } }} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href    = url
      a.download = `notificacion_${isAse ? 'asegurado' : 'empleador'}_${sol?.numero_solicitud || 'borrador'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Notificación ${isAse ? 'Asegurado' : 'Empleador'} generada`)
    } catch (e) {
      toast.error('Error al generar PDF: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        {isAse ? <PersonIcon sx={{ color: ORO }} /> : <BusinessIcon sx={{ color: ORO }} />}
        Notificación al {isAse ? 'Asegurado' : 'Empleador'}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          — {sol?.numero_solicitud}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ '& .Mui-selected': { color: `${ORO} !important` }, '& .MuiTabs-indicator': { backgroundColor: ORO } }}>
            <Tab label="Datos del documento" />
            <Tab label={`Observaciones FPC (${fpcsObs.length})`} />
          </Tabs>
        </Box>

        {tab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                Encabezado del documento
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 1.5, borderColor: '#2A3D6B' }} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField size="small" fullWidth label="Lugar" value={lugar} onChange={(e) => setLugar(e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField size="small" fullWidth label="Fecha" type="date" value={fecha}
                onChange={(e) => setFecha(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth label="CITE" value={cite} onChange={(e) => setCite(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" fullWidth label="Estado / Resultado de la solicitud"
                value={estadoResultado} onChange={(e) => setEstadoResultado(e.target.value)}
                helperText='Ej: APROBADA, RECHAZADA, OBSERVADA' />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                {isAse ? 'Datos del Asegurado (pre-llenados)' : 'Datos del Empleador (pre-llenados)'}
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 1.5, borderColor: '#2A3D6B' }} />
            </Grid>
            {isAse ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField size="small" fullWidth label="Nombre completo" disabled
                    value={[sol?.asegurado?.nombre, sol?.asegurado?.ap_paterno, sol?.asegurado?.ap_materno].filter(Boolean).join(' ') || '—'} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField size="small" fullWidth label="C.I." disabled value={sol?.asegurado?.cedula || '—'} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField size="small" fullWidth label="CUA" disabled value={sol?.asegurado?.cua || '—'} />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField size="small" fullWidth label="Razón Social" disabled value={sol?.empleador?.nombre_razon_social || '—'} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField size="small" fullWidth label="Representante Legal" disabled value={sol?.empleador?.nombre_representante_legal || '—'} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField size="small" fullWidth label="Cargo del Representante"
                    value={cargoRepLegal} onChange={(e) => setCargoRepLegal(e.target.value)}
                    placeholder="Ej: Gerente General" />
                </Grid>
              </>
            )}

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                Firma
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 1.5, borderColor: '#2A3D6B' }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" fullWidth label="Nombre del firmante" value={firmaNombre}
                onChange={(e) => setFirmaNombre(e.target.value)} placeholder="Ej: Juan Pérez López" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" fullWidth label="Cargo del firmante" value={firmaCargo}
                onChange={(e) => setFirmaCargo(e.target.value)} placeholder="Ej: Jefe de Área de Rectificaciones" />
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Ingrese la observación para cada formulario FPC que aparecerá en la notificación.
            </Typography>
            {fpcsObs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                Sin formularios FPC registrados en esta solicitud.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>N° FPC</TableCell>
                    <TableCell sx={headSx}>Período</TableCell>
                    <TableCell sx={headSx}>Observación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fpcsObs.map((f, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ ...cellSx, fontFamily: 'monospace', fontWeight: 600 }}>{f.numero || '—'}</TableCell>
                      <TableCell sx={cellSx}>{f.periodo || '—'}</TableCell>
                      <TableCell sx={{ ...cellSx, minWidth: 240 }}>
                        <TextField
                          size="small" fullWidth variant="standard"
                          placeholder="Observación..."
                          value={f.observacion}
                          onChange={(e) => updateObs(idx, e.target.value)}
                          inputProps={{ style: { fontSize: '0.82rem' } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleGenerar}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
          sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, '&:hover': { bgcolor: '#b8943e' } }}
        >
          {loading ? 'Generando…' : 'Generar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ── Fila de notificación: botón generar + botón subir firmado ─────── */
function NotifRow({ tipo, sol, formularios, solId, notifDocs, qc }) {
  const isAse     = tipo === 'ase'
  const obsKey    = isAse ? OBS_ASE : OBS_EMP
  const [open, setOpen]         = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef   = useRef(null)

  const existingDoc = notifDocs.find((d) => d.observacion === obsKey)

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('archivo', file)
      if (existingDoc) {
        await updateDocumentoRespaldo(existingDoc.id, fd)
      } else {
        fd.append('solicitud', solId)
        fd.append('observacion', obsKey)
        await createDocumentoRespaldo(fd)
      }
      qc.invalidateQueries(['docs-respaldo', solId])
      toast.success('Documento firmado adjuntado')
    } catch { toast.error('Error al subir el documento') }
    finally { setUploading(false) }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
      {/* Generar PDF */}
      <Button
        fullWidth variant="outlined" size="small"
        startIcon={isAse ? <PersonIcon /> : <BusinessIcon />}
        onClick={() => setOpen(true)}
        sx={{ borderColor: ORO, color: ORO, justifyContent: 'flex-start', px: 2,
          '&:hover': { bgcolor: `${ORO}18`, borderColor: ORO } }}
      >
        {isAse ? 'Generar Notif. Asegurado' : 'Generar Notif. Empleador'}
      </Button>

      {/* Subir documento firmado */}
      <Button
        fullWidth variant="outlined" size="small"
        startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />}
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        sx={{ borderColor: '#2A3D6B', color: 'text.secondary', justifyContent: 'flex-start', px: 2,
          '&:hover': { bgcolor: `${ORO}10`, borderColor: ORO, color: ORO } }}
      >
        {uploading
          ? 'Subiendo…'
          : existingDoc
            ? (isAse ? 'Reemplazar doc. Asegurado firmado' : 'Reemplazar doc. Empleador firmado')
            : (isAse ? 'Subir doc. Asegurado firmado' : 'Subir doc. Empleador firmado')}
      </Button>

      <input
        type="file"
        ref={fileRef}
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); e.target.value = '' }}
      />

      {existingDoc?.archivo && (
        <Chip
          size="small"
          icon={<AttachFileIcon sx={{ fontSize: '13px !important' }} />}
          label={isAse ? 'Ver notif. Aseg. firmada' : 'Ver notif. Empl. firmada'}
          component="a"
          href={`${BASE_URL}${existingDoc.archivo}`}
          target="_blank"
          clickable
          sx={{ bgcolor: `${ORO}22`, color: ORO, fontSize: '0.7rem', alignSelf: 'flex-start' }}
        />
      )}

      {open && (
        <NotifForm
          tipo={tipo} sol={sol} formularios={formularios}
          open onClose={() => setOpen(false)}
        />
      )}
    </Box>
  )
}

const NOTIF_CARDS = [
  { tipo: 'ase', accent: '#4C9FE8', label: 'Notificación Asegurado',  Icon: PersonIcon },
  { tipo: 'emp', accent: '#4CAF50', label: 'Notificación Empleador',   Icon: BusinessIcon },
]

/* ── Panel principal ────────────────────────────────────────────────── */
export default function NotificacionesPanel({ sol, formularios }) {
  const solId = sol?.id
  const qc    = useQueryClient()

  const { data: notifDocs = [] } = useQuery({
    queryKey: ['docs-respaldo', solId],
    queryFn:  () => getDocumentosRespaldo(solId).then((r) => r.data.results || r.data),
    enabled:  !!solId,
  })

  return (
    <Box sx={{
      border: '1px solid',
      borderColor: `${ORO}44`,
      borderTop: `3px solid ${ORO}`,
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      {/* Encabezado externo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5, py: 1, bgcolor: `${ORO}10`, borderBottom: `1px solid ${ORO}33` }}>
        <NotificationsIcon sx={{ fontSize: 15, color: ORO }} />
        <Typography variant="caption" fontWeight={700} sx={{ color: ORO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Notificaciones
        </Typography>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Genere la notificación y adjunte el documento firmado.
        </Typography>

        {NOTIF_CARDS.map(({ tipo, accent, label, Icon }) => (
          <Box
            key={tipo}
            sx={{
              border: '1px solid',
              borderColor: `${accent}44`,
              borderLeft: `4px solid ${accent}`,
              borderRadius: 1.5,
              p: 1.2,
              bgcolor: `${accent}0C`,
              transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
              '&:hover': {
                borderColor: `${accent}88`,
                boxShadow: `0 0 0 3px ${accent}22, 0 2px 10px ${accent}18`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1 }}>
              <Icon sx={{ fontSize: 15, color: accent }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </Typography>
            </Box>
            <NotifRow tipo={tipo} sol={sol} formularios={formularios} solId={solId} notifDocs={notifDocs} qc={qc} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
