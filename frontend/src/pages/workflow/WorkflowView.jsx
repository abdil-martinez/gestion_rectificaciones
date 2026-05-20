import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, Typography, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Stack, Button,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getSolicitudes } from '../../api/solicitudes'
import catalogosApi from '../../api/catalogos'
import { StatusChip, PrioridadChip } from '../../components/common/StatusChip'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import { ORO } from '../../theme'

function PlazoIndicator({ fechaLimite, estado }) {
  if (!fechaLimite || ['FIN', 'ANU', 'APRO'].includes(estado)) {
    return <Typography variant="caption" color="text.secondary">—</Typography>
  }
  const diasRestantes = dayjs(fechaLimite).diff(dayjs(), 'day')

  if (diasRestantes < 0)
    return <Chip icon={<WarningIcon />} label={`${Math.abs(diasRestantes)}d vencida`} size="small"
      sx={{ bgcolor: '#b71c1c', color: '#fff', fontWeight: 700 }} />
  if (diasRestantes <= 3)
    return <Chip icon={<AccessTimeIcon />} label={`${diasRestantes}d restantes`} size="small"
      sx={{ bgcolor: '#e65100', color: '#fff', fontWeight: 600 }} />
  if (diasRestantes <= 7)
    return <Chip icon={<AccessTimeIcon />} label={`${diasRestantes}d restantes`} size="small"
      sx={{ bgcolor: '#f57c00', color: '#fff', fontWeight: 600 }} />
  return <Chip icon={<CheckCircleIcon />} label={`${diasRestantes}d restantes`} size="small"
    sx={{ bgcolor: '#1b5e20', color: '#fff', fontWeight: 500 }} />
}

const EMPTY_FILTERS = { search: '', prioridad: '', estado: '', tipo_regional: '', regional: '' }

export default function WorkflowView() {
  const navigate       = useNavigate()
  const { user }       = useAuthStore()
  const [tab, setTab]  = useState(0)
  const [filters, setFilters]       = useState(EMPTY_FILTERS)
  const [applied, setApplied]       = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(true)

  const isSuperAdmin = ['ADMIN', 'SUPER'].includes(user?.rol)

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const applyFilters  = () => setApplied({ ...filters })
  const clearFilters  = () => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS) }
  const hasActive     = Object.values(applied).some(Boolean)

  // Catálogos para filtros
  const { data: tiposRegional = [] } = useQuery({
    queryKey: ['tipo-regional'],
    queryFn:  () => catalogosApi.tipoRegional.getAll().then((r) => r.data.results || r.data),
    staleTime: 10 * 60_000,
  })
  const { data: regionales = [] } = useQuery({
    queryKey: ['regionales-all'],
    queryFn:  () => catalogosApi.regionales.getAll({
      page_size: 200,
      ...(applied.tipo_regional ? { tipo_regional: applied.tipo_regional } : {}),
    }).then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })

  // Queries de bandeja
  const myParams = {
    analista_asignado: user?.id,
    search:            applied.search    || undefined,
    prioridad:         applied.prioridad || undefined,
    estado:            applied.estado    || undefined,
    regional__tipo_regional: applied.tipo_regional || undefined,
    regional:          applied.regional  || undefined,
  }
  const pendParams = {
    estado:            applied.estado || 'PEND',
    search:            applied.search    || undefined,
    prioridad:         applied.prioridad || undefined,
    regional__tipo_regional: applied.tipo_regional || undefined,
    regional:          applied.regional  || undefined,
  }

  const { data: mySols, isLoading: loadingMy } = useQuery({
    queryKey: ['workflow-mis', user?.id, applied],
    queryFn:  () => getSolicitudes(myParams).then((r) => r.data),
    enabled:  tab === 0,
  })
  const { data: pendSols, isLoading: loadingPend } = useQuery({
    queryKey: ['workflow-pend', applied],
    queryFn:  () => getSolicitudes(pendParams).then((r) => r.data),
    enabled:  tab === 1 && isSuperAdmin,
  })

  const rows   = tab === 0 ? mySols?.results   : pendSols?.results
  const loading = tab === 0 ? loadingMy         : loadingPend

  const headSx = {
    py: 0.8, px: 1,
    color: ORO, fontWeight: 700, fontSize: '0.72rem',
    textTransform: 'uppercase', borderBottom: `2px solid #2A3D6B`,
    whiteSpace: 'nowrap',
  }
  const cellSx = { py: 0.7, px: 1, fontSize: '0.82rem', borderBottom: '1px solid #2A3D6B' }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Mi Bandeja de Trabajo</Typography>
          <Typography variant="body2" color="text.secondary">Gestione sus solicitudes asignadas</Typography>
        </Box>
        <Button
          size="small"
          variant={showFilters ? 'contained' : 'outlined'}
          startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
          onClick={() => setShowFilters((v) => !v)}
          sx={showFilters
            ? { bgcolor: ORO, color: '#0F1932', '&:hover': { bgcolor: '#b8943e' } }
            : { borderColor: ORO, color: ORO }}
        >
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
        </Button>
      </Box>

      {/* Panel de filtros */}
      {showFilters && (
        <Card sx={{ mb: 2, p: 2 }}>
          <Grid container spacing={1.5} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                size="small" fullWidth
                label="Buscar (N° solicitud, asegurado, CI)"
                value={filters.search}
                onChange={(e) => setF('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select value={filters.prioridad} label="Prioridad" onChange={(e) => setF('prioridad', e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="BAJA">Baja</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="ALTA">Alta</MenuItem>
                  <MenuItem value="URGENTE">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={filters.estado} label="Estado" onChange={(e) => setF('estado', e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="BOR">Borrador</MenuItem>
                  <MenuItem value="PEND">Pendiente</MenuItem>
                  <MenuItem value="ASIG">Asignado</MenuItem>
                  <MenuItem value="REV">En Revisión</MenuItem>
                  <MenuItem value="APRO">Rectificado</MenuItem>
                  <MenuItem value="RECH">Rechazado</MenuItem>
                  <MenuItem value="DEV">Devuelto</MenuItem>
                  <MenuItem value="FIN">Finalizado</MenuItem>
                  <MenuItem value="ANU">Anulado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo de Regional</InputLabel>
                <Select value={filters.tipo_regional} label="Tipo de Regional"
                  onChange={(e) => { setF('tipo_regional', e.target.value); setF('regional', '') }}>
                  <MenuItem value="">Todos</MenuItem>
                  {tiposRegional.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Regional</InputLabel>
                <Select value={filters.regional} label="Regional" onChange={(e) => setF('regional', e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {regionales
                    .filter((r) => !filters.tipo_regional || r.tipo_regional === Number(filters.tipo_regional))
                    .map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm="auto">
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={applyFilters}
                  sx={{ bgcolor: ORO, color: '#0F1932', '&:hover': { bgcolor: '#b8943e' }, whiteSpace: 'nowrap' }}>
                  Aplicar
                </Button>
                {hasActive && (
                  <Button variant="outlined" size="small" onClick={clearFilters}
                    sx={{ borderColor: ORO, color: ORO, whiteSpace: 'nowrap' }}>
                    Limpiar
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
          {hasActive && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {applied.search     && <Chip size="small" label={`Búsqueda: "${applied.search}"`} onDelete={() => { setF('search', ''); setApplied((a) => ({ ...a, search: '' })) }} />}
              {applied.prioridad  && <Chip size="small" label={`Prioridad: ${applied.prioridad}`} onDelete={() => { setF('prioridad', ''); setApplied((a) => ({ ...a, prioridad: '' })) }} />}
              {applied.estado     && <Chip size="small" label={`Estado: ${applied.estado}`} onDelete={() => { setF('estado', ''); setApplied((a) => ({ ...a, estado: '' })) }} />}
              {applied.tipo_regional && <Chip size="small" label={`Tipo Regional: ${tiposRegional.find((t) => t.id === Number(applied.tipo_regional))?.nombre || applied.tipo_regional}`} onDelete={() => { setF('tipo_regional', ''); setF('regional', ''); setApplied((a) => ({ ...a, tipo_regional: '', regional: '' })) }} />}
              {applied.regional   && <Chip size="small" label={`Regional: ${regionales.find((r) => r.id === Number(applied.regional))?.nombre || applied.regional}`} onDelete={() => { setF('regional', ''); setApplied((a) => ({ ...a, regional: '' })) }} />}
            </Box>
          )}
        </Card>
      )}

      {/* Tabla */}
      <Card>
        <Box sx={{ borderBottom: '1px solid #2A3D6B' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ '& .MuiTab-root': { fontWeight: 600 }, '& .Mui-selected': { color: `${ORO} !important` }, '& .MuiTabs-indicator': { backgroundColor: ORO } }}>
            <Tab label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>Mis Solicitudes</span>
                {mySols?.count > 0 && <Chip label={mySols.count} size="small" sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, height: 18, fontSize: 11 }} />}
              </Stack>
            } />
            {isSuperAdmin && (
              <Tab label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>Pendientes de Asignación</span>
                  {pendSols?.count > 0 && <Chip label={pendSols.count} size="small" sx={{ bgcolor: '#2196f3', color: '#fff', fontWeight: 700, height: 18, fontSize: 11 }} />}
                </Stack>
              } />
            )}
          </Tabs>
        </Box>

        {loading ? <LoadingSpinner message="Cargando bandeja..." /> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>N° Solicitud</TableCell>
                  <TableCell sx={headSx}>Asegurado</TableCell>
                  <TableCell sx={headSx}>CUA</TableCell>
                  <TableCell sx={headSx}>Causal</TableCell>
                  <TableCell sx={headSx}>Tipo Regional</TableCell>
                  <TableCell sx={headSx}>Regional</TableCell>
                  <TableCell sx={headSx}>Estado</TableCell>
                  <TableCell sx={headSx}>Prioridad</TableCell>
                  <TableCell sx={headSx}>Plazo</TableCell>
                  <TableCell sx={headSx}>Recepción</TableCell>
                  <TableCell sx={headSx} align="center">Ver</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!rows?.length ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay solicitudes en esta bandeja.
                    </TableCell>
                  </TableRow>
                ) : rows.map((sol) => (
                  <TableRow key={sol.id} hover
                    sx={{ cursor: 'pointer', bgcolor: sol.vencida ? '#2c000033' : 'transparent' }}
                    onClick={() => navigate(`/solicitudes/${sol.id}`)}>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: ORO, fontFamily: 'monospace' }}>
                        {sol.numero_solicitud}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" fontWeight={500}>{sol.asegurado_nombre || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{sol.asegurado_cedula || ''}</Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {sol.asegurado_cua || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2">{sol.tipo_causal_nombre || '—'}</Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                        {sol.tipo_regional_nombre || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" color="text.secondary">{sol.regional_nombre || '—'}</Typography>
                    </TableCell>
                    <TableCell sx={cellSx}><StatusChip estado={sol.estado} /></TableCell>
                    <TableCell sx={cellSx}><PrioridadChip prioridad={sol.prioridad} /></TableCell>
                    <TableCell sx={cellSx}>
                      <PlazoIndicator fechaLimite={sol.fecha_limite} estado={sol.estado} />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {sol.fecha_recepcion ? dayjs(sol.fecha_recepcion).format('DD/MM/YYYY') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx} align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => navigate(`/solicitudes/${sol.id}`)}>
                          <VisibilityIcon fontSize="small" sx={{ color: ORO }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  )
}
