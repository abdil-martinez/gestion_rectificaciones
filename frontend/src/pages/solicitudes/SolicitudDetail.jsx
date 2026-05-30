import React, { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, Grid, Typography,
  Chip, Stack, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, IconButton, Tooltip,
  List, ListItem, ListItemText, ListItemIcon,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody,
  Checkbox,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ReplayIcon from '@mui/icons-material/Replay'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import HistoryIcon from '@mui/icons-material/History'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import dayjs from 'dayjs'
import {
  getSolicitud, getBitacora, cambiarEstado, getTransiciones,
  getFormularios, createFormulario, updateFormulario, deleteFormulario,
  getDocumentosRespaldo, createDocumentoRespaldo, updateDocumentoRespaldo, deleteDocumentoRespaldo,
} from '../../api/solicitudes'
import catalogosApi from '../../api/catalogos'
import { getUsers } from '../../api/auth'
import { StatusChip, PrioridadChip } from '../../components/common/StatusChip'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import { ORO, NAVY2 } from '../../theme'
import toast from 'react-hot-toast'
import SolicitudPDF from '../../components/SolicitudPDF'
import NotificacionesPanel from '../../components/NotificacionesPanel'

const ACCION_ICONS = {
  RECT: { icon: <CheckCircleIcon />, color: '#4caf50' },
  RECH: { icon: <CancelIcon />,      color: '#f44336' },
  DEV:  { icon: <ReplayIcon />,      color: '#9c27b0' },
  FIN:  { icon: <CheckCircleIcon />, color: '#1b5e20' },
  PEND: { icon: <PlayArrowIcon />,   color: '#2196f3' },
  ASIG: { icon: <AssignmentReturnIcon />, color: '#ff9800' },
}

function FormulariosFPC({ solicitudId }) {
  const qc = useQueryClient()
  const fileInputRef = useRef(null)

  const { data: tiposPlanilla = [] } = useQuery({
    queryKey: ['tipo-planilla'],
    queryFn: () => catalogosApi.tipoPlanilla.getAll().then((r) => r.data.results || r.data),
  })

  const { data: formularios = [], isLoading } = useQuery({
    queryKey: ['formularios', solicitudId],
    queryFn: () => getFormularios(solicitudId).then((r) => r.data.results || r.data),
  })

  const emptyRow = () => ({ solicitud: solicitudId, numero: '', periodo: '', tipo_planilla: '', total_ganado: '' })
  const [newRows, setNewRows] = useState([])
  const [savingId, setSavingId] = useState(null)

  const addRow = () => setNewRows((r) => [...r, emptyRow()])
  const updateNewRow = (idx, field, val) =>
    setNewRows((rows) => rows.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const saveRow = async (row, idx) => {
    if (!row.periodo) { toast.error('El período es requerido'); return }
    if (!row.tipo_planilla) { toast.error('Debe seleccionar el Tipo de Planilla'); return }
    setSavingId(`new-${idx}`)
    try {
      await createFormulario({ ...row })
      setNewRows((rows) => rows.filter((_, i) => i !== idx))
      qc.invalidateQueries(['formularios', solicitudId])
      toast.success('Formulario guardado')
    } catch { toast.error('Error al guardar formulario') }
    finally { setSavingId(null) }
  }

  const deleteRow = async (id) => {
    setSavingId(id)
    try {
      await deleteFormulario(id)
      qc.invalidateQueries(['formularios', solicitudId])
      toast.success('Formulario eliminado')
    } catch { toast.error('Error al eliminar') }
    finally { setSavingId(null) }
  }

  const cellSx = { py: 0.8, px: 1, fontSize: '0.82rem', borderBottom: '1px solid #2A3D6B' }
  const headSx = { py: 0.8, px: 1, color: ORO, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid #2A3D6B', whiteSpace: 'nowrap' }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: ORO }}>
            Valores FPC — Formularios de Contribución ({formularios.length})
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addRow}
            sx={{ color: ORO, borderColor: ORO, '&:hover': { bgcolor: `${ORO}11` } }} variant="outlined">
            Agregar FPC
          </Button>
        </Box>
        {isLoading ? <CircularProgress size={20} /> : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['N°', 'N° FPC', 'Período', 'Tipo Planilla', 'Total Ganado (Bs.)', ''].map((h) => (
                    <TableCell key={h} sx={headSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {formularios.map((f, idx) => (
                  <TableRow key={f.id}>
                    <TableCell sx={cellSx}>{idx + 1}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 600, fontFamily: 'monospace' }}>{f.numero || '—'}</TableCell>
                    <TableCell sx={cellSx}>{f.periodo}</TableCell>
                    <TableCell sx={cellSx}>{f.tipo_planilla_nombre || '—'}</TableCell>
                    <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{parseFloat(f.total_ganado || 0).toFixed(2)}</TableCell>
                    <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => deleteRow(f.id)} disabled={savingId === f.id}>
                          {savingId === f.id ? <CircularProgress size={14} /> : <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {newRows.map((row, idx) => (
                  <TableRow key={`new-${idx}`} sx={{ bgcolor: '#0F1932' }}>
                    <TableCell sx={cellSx}>{formularios.length + idx + 1}</TableCell>
                    <TableCell sx={cellSx}>
                      <TextField size="small" variant="standard" placeholder="N° FPC" value={row.numero}
                        onChange={(e) => updateNewRow(idx, 'numero', e.target.value)}
                        inputProps={{ style: { fontSize: '0.82rem' } }} sx={{ width: 90 }} />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <TextField size="small" variant="standard" placeholder="YYYY-MM" value={row.periodo}
                        onChange={(e) => updateNewRow(idx, 'periodo', e.target.value)}
                        inputProps={{ style: { fontSize: '0.82rem' } }} sx={{ width: 90 }} />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Select size="small" variant="standard" value={row.tipo_planilla}
                        onChange={(e) => updateNewRow(idx, 'tipo_planilla', e.target.value)}
                        sx={{ fontSize: '0.82rem', minWidth: 140 }} displayEmpty>
                        <MenuItem value=""><em>Seleccionar</em></MenuItem>
                        {tiposPlanilla.map((t) => <MenuItem key={t.id} value={t.id} sx={{ fontSize: '0.82rem' }}>{t.nombre}</MenuItem>)}
                      </Select>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <TextField size="small" variant="standard" placeholder="0.00" value={row.total_ganado}
                        onChange={(e) => updateNewRow(idx, 'total_ganado', e.target.value)}
                        inputProps={{ style: { fontSize: '0.82rem', textAlign: 'right' } }} sx={{ width: 100 }} />
                    </TableCell>
                    <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Guardar">
                          <IconButton size="small" onClick={() => saveRow(row, idx)} disabled={savingId === `new-${idx}`}>
                            {savingId === `new-${idx}` ? <CircularProgress size={14} /> : <SaveIcon fontSize="small" sx={{ color: '#4caf50' }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton size="small" onClick={() => setNewRows((r) => r.filter((_, i) => i !== idx))}>
                            <CancelIcon fontSize="small" sx={{ color: '#f44336' }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!formularios.length && !newRows.length && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: 'text.secondary', fontSize: '0.85rem' }}>
                      Sin formularios registrados. Haga clic en "Agregar FPC" para ingresar los datos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

function DocumentosRespaldo({ solicitudId }) {
  const qc = useQueryClient()

  const { data: catalogosDocs = [] } = useQuery({
    queryKey: ['catalogo-documentos'],
    queryFn: () => catalogosApi.documentos.getAll().then((r) => r.data.results || r.data),
  })

  const { data: estadosDocs = [] } = useQuery({
    queryKey: ['estados-documentacion'],
    queryFn: () => catalogosApi.estadoDocumentacion.getAll().then((r) => r.data.results || r.data),
  })

  const { data: docsRespaldo = [], isLoading } = useQuery({
    queryKey: ['docs-respaldo', solicitudId],
    queryFn: () => getDocumentosRespaldo(solicitudId).then((r) => r.data.results || r.data),
  })

  const [uploading, setUploading] = useState(null)
  const fileRefs = useRef({})

  const estadoRecibido = estadosDocs.find((e) => e.nombre?.toLowerCase().includes('recibido')) || estadosDocs[0]

  const toggleDoc = async (doc) => {
    const tieneRespaldo = docsRespaldo.find((d) => d.documento === doc.id)
    if (tieneRespaldo) {
      await deleteDocumentoRespaldo(tieneRespaldo.id)
    } else {
      const fd = new FormData()
      fd.append('solicitud', solicitudId)
      fd.append('documento', doc.id)
      if (estadoRecibido) fd.append('estado_documentacion', estadoRecibido.id)
      await createDocumentoRespaldo(fd)
    }
    qc.invalidateQueries(['docs-respaldo', solicitudId])
  }

  const uploadFile = async (docId, file) => {
    const respaldo = docsRespaldo.find((d) => d.documento === docId)
    setUploading(docId)
    try {
      const fd = new FormData()
      fd.append('archivo', file)
      if (respaldo) {
        await updateDocumentoRespaldo(respaldo.id, fd)
      } else {
        fd.append('solicitud', solicitudId)
        fd.append('documento', docId)
        if (estadoRecibido) fd.append('estado_documentacion', estadoRecibido.id)
        await createDocumentoRespaldo(fd)
      }
      qc.invalidateQueries(['docs-respaldo', solicitudId])
      toast.success('Archivo adjuntado correctamente')
    } catch { toast.error('Error al subir archivo') }
    finally { setUploading(null) }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: ORO }}>
          Documentación de Respaldo ({docsRespaldo.length} / {catalogosDocs.length})
        </Typography>
        {isLoading ? <CircularProgress size={20} /> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Recibido', 'Código', 'Documento', 'Archivo adjunto', ''].map((h) => (
                  <TableCell key={h} sx={{ py: 0.8, px: 1, color: ORO, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid #2A3D6B' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {catalogosDocs.map((doc) => {
                const respaldo = docsRespaldo.find((d) => d.documento === doc.id)
                const checked  = !!respaldo
                return (
                  <TableRow key={doc.id} sx={{ '&:hover': { bgcolor: '#1a2844' } }}>
                    <TableCell sx={{ py: 0.5, px: 1, borderBottom: '1px solid #2A3D6B' }}>
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleDoc(doc)}
                        size="small"
                        sx={{ color: ORO, '&.Mui-checked': { color: ORO }, p: 0 }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.secondary', borderBottom: '1px solid #2A3D6B' }}>
                      {doc.codigo}
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.85rem', fontWeight: checked ? 600 : 400, borderBottom: '1px solid #2A3D6B' }}>
                      {doc.descripcion}
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, borderBottom: '1px solid #2A3D6B' }}>
                      {respaldo?.archivo ? (
                        <Chip
                          icon={<AttachFileIcon sx={{ fontSize: '14px !important' }} />}
                          label="Ver archivo"
                          size="small"
                          component="a"
                          href={`http://localhost:8000${respaldo.archivo}`}
                          target="_blank"
                          clickable
                          sx={{ bgcolor: `${ORO}22`, color: ORO, fontSize: '0.72rem' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">Sin archivo</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, borderBottom: '1px solid #2A3D6B' }}>
                      <input
                        type="file"
                        ref={(el) => { fileRefs.current[doc.id] = el }}
                        style={{ display: 'none' }}
                        onChange={(e) => e.target.files[0] && uploadFile(doc.id, e.target.files[0])}
                      />
                      <Tooltip title="Adjuntar archivo">
                        <IconButton
                          size="small"
                          onClick={() => fileRefs.current[doc.id]?.click()}
                          disabled={uploading === doc.id}
                        >
                          {uploading === doc.id
                            ? <CircularProgress size={14} />
                            : <UploadFileIcon fontSize="small" sx={{ color: checked ? ORO : 'text.disabled' }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

const NOTIF_KEYS = ['__NOTIF_ASE__', '__NOTIF_EMP__']

function DocsSidebar({ solicitudId, sol }) {
  const [pdfLoading, setPdfLoading]     = useState(false)
  const [uploading,  setUploading]      = useState(false)
  const [descripcion, setDescripcion]   = useState('')
  const fileRef = useRef(null)
  const qc = useQueryClient()

  const { data: docsRespaldo = [] } = useQuery({
    queryKey: ['docs-respaldo', solicitudId],
    queryFn: () => getDocumentosRespaldo(solicitudId).then((r) => r.data.results || r.data),
  })
  const { data: formularios = [] } = useQuery({
    queryKey: ['formularios', solicitudId],
    queryFn: () => getFormularios(solicitudId).then((r) => r.data.results || r.data),
  })
  const { data: tiposPlanilla = [] } = useQuery({
    queryKey: ['tipo-planilla'],
    queryFn: () => catalogosApi.tipoPlanilla.getAll().then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })
  const { data: tiposCausal = [] } = useQuery({
    queryKey: ['tipo-causal'],
    queryFn: () => catalogosApi.tipoCausal.getAll().then((r) => r.data.results || r.data),
    staleTime: 10 * 60_000,
  })
  const { data: regionales = [] } = useQuery({
    queryKey: ['regionales-all'],
    queryFn: () => catalogosApi.regionales.getAll({ page_size: 200 }).then((r) => r.data.results || r.data),
    staleTime: 10 * 60_000,
  })
  const { data: catalogosDocs = [] } = useQuery({
    queryKey: ['catalogo-documentos'],
    queryFn: () => catalogosApi.documentos.getAll().then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })

  const handleDescargarPDF = async () => {
    setPdfLoading(true)
    try {
      const fpcRows = formularios.map((f) => ({
        numero:        f.numero,
        periodo:       f.periodo,
        tipo_planilla: f.tipo_planilla,
        total_ganado:  f.total_ganado,
      }))
      const docsChecked = docsRespaldo.map((d) => [
        String(d.documento),
        { file: null },
      ])
      const values = {
        asegurado_data:  sol.asegurado  || {},
        empleador_data:  sol.empleador  || {},
        tipo_causal:     sol.tipo_causal,
        regional:        sol.regional,
        prioridad:       sol.prioridad,
        fecha_recepcion: sol.fecha_recepcion,
        fecha_limite:    sol.fecha_limite,
        detalle_causal:  sol.detalle_causal,
      }
      const blob = await pdf(
        <SolicitudPDF
          values={values}
          fpcRows={fpcRows}
          docsChecked={docsChecked}
          tiposPlanilla={tiposPlanilla}
          catalogosDocs={catalogosDocs}
          tiposCausal={tiposCausal}
          regionales={regionales}
          numero={sol.numero_solicitud}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `solicitud_${sol.numero_solicitud}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('Error al generar PDF: ' + e.message)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <Box sx={{
      border: '1px solid',
      borderColor: `${ORO}44`,
      borderTop: `3px solid ${ORO}`,
      borderRadius: 2,
      overflow: 'hidden',
    }}>

      {/* ── Encabezado del bloque externo ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5, py: 1, bgcolor: `${ORO}10`, borderBottom: `1px solid ${ORO}33` }}>
        <AttachFileIcon sx={{ fontSize: 15, color: ORO }} />
        <Typography variant="caption" fontWeight={700} sx={{ color: ORO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Documentos adjuntos
        </Typography>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* ── Sub-bloque: lista + descargar ── */}
        <Box sx={{
          border: '1px solid',
          borderColor: `${ORO}33`,
          borderRadius: 1.5,
          p: 1.2,
          bgcolor: `${ORO}05`,
        }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={pdfLoading ? <CircularProgress size={14} /> : <PictureAsPdfIcon />}
            disabled={pdfLoading}
            onClick={handleDescargarPDF}
            sx={{ mb: 1.5, borderColor: ORO, color: ORO, '&:hover': { borderColor: ORO, bgcolor: `${ORO}18` } }}
          >
            {pdfLoading ? 'Generando…' : 'Descargar Solicitud PDF'}
          </Button>

          {(() => {
            const visibles = docsRespaldo.filter((d) => !NOTIF_KEYS.includes(d.observacion))
            if (visibles.length === 0) {
              return (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Sin documentos adjuntos.
                </Typography>
              )
            }
            return (
              <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
                {visibles.map((doc) => {
                  const info = doc.documento ? catalogosDocs.find((d) => d.id === doc.documento) : null
                  const label = info?.descripcion || info?.nombre
                    || (doc.observacion && !NOTIF_KEYS.includes(doc.observacion) ? doc.observacion : null)
                    || `Documento #${doc.id}`
                  return (
                    <Box
                      key={doc.id}
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 1, borderBottom: '1px solid #2A3D6B' }}
                    >
                      <AttachFileIcon sx={{ fontSize: 16, color: ORO, mt: 0.3, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{label}</Typography>
                        {info?.codigo && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {info.codigo}
                          </Typography>
                        )}
                        {doc.archivo ? (
                          <Box>
                            <Chip
                              label="Ver / Descargar"
                              size="small"
                              component="a"
                              href={`http://localhost:8000${doc.archivo}`}
                              target="_blank"
                              clickable
                              icon={<AttachFileIcon sx={{ fontSize: '13px !important' }} />}
                              sx={{ mt: 0.5, bgcolor: `${ORO}22`, color: ORO, fontSize: '0.7rem' }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">Sin archivo</Typography>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            )
          })()}
        </Box>

        {/* ── Sub-bloque: Seleccionar archivo ── */}
        <Box sx={{
          border: '2px dashed',
          borderColor: `${ORO}55`,
          borderRadius: 1.5,
          p: 1.2,
          bgcolor: `${ORO}04`,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: ORO,
            boxShadow: `0 0 0 3px ${ORO}1A`,
          },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
            <UploadFileIcon sx={{ fontSize: 15, color: ORO }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: ORO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Subir documento adicional
            </Typography>
          </Box>
        <TextField
          size="small" fullWidth
          label="Descripción del documento"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          sx={{ mb: 1 }}
        />
        <input
          type="file"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files[0]
            e.target.value = ''
            if (!file) return
            setUploading(true)
            try {
              const fd = new FormData()
              fd.append('archivo', file)
              fd.append('solicitud', solicitudId)
              if (descripcion.trim()) fd.append('observacion', descripcion.trim())
              await createDocumentoRespaldo(fd)
              qc.invalidateQueries(['docs-respaldo', solicitudId])
              setDescripcion('')
              toast.success('Documento adjuntado')
            } catch {
              toast.error('Error al subir el documento')
            } finally {
              setUploading(false)
            }
          }}
        />
        <Button
          fullWidth size="small" variant="outlined"
          startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          sx={{ borderColor: ORO, color: ORO, '&:hover': { borderColor: ORO, bgcolor: `${ORO}18` } }}
        >
          {uploading ? 'Subiendo…' : 'Seleccionar archivo'}
        </Button>
        </Box>

      </Box>

    </Box>
  )
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

  const [cambioOpen, setCambioOpen]         = useState(false)
  const [nuevoEstado, setNuevoEstado]       = useState('')
  const [comentario, setComentario]         = useState('')
  const [analistaId, setAnalistaId]         = useState('')
  const [tipoRegionalAsig, setTipoRegionalAsig] = useState('')
  const [saving, setSaving]                 = useState(false)

  const { data: sol, isLoading } = useQuery({
    queryKey: ['solicitud', id],
    queryFn:  () => getSolicitud(id).then((r) => r.data),
  })

  const { data: formularios = [] } = useQuery({
    queryKey: ['formularios', id],
    queryFn:  () => getFormularios(id).then((r) => r.data.results || r.data),
    enabled:  !!sol,
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

  const { data: tiposRegionalData = [] } = useQuery({
    queryKey: ['tipo-regional'],
    queryFn:  () => catalogosApi.tipoRegional.getAll().then((r) => r.data.results || r.data),
    staleTime: 10 * 60_000,
  })

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-asignacion', tipoRegionalAsig],
    queryFn:  () => getUsers({
      is_active: true,
      ...(tipoRegionalAsig ? { tipo_regional: tipoRegionalAsig } : {}),
    }).then((r) => r.data?.results || r.data),
    enabled:  nuevoEstado === 'ASIG',
  })

  const transiciones = transicionesData?.transiciones || []

  const BOTON_TRANSICION = {
    PEND: { label: 'Enviar',      color: 'info',    icon: <PlayArrowIcon /> },
    ASIG: { label: 'Asignar',     color: 'warning', icon: <AssignmentReturnIcon /> },
    REV:  { label: 'En Revisión', color: 'warning', icon: <PlayArrowIcon /> },
    RECT: { label: 'Rectificar',  color: 'success', icon: <CheckCircleIcon /> },
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
    if (nuevoEstado === 'ASIG' && !analistaId) {
      toast.error('Debe seleccionar un analista para asignar la solicitud.')
      return
    }
    setSaving(true)
    try {
      const payload = { estado: nuevoEstado, comentario }
      if (nuevoEstado === 'ASIG') payload.analista_asignado = analistaId
      await cambiarEstado(id, payload)
      await queryClient.invalidateQueries(['solicitud', id])
      await queryClient.invalidateQueries(['bitacora', id])
      await queryClient.invalidateQueries(['transiciones', id])
      toast.success('Estado actualizado correctamente')
      setCambioOpen(false)
      setComentario('')
      setNuevoEstado('')
      setAnalistaId('')
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
              <InfoRow label="Creador" value={sol.usuario_creador_nombre} />
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

        {/* Formularios FPC */}
        <Grid item xs={12}>
          <FormulariosFPC solicitudId={sol.id} />
        </Grid>

        {/* Documentos de Respaldo */}
        <Grid item xs={12}>
          <DocumentosRespaldo solicitudId={sol.id} />
        </Grid>

        {/* Historial + Documentos adjuntos */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2.5}>

                {/* Columna izquierda: Bitácora */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HistoryIcon sx={{ color: ORO }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: ORO }}>
                      Historial / Bitácora
                    </Typography>
                  </Box>
                  {bitacora.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">Sin entradas de bitácora.</Typography>
                  ) : (
                    <Box sx={{ maxHeight: 420, overflowY: 'auto', pr: 1 }}>
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
                                width: 32, height: 32, borderRadius: '50%',
                                bgcolor: `${icon.color}22`, color: icon.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, '& svg': { fontSize: 16 },
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
                </Grid>

                {/* Columna derecha: Documentos adjuntos + PDF */}
                <Grid item xs={12} md={5}>
                  <Divider orientation="vertical" sx={{ display: { xs: 'none', md: 'block' }, borderColor: '#2A3D6B', position: 'absolute', left: 0, top: 0, bottom: 0 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FolderOpenIcon sx={{ color: ORO }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: ORO }}>
                      Documentos Adjuntos
                    </Typography>
                  </Box>
                  <DocsSidebar solicitudId={sol.id} sol={sol} />

                  <Divider sx={{ my: 2.5, borderColor: '#2A3D6B' }} />
                  <NotificacionesPanel sol={sol} formularios={formularios} />
                </Grid>

              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change State Dialog */}
      <Dialog open={cambioOpen} onClose={() => { setCambioOpen(false); setComentario(''); setAnalistaId(''); setTipoRegionalAsig('') }} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {BOTON_TRANSICION[nuevoEstado]?.label || nuevoEstado} — SOL-{sol.numero_solicitud}
        </DialogTitle>
        <DialogContent>
          {nuevoEstado === 'FIN' && sol.estado === 'RECT' ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Está a punto de <strong>finalizar</strong> una solicitud rectificada.
              Asegúrese de haber emitido las <strong>notificaciones al asegurado y empleador</strong> antes de continuar.
            </Alert>
          ) : nuevoEstado === 'FIN' && sol.estado === 'RECH' ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Está a punto de <strong>finalizar</strong> una solicitud rechazada.
              Asegúrese de haber emitido la <strong>nota de rechazo</strong> antes de continuar.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              Esta acción cambiará el estado de la solicitud <strong>{sol.numero_solicitud}</strong>.
              Quedará registrada en la bitácora.
            </Alert>
          )}
          {nuevoEstado === 'ASIG' && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Filtrar por tipo de regional</InputLabel>
                <Select
                  value={tipoRegionalAsig}
                  label="Filtrar por tipo de regional"
                  onChange={(e) => { setTipoRegionalAsig(e.target.value); setAnalistaId('') }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {tiposRegionalData.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Analista a asignar *</InputLabel>
                <Select
                  value={analistaId}
                  label="Analista a asignar *"
                  onChange={(e) => setAnalistaId(e.target.value)}
                  error={!analistaId && saving}
                >
                  {(Array.isArray(usuariosData) ? usuariosData : []).map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.first_name || u.last_name
                        ? `${u.first_name} ${u.last_name}`.trim()
                        : u.username}
                      {' '}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({u.rol}) {u.tipo_regional_nombre ? `· ${u.tipo_regional_nombre}` : ''}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
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
