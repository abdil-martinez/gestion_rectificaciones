import React, { useState } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, Tabs, Tab, CircularProgress, Divider,
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import { pdf } from '@react-pdf/renderer'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { ORO, NAVY2 } from '../theme'
import NotificacionAsePDF from './NotificacionAsePDF'
import NotificacionEmpPDF from './NotificacionEmpPDF'

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
            {/* Encabezado del documento */}
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

            {/* Datos del destinatario (solo lectura) */}
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

            {/* Firma */}
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

export default function NotificacionesPanel({ sol, formularios }) {
  const [openAse, setOpenAse] = useState(false)
  const [openEmp, setOpenEmp] = useState(false)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <NotificationsIcon sx={{ color: ORO }} />
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: ORO }}>
          Notificaciones
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Genere la notificación oficial de respuesta a la solicitud.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          fullWidth variant="outlined"
          startIcon={<PersonIcon />}
          onClick={() => setOpenAse(true)}
          sx={{ borderColor: ORO, color: ORO, justifyContent: 'flex-start', px: 2,
            '&:hover': { bgcolor: `${ORO}18`, borderColor: ORO } }}
        >
          Notif. Asegurado
        </Button>
        <Button
          fullWidth variant="outlined"
          startIcon={<BusinessIcon />}
          onClick={() => setOpenEmp(true)}
          sx={{ borderColor: ORO, color: ORO, justifyContent: 'flex-start', px: 2,
            '&:hover': { bgcolor: `${ORO}18`, borderColor: ORO } }}
        >
          Notif. Empleador
        </Button>
      </Box>

      <NotifForm tipo="ase" sol={sol} formularios={formularios} open={openAse} onClose={() => setOpenAse(false)} />
      <NotifForm tipo="emp" sol={sol} formularios={formularios} open={openEmp} onClose={() => setOpenEmp(false)} />
    </Box>
  )
}
