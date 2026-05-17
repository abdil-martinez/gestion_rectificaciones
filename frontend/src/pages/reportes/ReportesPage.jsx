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
import { getProductividad, getCausales, exportarExcel } from '../../api/reportes'
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

  const productividad = prodData?.productividad || []
  const porCausal     = causalData?.por_causal  || []

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
      </Card>
    </Box>
  )
}
