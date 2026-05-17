import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, Chip, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Typography, IconButton, Tooltip,
  MenuItem, Select, FormControl, InputLabel, Grid, Stack,
  Checkbox, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getSolicitudes, exportarExcel, cambiarEstado } from '../../api/solicitudes'
import { getUsers } from '../../api/auth'
import catalogosApi from '../../api/catalogos'
import { StatusChip, PrioridadChip } from '../../components/common/StatusChip'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import { ORO } from '../../theme'
import toast from 'react-hot-toast'

const ESTADOS = [
  { value: 'BOR',  label: 'Borrador' },
  { value: 'PEND', label: 'Pendiente' },
  { value: 'ASIG', label: 'Asignado' },
  { value: 'REV',  label: 'En Revisión' },
  { value: 'APRO', label: 'Aprobado' },
  { value: 'RECH', label: 'Rechazado' },
  { value: 'DEV',  label: 'Devuelto' },
  { value: 'FIN',  label: 'Finalizado' },
  { value: 'ANU',  label: 'Anulado' },
]

export default function SolicitudList() {
  const navigate       = useNavigate()
  const qc             = useQueryClient()
  const { user }       = useAuthStore()
  const canBulkAssign  = ['ADMIN', 'SUPER'].includes(user?.rol)

  const [page, setPage]             = useState(0)
  const [rowsPerPage]               = useState(20)
  const [search, setSearch]         = useState('')
  const [estado, setEstado]         = useState('')
  const [prioridad, setPrioridad]   = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [tipoRegional, setTipoRegional] = useState('')
  const [regional, setRegional]         = useState('')
  const [exportLoading, setExportLoading] = useState(false)

  // Selección masiva
  const [selected, setSelected]     = useState([])
  const [asigOpen, setAsigOpen]     = useState(false)
  const [analistaId, setAnalistaId] = useState('')
  const [comentario, setComentario] = useState('')
  const [assigning, setAssigning]   = useState(false)

  const params = {
    page:                    page + 1,
    search:                  search       || undefined,
    estado:                  estado       || undefined,
    prioridad:               prioridad    || undefined,
    regional:                regional     || undefined,
    regional__tipo_regional: tipoRegional || undefined,
    fecha_desde:             fechaDesde   || undefined,
    fecha_hasta:             fechaHasta   || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['solicitudes', params],
    queryFn:  () => getSolicitudes(params).then((r) => r.data),
  })

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-asignacion'],
    queryFn:  () => getUsers({ is_active: true }).then((r) => r.data?.results || r.data),
    enabled:  asigOpen,
  })

  const { data: tiposRegionalData = [] } = useQuery({
    queryKey: ['tipo-regional'],
    queryFn:  () => catalogosApi.tipoRegional.getAll().then((r) => r.data.results || r.data),
    staleTime: 10 * 60_000,
  })
  const { data: regionalesData = [] } = useQuery({
    queryKey: ['regionales', tipoRegional],
    queryFn:  () => catalogosApi.regionales.getAll(
      tipoRegional ? { tipo_regional: tipoRegional } : {}
    ).then((r) => r.data.results || r.data),
  })

  const rows = data?.results || []

  // Checkboxes
  const allIds        = rows.map((r) => r.id)
  const allSelected   = allIds.length > 0 && allIds.every((id) => selected.includes(id))
  const someSelected  = selected.length > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) setSelected([])
    else setSelected(allIds)
  }

  const toggleOne = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  // Asignación masiva
  const handleBulkAssign = async () => {
    if (!analistaId) { toast.error('Debe seleccionar un analista'); return }
    if (!comentario.trim()) { toast.error('El comentario es obligatorio'); return }

    setAssigning(true)
    let ok = 0, fail = 0
    for (const id of selected) {
      try {
        await cambiarEstado(id, { estado: 'ASIG', comentario, analista_asignado: analistaId })
        ok++
      } catch {
        fail++
      }
    }
    setAssigning(false)
    qc.invalidateQueries(['solicitudes'])
    setSelected([])
    setAsigOpen(false)
    setComentario('')
    setAnalistaId('')
    if (fail === 0) toast.success(`${ok} solicitud(es) asignadas correctamente`)
    else if (ok === 0) toast.error(`Ninguna pudo asignarse. Solo solicitudes en estado Pendiente pueden asignarse.`)
    else toast.error(`${ok} asignadas. ${fail} no pudieron asignarse — deben estar en estado Pendiente.`)
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res  = await exportarExcel({ estado: estado || undefined, fecha_desde: fechaDesde || undefined, fecha_hasta: fechaHasta || undefined })
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `solicitudes_${dayjs().format('YYYYMMDD')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Exportación completada')
    } catch {
      toast.error('Error al exportar')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Solicitudes de Rectificación</Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.count ?? '—'} solicitudes registradas
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}
            disabled={exportLoading} size="small">
            Exportar Excel
          </Button>
          {['ADMIN', 'SUPER', 'ANALIST'].includes(user?.rol) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/solicitudes/nueva')}>
              Nueva Solicitud
            </Button>
          )}
        </Stack>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField fullWidth size="small" placeholder="Buscar por N°, asegurado, CI, CUA..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
            </Grid>
            <Grid item xs={6} sm={2} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select value={estado} label="Estado" onChange={(e) => { setEstado(e.target.value); setPage(0) }}>
                  <MenuItem value="">Todos</MenuItem>
                  {ESTADOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2} md={1}>
              <FormControl fullWidth size="small">
                <InputLabel>Prioridad</InputLabel>
                <Select value={prioridad} label="Prioridad" onChange={(e) => { setPrioridad(e.target.value); setPage(0) }}>
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="BAJA">Baja</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="ALTA">Alta</MenuItem>
                  <MenuItem value="URGENTE">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo Regional</InputLabel>
                <Select value={tipoRegional} label="Tipo Regional" onChange={(e) => { setTipoRegional(e.target.value); setRegional(''); setPage(0) }}>
                  <MenuItem value="">Todos</MenuItem>
                  {tiposRegionalData.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Regional</InputLabel>
                <Select value={regional} label="Regional" onChange={(e) => { setRegional(e.target.value); setPage(0) }}>
                  <MenuItem value="">Todas</MenuItem>
                  {regionalesData.map((r) => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2} md={1}>
              <TextField fullWidth size="small" label="Desde" type="date" InputLabelProps={{ shrink: true }}
                value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(0) }} />
            </Grid>
            <Grid item xs={6} sm={2} md={1}>
              <TextField fullWidth size="small" label="Hasta" type="date" InputLabelProps={{ shrink: true }}
                value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(0) }} />
            </Grid>
            <Grid item xs={12} sm={2} md={1}>
              <Button fullWidth variant="outlined" size="small"
                onClick={() => { setSearch(''); setEstado(''); setPrioridad(''); setTipoRegional(''); setRegional(''); setFechaDesde(''); setFechaHasta(''); setPage(0); setSelected([]) }}>
                Limpiar
              </Button>
            </Grid>
          </Grid>
          {/* Chips de filtros activos */}
          {(search || estado || prioridad || tipoRegional || regional || fechaDesde || fechaHasta) && (
            <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {search       && <Chip size="small" label={`Búsqueda: "${search}"`}     onDelete={() => { setSearch('');       setPage(0) }} />}
              {estado       && <Chip size="small" label={`Estado: ${ESTADOS.find((e) => e.value === estado)?.label || estado}`} onDelete={() => { setEstado('');       setPage(0) }} />}
              {prioridad    && <Chip size="small" label={`Prioridad: ${prioridad}`}   onDelete={() => { setPrioridad('');    setPage(0) }} />}
              {tipoRegional && <Chip size="small" label={`Tipo Regional: ${tiposRegionalData.find((t) => t.id === Number(tipoRegional))?.nombre || tipoRegional}`} onDelete={() => { setTipoRegional(''); setRegional(''); setPage(0) }} />}
              {regional     && <Chip size="small" label={`Regional: ${regionalesData.find((r) => r.id === Number(regional))?.nombre || regional}`} onDelete={() => { setRegional('');     setPage(0) }} />}
              {fechaDesde   && <Chip size="small" label={`Desde: ${fechaDesde}`}      onDelete={() => { setFechaDesde('');   setPage(0) }} />}
              {fechaHasta   && <Chip size="small" label={`Hasta: ${fechaHasta}`}      onDelete={() => { setFechaHasta('');   setPage(0) }} />}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Barra de acción masiva */}
      {canBulkAssign && selected.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, px: 2, py: 1.2,
          bgcolor: `${ORO}18`, border: `1px solid ${ORO}55`, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={700} sx={{ color: ORO }}>
            {selected.length} seleccionada(s)
          </Typography>
          <Button size="small" variant="contained" startIcon={<AssignmentReturnIcon />}
            onClick={() => setAsigOpen(true)}
            sx={{ bgcolor: ORO, color: '#0A1628', fontWeight: 700, '&:hover': { bgcolor: '#b8972d' } }}>
            Asignar a analista
          </Button>
          <Button size="small" variant="outlined" onClick={() => setSelected([])}
            sx={{ color: ORO, borderColor: ORO }}>
            Cancelar selección
          </Button>
        </Box>
      )}

      {/* Table */}
      <Card>
        {isLoading ? <LoadingSpinner message="Cargando solicitudes..." /> : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {canBulkAssign && (
                      <TableCell padding="checkbox" sx={{ width: 48 }}>
                        <Checkbox checked={allSelected} indeterminate={someSelected}
                          onChange={toggleAll} size="small"
                          sx={{ color: ORO, '&.Mui-checked': { color: ORO }, '&.MuiCheckbox-indeterminate': { color: ORO } }} />
                      </TableCell>
                    )}
                    <TableCell>N° Solicitud</TableCell>
                    <TableCell>Asegurado</TableCell>
                    <TableCell>CI</TableCell>
                    <TableCell>CUA</TableCell>
                    <TableCell>Tipo Causal</TableCell>
                    <TableCell>Tipo Regional</TableCell>
                    <TableCell>Regional</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Prioridad</TableCell>
                    <TableCell>Analista</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={canBulkAssign ? 13 : 12} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No se encontraron solicitudes con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((sol) => {
                    const isSelected = selected.includes(sol.id)
                    return (
                      <TableRow key={sol.id} selected={isSelected}
                        sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: `${ORO}0d` }, '&.Mui-selected:hover': { bgcolor: `${ORO}18` } }}
                        onClick={() => navigate(`/solicitudes/${sol.id}`)}>
                        {canBulkAssign && (
                          <TableCell padding="checkbox" onClick={(e) => { e.stopPropagation(); toggleOne(sol.id) }}>
                            <Checkbox checked={isSelected} size="small"
                              sx={{ color: ORO, '&.Mui-checked': { color: ORO } }} />
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: ORO, fontFamily: 'monospace' }}>
                            {sol.numero_solicitud}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{sol.asegurado_nombre}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{sol.asegurado_cedula}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{sol.asegurado_cua || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{sol.tipo_causal_nombre || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>{sol.tipo_regional_nombre || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{sol.regional_nombre || '—'}</Typography>
                        </TableCell>
                        <TableCell><StatusChip estado={sol.estado} /></TableCell>
                        <TableCell><PrioridadChip prioridad={sol.prioridad} /></TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{sol.analista_nombre || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {sol.created_at ? dayjs(sol.created_at).format('DD/MM/YYYY') : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => navigate(`/solicitudes/${sol.id}`)}>
                              <VisibilityIcon fontSize="small" sx={{ color: ORO }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={data?.count || 0} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} rowsPerPageOptions={[20]}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
              sx={{ borderTop: '1px solid #2A3D6B' }} />
          </>
        )}
      </Card>

      {/* Diálogo asignación masiva */}
      <Dialog open={asigOpen} onClose={() => { setAsigOpen(false); setAnalistaId(''); setComentario('') }} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          Asignación masiva — {selected.length} solicitud(es)
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Solo las solicitudes en estado <strong>Pendiente</strong> pueden asignarse.
            Las que estén en Borrador u otro estado serán ignoradas.
            Para pasar a Pendiente, abra la solicitud y haga clic en <strong>"Enviar"</strong>.
          </Alert>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Analista a asignar *</InputLabel>
            <Select value={analistaId} label="Analista a asignar *" onChange={(e) => setAnalistaId(e.target.value)}>
              {(Array.isArray(usuariosData) ? usuariosData : []).map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({u.rol})
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth multiline rows={3} label="Comentario (obligatorio)" value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            helperText="Se registrará en la bitácora de cada solicitud asignada." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setAsigOpen(false)} disabled={assigning} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleBulkAssign} disabled={assigning} variant="contained"
            startIcon={assigning ? <CircularProgress size={16} color="inherit" /> : <AssignmentReturnIcon />}
            sx={{ bgcolor: ORO, color: '#0A1628', fontWeight: 700, '&:hover': { bgcolor: '#b8972d' } }}>
            {assigning ? 'Asignando...' : `Asignar ${selected.length}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
