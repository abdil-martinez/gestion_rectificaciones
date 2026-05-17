import React, { useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Button,
  Tab, Tabs, Stack, TextField, Table, TableHead,
  TableRow, TableCell, TableBody, TableContainer, Chip, LinearProgress,
  FormControl, InputLabel, Select, MenuItem, Collapse,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import BarChartIcon from '@mui/icons-material/BarChart'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { getProductividad, getCausales, getTipoRegional, exportarExcel } from '../../api/reportes'
import catalogosApi from '../../api/catalogos'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ORO, NAVY2 } from '../../theme'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#CBab58', '#2196f3', '#4caf50', '#f44336', '#9c27b0', '#ff9800']

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
const PRIORIDADES = [
  { value: 'BAJA',    label: 'Baja' },
  { value: 'MEDIA',   label: 'Media' },
  { value: 'ALTA',    label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
]

const FILTER_EMPTY = { tipo_regional: '', regional: '', estado: '', prioridad: '' }

/* ── Componente reutilizable de filtros ─────────────────────────────── */
function FilterPanel({ filters, applied, onSet, onSetApplied, onApply, onClear, tiposRegional, regionales }) {
  const hasActive = Object.values(applied).some(Boolean)
  return (
    <>
      <Box sx={{ border: '1px solid #2A3D6B', borderRadius: 1, p: 2, mb: 2 }}>
        <Grid container spacing={1.5} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo de Regional</InputLabel>
              <Select value={filters.tipo_regional} label="Tipo de Regional"
                onChange={(e) => { onSet('tipo_regional', e.target.value); onSet('regional', '') }}>
                <MenuItem value="">Todos</MenuItem>
                {tiposRegional.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Regional</InputLabel>
              <Select value={filters.regional} label="Regional"
                onChange={(e) => onSet('regional', e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                {regionales
                  .filter((r) => !filters.tipo_regional || r.tipo_regional === Number(filters.tipo_regional))
                  .map((r) => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={filters.estado} label="Estado"
                onChange={(e) => onSet('estado', e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {ESTADOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Prioridad</InputLabel>
              <Select value={filters.prioridad} label="Prioridad"
                onChange={(e) => onSet('prioridad', e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                {PRIORIDADES.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" variant="outlined" color="inherit" onClick={onClear}>Limpiar</Button>
              <Button size="small" variant="contained" onClick={onApply}
                sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, '&:hover': { bgcolor: '#b8943e' } }}>
                Aplicar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>
      {hasActive && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1.5, gap: 0.5 }}>
          {applied.tipo_regional && (
            <Chip size="small"
              label={`Tipo Regional: ${tiposRegional.find((t) => t.id === Number(applied.tipo_regional))?.nombre || applied.tipo_regional}`}
              onDelete={() => { onSet('tipo_regional', ''); onSet('regional', ''); onSetApplied((a) => ({ ...a, tipo_regional: '', regional: '' })) }} />
          )}
          {applied.regional && (
            <Chip size="small"
              label={`Regional: ${regionales.find((r) => r.id === Number(applied.regional))?.nombre || applied.regional}`}
              onDelete={() => { onSet('regional', ''); onSetApplied((a) => ({ ...a, regional: '' })) }} />
          )}
          {applied.estado && (
            <Chip size="small"
              label={`Estado: ${ESTADOS.find((e) => e.value === applied.estado)?.label || applied.estado}`}
              onDelete={() => { onSet('estado', ''); onSetApplied((a) => ({ ...a, estado: '' })) }} />
          )}
          {applied.prioridad && (
            <Chip size="small"
              label={`Prioridad: ${PRIORIDADES.find((p) => p.value === applied.prioridad)?.label || applied.prioridad}`}
              onDelete={() => { onSet('prioridad', ''); onSetApplied((a) => ({ ...a, prioridad: '' })) }} />
          )}
        </Stack>
      )}
    </>
  )
}

/* ── Botón de toggle de filtros ─────────────────────────────────────── */
function FilterToggleBtn({ show, onToggle, activeCount }) {
  return (
    <Button
      size="small"
      variant={show ? 'contained' : 'outlined'}
      startIcon={show ? <FilterListOffIcon /> : <FilterListIcon />}
      onClick={onToggle}
      sx={show
        ? { bgcolor: ORO, color: '#0F1932', fontWeight: 700, '&:hover': { bgcolor: '#b8943e' } }
        : { borderColor: ORO, color: ORO, '&:hover': { borderColor: ORO, bgcolor: `${ORO}11` } }}
    >
      Filtros{activeCount ? ` (${activeCount})` : ''}
    </Button>
  )
}

/* ── Vista detallada por analista ───────────────────────────────────── */
function AnalystDetail({ row }) {
  const enProceso = Math.max(0, row.total - row.finalizadas - row.aprobadas - row.rechazadas)
  const pctFin    = row.total > 0 ? Math.round((row.finalizadas / row.total) * 100) : 0

  const chartData = [
    { name: 'Finalizadas', value: row.finalizadas, color: '#4caf50' },
    { name: 'Aprobadas',   value: row.aprobadas,   color: '#2196f3' },
    { name: 'En proceso',  value: enProceso,        color: ORO      },
    { name: 'Rechazadas',  value: row.rechazadas,   color: '#f44336' },
  ].filter((d) => d.value > 0)

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total asignadas', value: row.total,       color: ORO      },
          { label: 'En proceso',      value: enProceso,       color: '#CBab58' },
          { label: 'Finalizadas',     value: row.finalizadas, color: '#4caf50' },
          { label: 'Aprobadas',       value: row.aprobadas,   color: '#2196f3' },
          { label: 'Rechazadas',      value: row.rechazadas,  color: '#f44336' },
        ].map(({ label, value, color }) => (
          <Grid item xs={6} sm={4} md key={label}>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #2A3D6B', borderRadius: 2, height: '100%' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
              <Typography variant="caption" color="text.secondary"
                sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem', display: 'block', mt: 0.5 }}>
                {label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Tasa de finalización</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: '#4caf50' }}>{pctFin}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pctFin}
          sx={{
            height: 8, borderRadius: 4, bgcolor: '#2A3D6B',
            '& .MuiLinearProgress-bar': { bgcolor: '#4caf50', borderRadius: 4 },
          }}
        />
      </Box>

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 90, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3D6B" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#B0B8D0', fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#B0B8D0', fontSize: 12 }} width={90} />
            <Tooltip
              contentStyle={{ backgroundColor: NAVY2, border: `1px solid ${ORO}`, borderRadius: 8 }}
              labelStyle={{ color: ORO, fontWeight: 700 }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" name="Solicitudes" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  )
}

function SectionHeader({ title }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
      <BarChartIcon sx={{ color: ORO }} />
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
    </Box>
  )
}

/* ── Página principal ───────────────────────────────────────────────── */
export default function ReportesPage() {
  const [tab, setTab]               = useState(0)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [downloading, setDownloading] = useState(false)

  // Sub-tab analistas
  const [analystTab, setAnalystTab] = useState(0)

  // Filtros productividad
  const [prodF, setProdF]         = useState(FILTER_EMPTY)
  const [prodA, setProdA]         = useState(FILTER_EMPTY)
  const [showProd, setShowProd]   = useState(false)
  const setProdKey = (k, v) => setProdF((f) => ({ ...f, [k]: v }))
  const applyProd  = () => { setProdA({ ...prodF }); setAnalystTab(0) }
  const clearProd  = () => { setProdF(FILTER_EMPTY); setProdA(FILTER_EMPTY); setAnalystTab(0) }

  // Filtros causales
  const [causalF, setCausalF]       = useState(FILTER_EMPTY)
  const [causalA, setCausalA]       = useState(FILTER_EMPTY)
  const [showCausal, setShowCausal] = useState(false)
  const setCausalKey = (k, v) => setCausalF((f) => ({ ...f, [k]: v }))
  const applyCausal  = () => setCausalA({ ...causalF })
  const clearCausal  = () => { setCausalF(FILTER_EMPTY); setCausalA(FILTER_EMPTY) }

  // Filtros tipo regional
  const [trF, setTrF]         = useState(FILTER_EMPTY)
  const [trA, setTrA]         = useState(FILTER_EMPTY)
  const [showTr, setShowTr]   = useState(false)
  const setTrKey = (k, v) => setTrF((f) => ({ ...f, [k]: v }))
  const applyTr  = () => setTrA({ ...trF })
  const clearTr  = () => { setTrF(FILTER_EMPTY); setTrA(FILTER_EMPTY) }

  const activeCount = (a) => Object.values(a).filter(Boolean).length

  // Parámetros base (fechas)
  const dateParams = {
    ...(fechaDesde && { fecha_desde: fechaDesde }),
    ...(fechaHasta && { fecha_hasta: fechaHasta }),
  }

  const buildParams = (applied) => ({
    ...dateParams,
    ...(applied.tipo_regional && { tipo_regional: applied.tipo_regional }),
    ...(applied.regional      && { regional:      applied.regional      }),
    ...(applied.estado        && { estado:        applied.estado        }),
    ...(applied.prioridad     && { prioridad:     applied.prioridad     }),
  })

  // Catálogos compartidos
  const { data: tiposRegional = [] } = useQuery({
    queryKey: ['tipo-regional'],
    queryFn:  () => catalogosApi.tipoRegional.getAll().then((r) => r.data.results || r.data),
    staleTime: 10 * 60_000,
  })
  const { data: regionales = [] } = useQuery({
    queryKey: ['regionales-all'],
    queryFn:  () => catalogosApi.regionales.getAll({ page_size: 200 }).then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })

  // Queries de reportes
  const prodParams   = buildParams(prodA)
  const causalParams = buildParams(causalA)
  const trParams     = buildParams(trA)

  const { data: prodData,    isLoading: loadProd    } = useQuery({
    queryKey: ['reporte-productividad', prodParams],
    queryFn:  () => getProductividad(prodParams).then((r) => r.data),
  })
  const { data: causalData,  isLoading: loadCausal  } = useQuery({
    queryKey: ['reporte-causales', causalParams],
    queryFn:  () => getCausales(causalParams).then((r) => r.data),
  })
  const { data: tipoRegData, isLoading: loadTipoReg } = useQuery({
    queryKey: ['reporte-tipo-regional', trParams],
    queryFn:  () => getTipoRegional(trParams).then((r) => r.data),
  })

  const handleExportar = async (tipo) => {
    setDownloading(true)
    try {
      const res = await exportarExcel({ tipo, ...dateParams })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `reporte_${tipo}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Archivo descargado correctamente')
    } catch {
      toast.error('Error al exportar el reporte')
    } finally {
      setDownloading(false)
    }
  }

  const productividad   = prodData?.productividad        || []
  const porCausal       = causalData?.por_causal         || []
  const porTipoRegional = tipoRegData?.por_tipo_regional || []
  const porRegionalDet  = tipoRegData?.por_regional      || []

  const catalogProps = { tiposRegional, regionales }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Reportes</Typography>
          <Typography variant="body2" color="text.secondary">Análisis y estadísticas del sistema</Typography>
        </Box>

        {/* Filtros de fecha globales */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="Desde" type="date" size="small" value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
          <TextField label="Hasta" type="date" size="small" value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
          {(fechaDesde || fechaHasta) && (
            <Button size="small" variant="outlined" color="inherit"
              onClick={() => { setFechaDesde(''); setFechaHasta('') }}>
              Limpiar
            </Button>
          )}
        </Stack>
      </Box>

      <Card sx={{ mb: 2.5 }}>
        <Box sx={{ borderBottom: '1px solid #2A3D6B' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{
              '& .MuiTab-root': { fontWeight: 600 },
              '& .Mui-selected': { color: `${ORO} !important` },
              '& .MuiTabs-indicator': { backgroundColor: ORO },
            }}
          >
            <Tab label="Productividad por Analista" />
            <Tab label="Solicitudes por Causal" />
            <Tab label="Distribución por Tipo Regional" />
          </Tabs>
        </Box>

        {/* ── TAB 0: Productividad ───────────────────────────────────── */}
        {tab === 0 && (
          <CardContent>
            {loadProd ? <LoadingSpinner message="Cargando reporte..." /> : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <SectionHeader title="Productividad por Analista" />
                  <Stack direction="row" spacing={1}>
                    <FilterToggleBtn show={showProd} onToggle={() => setShowProd((v) => !v)} activeCount={activeCount(prodA)} />
                    <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                      onClick={() => handleExportar('productividad')} disabled={downloading}
                      sx={{ borderColor: ORO, color: ORO, '&:hover': { borderColor: ORO, bgcolor: `${ORO}11` } }}>
                      Exportar
                    </Button>
                  </Stack>
                </Box>

                <Collapse in={showProd}>
                  <FilterPanel
                    filters={prodF} applied={prodA}
                    onSet={setProdKey} onSetApplied={setProdA}
                    onApply={applyProd} onClear={clearProd}
                    {...catalogProps}
                  />
                </Collapse>

                {!productividad.length ? (
                  <Typography color="text.secondary" variant="body2">Sin datos para el período seleccionado.</Typography>
                ) : (
                  <>
                    <Box sx={{ borderBottom: 1, borderColor: '#2A3D6B', mb: 2.5 }}>
                      <Tabs
                        value={Math.min(analystTab, productividad.length)}
                        onChange={(_, v) => setAnalystTab(v)}
                        variant="scrollable" scrollButtons="auto"
                        sx={{
                          '& .MuiTab-root': { fontWeight: 600, fontSize: '0.78rem', minWidth: 100, textTransform: 'none' },
                          '& .Mui-selected': { color: `${ORO} !important` },
                          '& .MuiTabs-indicator': { backgroundColor: ORO },
                        }}
                      >
                        <Tab label="Resumen General" />
                        {productividad.map((row) => <Tab key={row.analista_id} label={row.analista} />)}
                      </Tabs>
                    </Box>

                    {analystTab === 0 && (
                      <Grid container spacing={3}>
                        <Grid item xs={12} lg={6}>
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={productividad} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#2A3D6B" />
                              <XAxis dataKey="analista" tick={{ fill: '#B0B8D0', fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                              <YAxis tick={{ fill: '#B0B8D0', fontSize: 11 }} allowDecimals={false} />
                              <Tooltip contentStyle={{ backgroundColor: NAVY2, border: `1px solid ${ORO}`, borderRadius: 8 }} labelStyle={{ color: ORO, fontWeight: 700 }} itemStyle={{ color: '#fff' }} />
                              <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill={ORO} />
                              <Bar dataKey="finalizadas" name="Finalizadas" radius={[4, 4, 0, 0]} fill="#4caf50" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Grid>
                        <Grid item xs={12} lg={6}>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  {['Analista', 'Total', 'Finalizadas', 'Aprobadas', 'Rechazadas'].map((h) => (
                                    <TableCell key={h} sx={{ color: ORO, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {productividad.map((row, i) => (
                                  <TableRow key={row.analista_id} hover
                                    sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                                    onClick={() => setAnalystTab(i + 1)}>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.analista}</TableCell>
                                    <TableCell><Chip label={row.total} size="small" sx={{ bgcolor: `${ORO}22`, color: ORO, fontWeight: 700 }} /></TableCell>
                                    <TableCell><Chip label={row.finalizadas} size="small" sx={{ bgcolor: '#1b5e2044', color: '#4caf50', fontWeight: 700 }} /></TableCell>
                                    <TableCell>{row.aprobadas}</TableCell>
                                    <TableCell>{row.rechazadas}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                            Haga clic en una fila para ver el detalle del analista.
                          </Typography>
                        </Grid>
                      </Grid>
                    )}

                    {productividad.map((row, i) =>
                      analystTab === i + 1 && <AnalystDetail key={row.analista_id} row={row} />
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        )}

        {/* ── TAB 1: Causales ───────────────────────────────────────── */}
        {tab === 1 && (
          <CardContent>
            {loadCausal ? <LoadingSpinner message="Cargando reporte..." /> : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <SectionHeader title="Solicitudes por Tipo de Causal" />
                  <Stack direction="row" spacing={1}>
                    <FilterToggleBtn show={showCausal} onToggle={() => setShowCausal((v) => !v)} activeCount={activeCount(causalA)} />
                    <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                      onClick={() => handleExportar('solicitudes')} disabled={downloading}
                      sx={{ borderColor: ORO, color: ORO, '&:hover': { borderColor: ORO, bgcolor: `${ORO}11` } }}>
                      Exportar
                    </Button>
                  </Stack>
                </Box>

                <Collapse in={showCausal}>
                  <FilterPanel
                    filters={causalF} applied={causalA}
                    onSet={setCausalKey} onSetApplied={setCausalA}
                    onApply={applyCausal} onClear={clearCausal}
                    {...catalogProps}
                  />
                </Collapse>

                {!porCausal.length ? (
                  <Typography color="text.secondary" variant="body2">Sin datos para el período seleccionado.</Typography>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={5}>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={porCausal} dataKey="total" nameKey="tipo_causal__nombre"
                            cx="50%" cy="50%" outerRadius={100}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}>
                            {porCausal.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: NAVY2, border: `1px solid ${ORO}`, borderRadius: 8 }} itemStyle={{ color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: 12, color: '#B0B8D0' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} lg={7}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              {['Causal', 'Tipo', 'Total', 'Finalizadas', 'Aprobadas', 'Rechazadas'].map((h) => (
                                <TableCell key={h} sx={{ color: ORO, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {porCausal.map((row, i) => (
                              <TableRow key={row['tipo_causal__id']} sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell sx={{ fontWeight: 600 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                    {row['tipo_causal__nombre']}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip label={row['tipo_causal__tipo']} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                </TableCell>
                                <TableCell><Chip label={row.total} size="small" sx={{ bgcolor: `${ORO}22`, color: ORO, fontWeight: 700 }} /></TableCell>
                                <TableCell>{row.finalizadas}</TableCell>
                                <TableCell>{row.aprobadas}</TableCell>
                                <TableCell>{row.rechazadas}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </CardContent>
        )}

        {/* ── TAB 2: Tipo Regional ──────────────────────────────────── */}
        {tab === 2 && (
          <CardContent>
            {loadTipoReg ? <LoadingSpinner message="Cargando reporte..." /> : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <SectionHeader title="Distribución por Tipo de Regional" />
                  <FilterToggleBtn show={showTr} onToggle={() => setShowTr((v) => !v)} activeCount={activeCount(trA)} />
                </Box>

                <Collapse in={showTr}>
                  <FilterPanel
                    filters={trF} applied={trA}
                    onSet={setTrKey} onSetApplied={setTrA}
                    onApply={applyTr} onClear={clearTr}
                    {...catalogProps}
                  />
                </Collapse>

                {!porTipoRegional.length ? (
                  <Typography color="text.secondary" variant="body2">Sin datos para el período seleccionado.</Typography>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={5}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        Solicitudes por Tipo Regional
                      </Typography>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={porTipoRegional} margin={{ top: 5, right: 10, left: -20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3D6B" />
                          <XAxis dataKey="nombre" tick={{ fill: '#B0B8D0', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#B0B8D0', fontSize: 11 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: NAVY2, border: `1px solid ${ORO}`, borderRadius: 8 }} labelStyle={{ color: ORO, fontWeight: 700 }} itemStyle={{ color: '#fff' }} />
                          <Bar dataKey="total"       name="Total"       radius={[4,4,0,0]} fill={ORO}       />
                          <Bar dataKey="finalizadas" name="Finalizadas" radius={[4,4,0,0]} fill="#4caf50"   />
                          <Bar dataKey="aprobadas"   name="Aprobadas"   radius={[4,4,0,0]} fill="#2196f3"   />
                        </BarChart>
                      </ResponsiveContainer>

                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {porTipoRegional.map((t, i) => (
                          <Grid item xs={12 / porTipoRegional.length} key={t.id || i}>
                            <Box sx={{ textAlign: 'center', p: 1, border: '1px solid #2A3D6B', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary"
                                sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                {t.nombre}
                              </Typography>
                              <Typography variant="h6" fontWeight={800} sx={{ color: ORO }}>{t.total}</Typography>
                              <Typography variant="caption" color="text.secondary">solicitudes</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>

                    <Grid item xs={12} lg={7}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        Detalle por Regional
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              {['Tipo Regional', 'Regional', 'Total', 'Finalizadas', 'Aprobadas'].map((h) => (
                                <TableCell key={h} sx={{ color: ORO, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {porTipoRegional.map((tipo, ti) => {
                              const regs = porRegionalDet.filter((r) => r.tipo_regional === tipo.nombre)
                              return regs.map((reg, ri) => (
                                <TableRow key={reg.regional_id} sx={{ '&:last-child td': { border: 0 } }}>
                                  {ri === 0 && (
                                    <TableCell rowSpan={regs.length}
                                      sx={{
                                        fontWeight: 800, verticalAlign: 'middle',
                                        borderLeft: `3px solid ${PIE_COLORS[ti % PIE_COLORS.length]}`,
                                        pl: 1.5, bgcolor: `${PIE_COLORS[ti % PIE_COLORS.length]}11`,
                                      }}>
                                      {tipo.nombre}
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        {tipo.total} total
                                      </Typography>
                                    </TableCell>
                                  )}
                                  <TableCell sx={{ fontWeight: 500 }}>{reg.regional}</TableCell>
                                  <TableCell>
                                    <Chip label={reg.total} size="small" sx={{ bgcolor: `${ORO}22`, color: ORO, fontWeight: 700 }} />
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={reg.finalizadas} size="small" sx={{ bgcolor: '#1b5e2044', color: '#4caf50', fontWeight: 700 }} />
                                  </TableCell>
                                  <TableCell>{reg.aprobadas}</TableCell>
                                </TableRow>
                              ))
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    </Box>
  )
}
