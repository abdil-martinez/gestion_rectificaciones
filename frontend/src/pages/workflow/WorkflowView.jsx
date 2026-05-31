import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, Typography, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Stack, Button,
  Checkbox, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getSolicitudes, reasignarSolicitudes } from '../../api/solicitudes'
import catalogosApi from '../../api/catalogos'
import api from '../../api/axios'
import { StatusChip, PrioridadChip } from '../../components/common/StatusChip'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import { ORO } from '../../theme'

function PlazoIndicator({ fechaLimite, estado }) {
  if (!fechaLimite || ['FIN', 'RECT'].includes(estado)) {
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

const EMPTY_FILTERS = {
  search: '', prioridad: '', estado: '', tipo_regional: '', regional: '', agencia: '', analista: '',
}

export default function WorkflowView() {
  const navigate    = useNavigate()
  const { user }    = useAuthStore()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(0)
  const [filters, setFilters]         = useState(EMPTY_FILTERS)
  const [applied, setApplied]         = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(true)
  const [selected, setSelected]       = useState(new Set())
  const [showReasignar, setShowReasignar] = useState(false)
  const [nuevoAnalistaId, setNuevoAnalistaId] = useState('')

  const isSuperAdmin = ['ADMIN', 'SUPER'].includes(user?.rol)

  const TAB_TODAS      = 0
  const TAB_ASIGNADAS  = isSuperAdmin ? 1 : -1
  const TAB_PENDIENTES = isSuperAdmin ? 2 : -1

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const applyFilters  = () => setApplied({ ...filters })
  const clearFilters  = () => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS) }
  const hasActive     = Object.values(applied).some(Boolean)

  const handleTabChange = (_, v) => { setTab(v); setSelected(new Set()) }

  // ── Catálogos ────────────────────────────────────────────────────────────────
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
  const { data: agencias = [] } = useQuery({
    queryKey: ['agencias-wf', filters.regional],
    queryFn:  () => catalogosApi.agencias.getAll({ regional: filters.regional }).then((r) => r.data.results || r.data),
    enabled:  !!filters.regional,
    staleTime: 5 * 60_000,
  })
  // Analistas del mismo tipo_regional para filtro "Ver de" y reasignación
  const { data: analysts = [] } = useQuery({
    queryKey: ['analysts-reasign', user?.tipo_regional],
    queryFn:  () => api.get('/accounts/users/', {
      params: { tipo_regional: user?.tipo_regional, is_active: true, page_size: 100 },
    }).then((r) => r.data.results || r.data),
    enabled:  isSuperAdmin && !!user?.tipo_regional,
    staleTime: 5 * 60_000,
  })
  // Pares: otros ADMIN/SUPER del mismo tipo_regional (excluyendo al usuario actual)
  const peerAnalysts = analysts.filter((u) => ['ADMIN', 'SUPER'].includes(u.rol) && u.id !== user?.id)
  // Todos: para el diálogo de reasignación (incluye al usuario actual)
  const allAnalysts  = analysts.filter((u) => ['ADMIN', 'SUPER'].includes(u.rol))

  // ── Queries de bandeja ───────────────────────────────────────────────────────
  const myParams = {
    ...(isSuperAdmin
      ? { exclude_estados: !applied.estado ? 'ASIG,REV,DEV,RECH,RECT,FIN' : undefined }
      : { analista_bandeja: 'true' }
    ),
    search:                  applied.search    || undefined,
    prioridad:               applied.prioridad || undefined,
    estado:                  applied.estado    || undefined,
    regional__tipo_regional: applied.tipo_regional || (isSuperAdmin ? user?.tipo_regional : undefined) || undefined,
    regional:                applied.regional  || undefined,
    agencia:                 applied.agencia   || undefined,
  }
  const asignadasParams = {
    analista_asignado:       applied.analista || user?.id,
    search:                  applied.search    || undefined,
    prioridad:               applied.prioridad || undefined,
    estado:                  applied.estado    || undefined,
    exclude_estados:         !applied.estado ? 'DEV,RECH,RECT,FIN' : undefined,
    regional__tipo_regional: applied.tipo_regional || undefined,
    regional:                applied.regional  || undefined,
    agencia:                 applied.agencia   || undefined,
    todas:                   'true',
  }
  const pendParams = {
    estado:                  applied.estado || 'PEND',
    search:                  applied.search    || undefined,
    prioridad:               applied.prioridad || undefined,
    regional__tipo_regional: applied.tipo_regional || (isSuperAdmin ? user?.tipo_regional : undefined) || undefined,
    regional:                applied.regional  || undefined,
    agencia:                 applied.agencia   || undefined,
  }

  const { data: mySols, isLoading: loadingMy } = useQuery({
    queryKey: ['workflow-mis', user?.id, applied],
    queryFn:  () => getSolicitudes(myParams).then((r) => r.data),
    enabled:  !!user,
  })
  const { data: asignadasSols, isLoading: loadingAsig } = useQuery({
    queryKey: ['workflow-asig', user?.id, applied],
    queryFn:  () => getSolicitudes(asignadasParams).then((r) => r.data),
    enabled:  isSuperAdmin,
  })
  const { data: pendSols, isLoading: loadingPend } = useQuery({
    queryKey: ['workflow-pend', applied],
    queryFn:  () => getSolicitudes(pendParams).then((r) => r.data),
    enabled:  isSuperAdmin,
  })

  const rows = tab === TAB_TODAS     ? mySols?.results
             : tab === TAB_ASIGNADAS ? asignadasSols?.results
             : pendSols?.results
  const loading = tab === TAB_TODAS     ? loadingMy
                : tab === TAB_ASIGNADAS ? loadingAsig
                : loadingPend

  // ── Checkbox helpers (solo Tab 1, solo ADMIN/SUPER) ──────────────────────────
  const showCheckbox   = isSuperAdmin && tab === TAB_ASIGNADAS
  const colCount       = showCheckbox ? 16 : 15
  const isAllSelected  = !!rows?.length && rows.every((r) => selected.has(r.id))
  const isSomeSelected = !!rows?.some((r) => selected.has(r.id)) && !isAllSelected

  const toggleSelect = (id) => setSelected((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleAll = () => setSelected(
    isAllSelected ? new Set() : new Set(rows?.map((r) => r.id) || [])
  )

  // ── Mutación reasignación ────────────────────────────────────────────────────
  const reasignarMutation = useMutation({
    mutationFn: reasignarSolicitudes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-asig'] })
      setSelected(new Set())
      setShowReasignar(false)
      setNuevoAnalistaId('')
    },
  })

  const headSx = {
    py: 0.8, px: 1,
    color: ORO, fontWeight: 700, fontSize: '0.72rem',
    textTransform: 'uppercase', borderBottom: `2px solid #2A3D6B`,
    whiteSpace: 'nowrap',
  }
  const cellSx = { py: 0.7, px: 1, fontSize: '0.82rem', borderBottom: '1px solid #2A3D6B' }

  const statCards = isSuperAdmin ? [
    { label: 'Por Asignar', count: mySols?.count      ?? '—', color: '#2196f3' },
    { label: 'Asignadas',   count: asignadasSols?.count ?? '—', color: ORO      },
    { label: 'Pendientes',  count: pendSols?.count     ?? '—', color: '#ff9800' },
  ] : [
    { label: 'En mi bandeja', count: mySols?.count ?? '—', color: ORO },
  ]

  const analystLabel = (id) => {
    const u = allAnalysts.find((a) => a.id === Number(id))
    return u ? (u.nombre_completo || u.username) : id
  }

  return (
    <Box>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{
            background: `linear-gradient(90deg, #fff 30%, ${ORO})`,
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Mi Bandeja de Trabajo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSuperAdmin
              ? user?.tipo_regional_nombre
                ? `Tipo regional: ${user.tipo_regional_nombre} — solicitudes pendientes de asignación`
                : 'Solicitudes pendientes de asignación'
              : 'Solicitudes asignadas a usted'}
          </Typography>
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

      {/* Tarjetas de resumen */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        {statCards.map((s, i) => (
          <Box key={s.label} sx={{
            flex: '1 1 120px', minWidth: 110,
            px: 2, py: 1.5, borderRadius: 2,
            border: `1px solid ${s.color}44`,
            background: `linear-gradient(135deg, ${s.color}14 0%, ${s.color}06 100%)`,
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${s.color}33` },
            '@keyframes statFadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
            animation: `statFadeIn 0.4s ease ${i * 0.1}s both`,
            '&::before': {
              content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
              '@keyframes shimmerBar': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
              animation: 'shimmerBar 2.5s ease-in-out infinite',
            },
          }}>
            <Typography variant="caption" sx={{ color: s.color, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
              {s.label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: s.color, lineHeight: 1.2, mt: 0.3 }}>
              {s.count}
            </Typography>
          </Box>
        ))}
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
                  <MenuItem value="RECT">Rectificado</MenuItem>
                  <MenuItem value="RECH">Rechazado</MenuItem>
                  <MenuItem value="DEV">Devuelto</MenuItem>
                  <MenuItem value="FIN">Finalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo de Regional</InputLabel>
                <Select value={filters.tipo_regional} label="Tipo de Regional"
                  onChange={(e) => { setF('tipo_regional', e.target.value); setF('regional', ''); setF('agencia', '') }}>
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
                <Select value={filters.regional} label="Regional"
                  onChange={(e) => { setF('regional', e.target.value); setF('agencia', '') }}>
                  <MenuItem value="">Todas</MenuItem>
                  {regionales
                    .filter((r) => !filters.tipo_regional || r.tipo_regional === Number(filters.tipo_regional))
                    .map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth disabled={!filters.regional}>
                <InputLabel>Agencia</InputLabel>
                <Select value={filters.agencia} label="Agencia"
                  onChange={(e) => setF('agencia', e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {agencias.map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {isSuperAdmin && peerAnalysts.length > 0 && (
              <Grid item xs={6} sm={4} md={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Ver solicitudes de</InputLabel>
                  <Select value={filters.analista} label="Ver solicitudes de"
                    onChange={(e) => setF('analista', e.target.value)}>
                    <MenuItem value="">Mis solicitudes</MenuItem>
                    {peerAnalysts.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.nombre_completo || u.username}
                        <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>({u.rol})</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
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
              {applied.search        && <Chip size="small" label={`Búsqueda: "${applied.search}"`} onDelete={() => { setF('search', ''); setApplied((a) => ({ ...a, search: '' })) }} />}
              {applied.prioridad     && <Chip size="small" label={`Prioridad: ${applied.prioridad}`} onDelete={() => { setF('prioridad', ''); setApplied((a) => ({ ...a, prioridad: '' })) }} />}
              {applied.estado        && <Chip size="small" label={`Estado: ${applied.estado}`} onDelete={() => { setF('estado', ''); setApplied((a) => ({ ...a, estado: '' })) }} />}
              {applied.tipo_regional && <Chip size="small" label={`Tipo Regional: ${tiposRegional.find((t) => t.id === Number(applied.tipo_regional))?.nombre || applied.tipo_regional}`} onDelete={() => { setF('tipo_regional', ''); setF('regional', ''); setF('agencia', ''); setApplied((a) => ({ ...a, tipo_regional: '', regional: '', agencia: '' })) }} />}
              {applied.regional      && <Chip size="small" label={`Regional: ${regionales.find((r) => r.id === Number(applied.regional))?.nombre || applied.regional}`} onDelete={() => { setF('regional', ''); setF('agencia', ''); setApplied((a) => ({ ...a, regional: '', agencia: '' })) }} />}
              {applied.agencia       && <Chip size="small" label={`Agencia: ${agencias.find((a) => a.id === Number(applied.agencia))?.nombre || applied.agencia}`} onDelete={() => { setF('agencia', ''); setApplied((a) => ({ ...a, agencia: '' })) }} />}
              {applied.analista      && <Chip size="small" label={`Ver de: ${analystLabel(applied.analista)}`} onDelete={() => { setF('analista', ''); setApplied((a) => ({ ...a, analista: '' })) }} />}
            </Box>
          )}
        </Card>
      )}

      {/* Tabla */}
      <Card>
        <Box sx={{ borderBottom: '1px solid #2A3D6B' }}>
          <Tabs value={tab} onChange={handleTabChange}
            sx={{ '& .MuiTab-root': { fontWeight: 600 }, '& .Mui-selected': { color: `${ORO} !important` }, '& .MuiTabs-indicator': { backgroundColor: ORO } }}>
            <Tab label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>{isSuperAdmin ? 'Por Asignar' : 'Asignadas a mí'}</span>
                {mySols?.count > 0 && <Chip label={mySols.count} size="small" sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, height: 18, fontSize: 11 }} />}
              </Stack>
            } />
            {isSuperAdmin && (
              <Tab label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>Asignadas a mí</span>
                  {asignadasSols?.count > 0 && <Chip label={asignadasSols.count} size="small" sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, height: 18, fontSize: 11 }} />}
                </Stack>
              } />
            )}
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

        {/* Barra de acción masiva */}
        {showCheckbox && selected.size > 0 && (
          <Box sx={{
            px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2,
            bgcolor: `${ORO}14`, borderBottom: `1px solid ${ORO}44`,
            '@keyframes barSlideIn': { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
            animation: 'barSlideIn 0.2s ease both',
          }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: ORO }}>
              {selected.size} seleccionada{selected.size !== 1 ? 's' : ''}
            </Typography>
            <Button
              size="small" variant="contained" startIcon={<SwapHorizIcon />}
              onClick={() => setShowReasignar(true)}
              sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, '&:hover': { bgcolor: '#b8943e' } }}
            >
              Reasignar
            </Button>
            <Button size="small" variant="text" onClick={() => setSelected(new Set())}
              sx={{ color: 'text.secondary' }}>
              Cancelar selección
            </Button>
          </Box>
        )}

        {loading ? <LoadingSpinner message="Cargando bandeja..." /> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {showCheckbox && (
                    <TableCell sx={{ ...headSx, width: 40 }} padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={isAllSelected}
                        indeterminate={isSomeSelected}
                        onChange={toggleAll}
                        sx={{ color: ORO, '&.Mui-checked': { color: ORO }, '&.MuiCheckbox-indeterminate': { color: ORO } }}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={headSx}>N° Solicitud</TableCell>
                  <TableCell sx={headSx}>Asegurado</TableCell>
                  <TableCell sx={headSx}>CUA</TableCell>
                  <TableCell sx={headSx}>Causal</TableCell>
                  <TableCell sx={headSx}>Tipo Regional</TableCell>
                  <TableCell sx={headSx}>Regional</TableCell>
                  <TableCell sx={headSx}>Agencia</TableCell>
                  <TableCell sx={headSx}>Analista Asignado</TableCell>
                  <TableCell sx={headSx}>Creador</TableCell>
                  <TableCell sx={headSx}>Asignado por</TableCell>
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
                    <TableCell colSpan={colCount} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay solicitudes en esta bandeja.
                    </TableCell>
                  </TableRow>
                ) : rows.map((sol, idx) => (
                  <TableRow key={sol.id} hover
                    selected={selected.has(sol.id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: sol.vencida ? '#2c000033' : 'transparent',
                      '@keyframes rowIn': { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
                      animation: `rowIn 0.25s ease ${Math.min(idx * 0.04, 0.5)}s both`,
                      '&:hover td': { color: 'inherit' },
                    }}
                    onClick={() => navigate(`/solicitudes/${sol.id}`)}>
                    {showCheckbox && (
                      <TableCell sx={cellSx} padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="small"
                          checked={selected.has(sol.id)}
                          onChange={() => toggleSelect(sol.id)}
                          sx={{ color: ORO, '&.Mui-checked': { color: ORO } }}
                        />
                      </TableCell>
                    )}
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
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" color="text.secondary">{sol.agencia_nombre || '—'}</Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {sol.analista_nombre || <Typography component="span" variant="caption" color="text.disabled">Sin asignar</Typography>}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {sol.usuario_creador_nombre || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {sol.asignado_por_nombre || '—'}
                      </Typography>
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

      {/* Diálogo de reasignación */}
      <Dialog open={showReasignar} onClose={() => setShowReasignar(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Reasignar solicitudes
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Se reasignarán{' '}
            <strong style={{ color: ORO }}>{selected.size}</strong>{' '}
            solicitud{selected.size !== 1 ? 'es' : ''} al analista seleccionado.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Analista destino</InputLabel>
            <Select
              value={nuevoAnalistaId}
              label="Analista destino"
              onChange={(e) => setNuevoAnalistaId(e.target.value)}
            >
              {allAnalysts.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.nombre_completo || u.username}
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                    ({u.rol})
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {reasignarMutation.isError && (
            <Typography variant="caption" color="error" sx={{ mt: 1.5, display: 'block' }}>
              Error al reasignar. Intente nuevamente.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => { setShowReasignar(false); setNuevoAnalistaId('') }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!nuevoAnalistaId || reasignarMutation.isPending}
            onClick={() => reasignarMutation.mutate({ ids: [...selected], analista_id: nuevoAnalistaId })}
            sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, '&:hover': { bgcolor: '#b8943e' } }}
          >
            {reasignarMutation.isPending ? 'Reasignando...' : 'Confirmar reasignación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
