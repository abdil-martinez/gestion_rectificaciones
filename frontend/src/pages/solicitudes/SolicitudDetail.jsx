import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, Grid, Typography,
  Chip, Stack, Divider, Timeline, TimelineItem, TimelineSeparator,
  TimelineConnector, TimelineContent, TimelineDot,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, IconButton, Tooltip,
  List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ReplayIcon from '@mui/icons-material/Replay'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import HistoryIcon from '@mui/icons-material/History'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getSolicitud, getBitacora, cambiarEstado, getTransiciones } from '../../api/solicitudes'
import { StatusChip, PrioridadChip } from '../../components/common/StatusChip'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import { ORO, NAVY2 } from '../../theme'
import toast from 'react-hot-toast'

const ACCION_ICONS = {
  APRO: { icon: <CheckCircleIcon />, color: '#4caf50' },
  RECH: { icon: <CancelIcon />,      color: '#f44336' },
  DEV:  { icon: <ReplayIcon />,      color: '#9c27b0' },
  FIN:  { icon: <CheckCircleIcon />, color: '#1b5e20' },
  PEND: { icon: <PlayArrowIcon />,   color: '#2196f3' },
  ASIG: { icon: <AssignmentReturnIcon />, color: '#ff9800' },
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', py: 0.8, borderBottom: '1px solid #2A3D6B' }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  )
}

export default function SolicitudDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuthStore()
  const queryClient  = useQueryClient()

  const [cambioOpen, setCambioOpen]   = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [comentario, setComentario]   = useState('')
  const [saving, setSaving]           = useState(false)

  const { data: sol, isLoading } = useQuery({
    queryKey: ['solicitud', id],
    queryFn:  () => getSolicitud(id).then((r) => r.data),
  })

  const { data: bitacora = [] } = useQuery({
    queryKey: ['bitacora', id],
    queryFn:  () => getBitacora(id).then((r) => r.data),
  })

  const { data: transicionesData } = useQuery({
    queryKey: ['transiciones', id],
    queryFn:  () => getTransiciones(id).then((r) => r.data),
    enabled:  !!sol,
  })

  const transiciones = transicionesData?.transiciones || []

  const BOTON_TRANSICION = {
    PEND: { label: 'Enviar',      color: 'info',    icon: <PlayArrowIcon /> },
    ASIG: { label: 'Asignar',     color: 'warning', icon: <AssignmentReturnIcon /> },
    REV:  { label: 'En Revisión', color: 'warning', icon: <PlayArrowIcon /> },
    APRO: { label: 'Aprobar',     color: 'success', icon: <CheckCircleIcon /> },
    RECH: { label: 'Rechazar',    color: 'error',   icon: <CancelIcon /> },
    DEV:  { label: 'Devolver',    color: 'secondary',icon: <ReplayIcon /> },
    FIN:  { label: 'Finalizar',   color: 'success', icon: <CheckCircleIcon /> },
    ANU:  { label: 'Anular',      color: 'error',   icon: <CancelIcon /> },
  }

  const handleCambiarEstado = async () => {
    if (!comentario.trim()) {
      toast.error('El comentario es obligatorio para cambiar el estado.')
      return
    }
    setSaving(true)
    try {
      await cambiarEstado(id, { estado: nuevoEstado, comentario })
      await queryClient.invalidateQueries(['solicitud', id])
      await queryClient.invalidateQueries(['bitacora', id])
      await queryClient.invalidateQueries(['transiciones', id])
      toast.success('Estado actualizado correctamente')
      setCambioOpen(false)
      setComentario('')
      setNuevoEstado('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cambiar estado')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner message="Cargando solicitud..." fullHeight />
  if (!sol) return <Alert severity="error">Solicitud no encontrada.</Alert>

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/solicitudes')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: ORO }}>
              SOL-{sol.numero_solicitud}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <StatusChip estado={sol.estado} size="medium" />
              <PrioridadChip prioridad={sol.prioridad} size="medium" />
              {sol.vencida && (
                <Chip label="VENCIDA" size="small" sx={{ bgcolor: '#b71c1c', color: '#fff', fontWeight: 700 }} />
              )}
            </Stack>
          </Box>
        </Box>

        {/* Action buttons */}
        {transiciones.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {transiciones.map((est) => {
              const btn = BOTON_TRANSICION[est]
              if (!btn) return null
              return (
                <Button
                  key={est}
                  variant="contained"
                  color={btn.color}
                  size="small"
                  startIcon={btn.icon}
                  onClick={() => { setNuevoEstado(est); setCambioOpen(true) }}
                >
                  {btn.label}
                </Button>
              )
            })}
          </Stack>
        )}
      </Box>

      <Grid container spacing={2.5}>
        {/* Asegurado */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: ORO }}>
                Datos del Asegurado
              </Typography>
              <InfoRow label="Nombre completo" value={sol.asegurado?.nombre_completo} />
              <InfoRow label="Cédula de identidad" value={sol.asegurado?.cedula} />
              <InfoRow label="CUA" value={sol.asegurado?.cua} />
              <InfoRow label="Tipo de persona" value={sol.asegurado?.tipo_persona} />
              <InfoRow label="Celular" value={sol.asegurado?.celular} />
              <InfoRow label="Email" value={sol.asegurado?.email} />
            </CardContent>
          </Card>
        </Grid>

        {/* Empleador */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: ORO }}>
                Datos del Empleador
              </Typography>
              {sol.empleador ? (
                <>
                  <InfoRow label="Razón social" value={sol.empleador?.nombre_razon_social} />
                  <InfoRow label="Tipo empleador" value={sol.empleador?.tipo_empleador} />
                  <InfoRow label="NIT" value={sol.empleador?.nit} />
                  <InfoRow label="Representante legal" value={sol.empleador?.nombre_representante_legal} />
                </>
              ) : (
                <Typography color="text.secondary" variant="body2">Sin empleador registrado.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Detalles rectificación */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: ORO }}>
                Detalle de la Rectificación
              </Typography>
              <InfoRow label="Tipo de solicitud" value={sol.tipo_solicitud_nombre} />
              <InfoRow label="Tipo de causal" value={sol.tipo_causal_nombre} />
              <InfoRow label="Regional" value={sol.regional_nombre} />
              <InfoRow label="Analista asignado" value={sol.analista_nombre} />
              <InfoRow label="Fecha de recepción" value={sol.fecha_recepcion ? dayjs(sol.fecha_recepcion).format('DD/MM/YYYY') : null} />
              <InfoRow label="Fecha límite" value={sol.fecha_limite ? dayjs(sol.fecha_limite).format('DD/MM/YYYY') : null} />
              <InfoRow label="Monto total" value={sol.monto_total ? `Bs. ${parseFloat(sol.monto_total).toFixed(2)}` : null} />
              {sol.detalle_causal && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Detalle / Observaciones
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: '#0F1932', borderRadius: 2 }}>
                    {sol.detalle_causal}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Formularios */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: ORO }}>
                Formularios ({sol.formularios?.length || 0})
              </Typography>
              {sol.formularios?.length ? (
                <List dense disablePadding>
                  {sol.formularios.map((form) => (
                    <React.Fragment key={form.id}>
                      <ListItem disablePadding sx={{ py: 0.8 }}>
                        <ListItemText
                          primary={`Form ${form.numero || '—'} | Período: ${form.periodo}`}
                          secondary={`${form.tipo_planilla_nombre || '—'} | Monto: Bs. ${parseFloat(form.monto_pago || 0).toFixed(2)}`}
                          primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                          secondaryTypographyProps={{ fontSize: '0.78rem' }}
                        />
                      </ListItem>
                      <Divider sx={{ borderColor: '#2A3D6B' }} />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" variant="body2">Sin formularios registrados.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Documentos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: ORO }}>
                Documentos de Respaldo ({sol.documentos_respaldo?.length || 0})
              </Typography>
              {sol.documentos_respaldo?.length ? (
                <List dense disablePadding>
                  {sol.documentos_respaldo.map((doc) => (
                    <ListItem
                      key={doc.id}
                      disablePadding
                      sx={{ py: 0.6 }}
                      secondaryAction={
                        doc.archivo && (
                          <Tooltip title="Descargar">
                            <IconButton
                              size="small"
                              component="a"
                              href={`http://localhost:8000${doc.archivo}`}
                              target="_blank"
                            >
                              <AttachFileIcon fontSize="small" sx={{ color: ORO }} />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <AttachFileIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.documento_nombre || `Documento #${doc.id}`}
                        secondary={doc.estado_doc_nombre || '—'}
                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                        secondaryTypographyProps={{ fontSize: '0.78rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" variant="body2">Sin documentos adjuntos.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bitácora */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HistoryIcon sx={{ color: ORO }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: ORO }}>
                  Historial / Bitácora
                </Typography>
              </Box>
              {bitacora.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Sin entradas de bitácora.</Typography>
              ) : (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {bitacora.map((entry, idx) => {
                    const icon = ACCION_ICONS[entry.estado_nuevo] || { icon: <PlayArrowIcon />, color: ORO }
                    return (
                      <Box
                        key={entry.id}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          pb: 2,
                          mb: idx < bitacora.length - 1 ? 2 : 0,
                          borderBottom: idx < bitacora.length - 1 ? '1px solid #2A3D6B' : 'none',
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: `${icon.color}22`,
                            color: icon.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            '& svg': { fontSize: 16 },
                          }}
                        >
                          {icon.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {entry.estado_anterior_label
                                ? `${entry.estado_anterior_label} → ${entry.estado_nuevo_label}`
                                : entry.estado_nuevo_label || entry.accion}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(entry.created_at).format('DD/MM/YYYY HH:mm')}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Por: {entry.usuario_nombre}
                          </Typography>
                          {entry.comentario && (
                            <Typography
                              variant="body2"
                              sx={{ mt: 0.5, p: 1, bgcolor: '#0F1932', borderRadius: 1.5, fontSize: '0.82rem' }}
                            >
                              {entry.comentario}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change State Dialog */}
      <Dialog open={cambioOpen} onClose={() => setCambioOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          Cambiar estado a: {nuevoEstado}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta acción cambiará el estado de la solicitud <strong>{sol.numero_solicitud}</strong>.
            Esta acción quedará registrada en la bitácora.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comentario (obligatorio)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            required
            error={!comentario.trim() && saving}
            helperText="Describa brevemente el motivo del cambio de estado."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCambioOpen(false)} disabled={saving} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleCambiarEstado}
            disabled={saving}
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Procesando...' : 'Confirmar cambio'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
