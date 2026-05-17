import React, { useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Button,
  Tab, Tabs, Stack, TextField, Table, TableHead,
  TableRow, TableCell, TableBody, TableContainer, Chip,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import BarChartIcon from '@mui/icons-material/BarChart'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { getProductividad, getCausales, getTipoRegional, exportarExcel } from '../../api/reportes'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ORO, NAVY, NAVY2 } from '../../theme'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#CBab58', '#2196f3', '#4caf50', '#f44336', '#9c27b0', '#ff9800']

function SectionHeader({ title }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
      <BarChartIcon sx={{ color: ORO }} />
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
    </Box>
  )
}

export default function ReportesPage() {
  const [tab, setTab]           = useState(0)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [downloading, setDownloading] = useState(false)

  const params = {
    ...(fechaDesde && { fecha_desde: fechaDesde }),
    ...(fechaHasta && { fecha_hasta: fechaHasta }),
  }

  const { data: prodData, isLoading: loadProd } = useQuery({
    queryKey: ['reporte-productividad', params],
    queryFn:  () => getProductividad(params).then((r) => r.data),
  })

  const { data: causalData, isLoading: loadCausal } = useQuery({
    queryKey: ['reporte-causales', params],
    queryFn:  () => getCausales(params).then((r) => r.data),
  })

  const { data: tipoRegData, isLoading: loadTipoReg } = useQuery({
    queryKey: ['reporte-tipo-regional', params],
    queryFn:  () => getTipoRegional(params).then((r) => r.data),
  })

  const handleExportar = async (tipo) => {
    setDownloading(true)
    try {
      const res = await exportarExcel({ tipo, ...params })
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

  const productividad    = prodData?.productividad         || []
  const porCausal        = causalData?.por_causal          || []
  const porTipoRegional  = tipoRegData?.por_tipo_regional  || []
  const porRegionalDet   = tipoRegData?.por_regional       || []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Reportes</Typography>
          <Typography variant="body2" color="text.secondary">Análisis y estadísticas del sistema</Typography>
        </Box>

        {/* Filtros de fecha */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 155 }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 155 }}
          />
          {(fechaDesde || fechaHasta) && (
            <Button size="small" variant="outlined" color="inherit" onClick={() => { setFechaDesde(''); setFechaHasta('') }}>
              Limpiar
            </Button>
          )}
        </Stack>
      </Box>

      <Card sx={{ mb: 2.5 }}>
        <Box sx={{ borderBottom: '1px solid #2A3D6B' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
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

        {/* TAB 0: Productividad */}
        {tab === 0 && (
          <CardContent>
            {loadProd ? <LoadingSpinner message="Cargando reporte..." /> : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <SectionHeader title="Productividad por Analista" />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExportar('productividad')}
                    disabled={downloading}
                    sx={{ borderColor: ORO, color: ORO, '&:hover': { borderColor: ORO, bgcolor: `${ORO}11` } }}
                  >
                    Exportar Excel
                  </Button>
                </Box>

                {!productividad.length ? (
                  <Typography color="text.secondary" variant="body2">Sin datos para el período seleccionado.</Typography>
                ) : (
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
                            {productividad.map((row) => (
                              <TableRow key={row.analista_id} sx={{ '&:last-child td': { border: 0 } }}>
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
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </CardContent>
        )}

        {/* TAB 1: Causales */}
        {tab === 1 && (
          <CardContent>
            {loadCausal ? <LoadingSpinner message="Cargando reporte..." /> : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <SectionHeader title="Solicitudes por Tipo de Causal" />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExportar('solicitudes')}
                    disabled={downloading}
                    sx={{ borderColor: ORO, color: ORO, '&:hover': { borderColor: ORO, bgcolor: `${ORO}11` } }}
                  >
                    Exportar Excel
                  </Button>
                </Box>

                {!porCausal.length ? (
                  <Typography color="text.secondary" variant="body2">Sin datos para el período seleccionado.</Typography>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={5}>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={porCausal}
                            dataKey="total"
                            nameKey="tipo_causal__nombre"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {porCausal.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
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
        {/* TAB 2: Tipo Regional */}
        {tab === 2 && (
          <CardContent>
            {loadTipoReg ? <LoadingSpinner message="Cargando reporte..." /> : (
              <>
                <SectionHeader title="Distribución por Tipo de Regional" />

                {!porTipoRegional.length ? (
                  <Typography color="text.secondary" variant="body2">Sin datos para el período seleccionado.</Typography>
                ) : (
                  <Grid container spacing={3}>
                    {/* Gráfico de barras por tipo regional */}
                    <Grid item xs={12} lg={5}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        Solicitudes por Tipo Regional
                      </Typography>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={porTipoRegional} margin={{ top: 5, right: 10, left: -20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3D6B" />
                          <XAxis dataKey="nombre" tick={{ fill: '#B0B8D0', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#B0B8D0', fontSize: 11 }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: NAVY2, border: `1px solid ${ORO}`, borderRadius: 8 }}
                            labelStyle={{ color: ORO, fontWeight: 700 }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="total"      name="Total"      radius={[4,4,0,0]} fill={ORO} />
                          <Bar dataKey="finalizadas" name="Finalizadas" radius={[4,4,0,0]} fill="#4caf50" />
                          <Bar dataKey="aprobadas"  name="Aprobadas"  radius={[4,4,0,0]} fill="#2196f3" />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Totales resumen */}
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {porTipoRegional.map((t, i) => (
                          <Grid item xs={12 / porTipoRegional.length} key={t.id || i}>
                            <Box sx={{ textAlign: 'center', p: 1, border: '1px solid #2A3D6B', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                {t.nombre}
                              </Typography>
                              <Typography variant="h6" fontWeight={800} sx={{ color: ORO }}>{t.total}</Typography>
                              <Typography variant="caption" color="text.secondary">solicitudes</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>

                    {/* Tabla detalle por regional */}
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
                              const regionales = porRegionalDet.filter((r) => r.tipo_regional === tipo.nombre)
                              return regionales.map((reg, ri) => (
                                <TableRow key={reg.regional_id} sx={{ '&:last-child td': { border: 0 } }}>
                                  {ri === 0 && (
                                    <TableCell
                                      rowSpan={regionales.length}
                                      sx={{
                                        fontWeight: 800,
                                        verticalAlign: 'middle',
                                        borderLeft: `3px solid ${PIE_COLORS[ti % PIE_COLORS.length]}`,
                                        pl: 1.5,
                                        bgcolor: `${PIE_COLORS[ti % PIE_COLORS.length]}11`,
                                      }}
                                    >
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
