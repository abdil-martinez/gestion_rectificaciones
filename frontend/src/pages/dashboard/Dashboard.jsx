import React from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  List, ListItem, ListItemText, Divider, CircularProgress,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import RateReviewIcon from '@mui/icons-material/RateReview'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getDashboard } from '../../api/reportes'
import { StatusChip } from '../../components/common/StatusChip'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ORO, ORO_DARK, NAVY, NAVY2 } from '../../theme'

const ESTADO_BAR_COLORS = {
  BOR: '#607d8b', PEND: '#2196f3', ASIG: '#ff9800',
  REV: '#e65100', APRO: '#4caf50', RECH: '#f44336',
  DEV: '#9c27b0', FIN: '#1b5e20', ANU: '#b71c1c',
}

const ESTADO_LABELS = {
  BOR: 'Borrador', PEND: 'Pendiente', ASIG: 'Asignado',
  REV: 'En Revisión', APRO: 'Aprobado', RECH: 'Rechazado',
  DEV: 'Devuelto',  FIN: 'Finalizado', ANU: 'Anulado',
}

const TR_COLORS = ['#CBab58', '#2196f3', '#4caf50', '#f44336', '#9c27b0']

function KpiCard({ title, value, icon, color, subtitle }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color, lineHeight: 1 }}>
              {value ?? '—'}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2,
              bgcolor: `${color}22`,
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then((r) => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) return <LoadingSpinner message="Cargando dashboard..." fullHeight />
  if (error) return (
    <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
      Error al cargar datos del dashboard.
    </Box>
  )

  const estadosBarData = data?.por_estado
    ? Object.entries(data.por_estado).map(([key, val]) => ({
        name: val.label,
        total: val.total,
        codigo: key,
      }))
    : []

  // Distribución por tipo regional + estado → stacked bar chart
  const rawTRE      = data?.por_tipo_regional_estado || []
  const tiposReg    = [...new Set(rawTRE.map((r) => r.tipo_regional))].sort()
  const estadosUsados = [...new Set(rawTRE.map((r) => r.estado))]
  const treChartData = tiposReg.map((tr) => {
    const row = { name: tr, _total: 0 }
    estadosUsados.forEach((e) => {
      const found = rawTRE.find((r) => r.tipo_regional === tr && r.estado === e)
      row[e] = found?.total || 0
      row._total += found?.total || 0
    })
    return row
  })

  const pendientes = data?.por_estado?.PEND?.total || 0
  const enRevision = (data?.por_estado?.REV?.total || 0) + (data?.por_estado?.ASIG?.total || 0)
  const finalizadas = data?.por_estado?.FIN?.total || 0

  return (
    <Box>
      {/* KPIs */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Total Solicitudes"
            value={data?.total_solicitudes}
            icon={<AssignmentIcon />}
            color={ORO}
            subtitle="Registradas en el sistema"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Pendientes"
            value={pendientes}
            icon={<HourglassEmptyIcon />}
            color="#2196f3"
            subtitle="Esperando asignación"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="En Proceso"
            value={enRevision}
            icon={<RateReviewIcon />}
            color="#ff9800"
            subtitle="Asignadas o en revisión"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Finalizadas"
            value={finalizadas}
            icon={<CheckCircleIcon />}
            color="#4caf50"
            subtitle="Completadas exitosamente"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Bar Chart */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700 }}>
                Distribución por Estado
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={estadosBarData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3D6B" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#B0B8D0', fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: '#B0B8D0', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: NAVY2, border: `1px solid ${ORO}`, borderRadius: 8 }}
                    labelStyle={{ color: ORO, fontWeight: 700 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {estadosBarData.map((entry) => (
                      <Cell key={entry.codigo} fill={ESTADO_BAR_COLORS[entry.codigo] || ORO} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Causales */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Top 5 Causales
              </Typography>
              {data?.top_causales?.length ? (
                <List dense disablePadding>
                  {data.top_causales.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem
                        disablePadding
                        sx={{ py: 1 }}
                        secondaryAction={
                          <Chip
                            label={item.total}
                            size="small"
                            sx={{ bgcolor: `${ORO}22`, color: ORO, fontWeight: 700 }}
                          />
                        }
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: idx === 0 ? ORO : `${ORO}44`,
                            color: NAVY,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            mr: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <ListItemText
                          primary={item['tipo_causal__nombre']}
                          primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                        />
                      </ListItem>
                      {idx < data.top_causales.length - 1 && <Divider sx={{ borderColor: '#2A3D6B' }} />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" variant="body2">Sin datos disponibles.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vencidas warning */}
        {data?.solicitudes_vencidas > 0 && (
          <Grid item xs={12}>
            <Card sx={{ border: `1px solid #f44336`, bgcolor: '#2c0000' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                <WarningIcon sx={{ color: '#f44336', fontSize: 28 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f44336' }}>
                    {data.solicitudes_vencidas} solicitud{data.solicitudes_vencidas > 1 ? 'es' : ''} vencida{data.solicitudes_vencidas > 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Existen solicitudes que han superado su fecha límite de atención.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Distribución por Tipo Regional y Estado */}
        {treChartData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700 }}>
                  Distribución por Tipo de Regional y Estado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Composición de estados dentro de cada tipo regional
                </Typography>

                {/* Pie charts — uno por tipo regional */}
                <Grid container spacing={2} justifyContent="center">
                  {treChartData.map((row, idx) => {
                    const pieData = estadosUsados
                      .filter((e) => row[e] > 0)
                      .map((e) => ({ name: ESTADO_LABELS[e] || e, value: row[e], estado: e }))
                    return (
                      <Grid item xs={12} sm={6} md={12 / Math.min(treChartData.length, 4)} key={row.name}>
                        <Box sx={{ textAlign: 'center' }}>
                          {/* Encabezado del tipo */}
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 0.5, px: 2, py: 0.5, borderRadius: 2, bgcolor: `${TR_COLORS[idx % TR_COLORS.length]}18`, border: `1px solid ${TR_COLORS[idx % TR_COLORS.length]}44` }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: TR_COLORS[idx % TR_COLORS.length] }} />
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: TR_COLORS[idx % TR_COLORS.length] }}>
                              {row.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">({row._total})</Typography>
                          </Box>

                          {/* Pie */}
                          <PieChart width={200} height={180} style={{ margin: '0 auto' }}>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={78}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry) => (
                                <Cell key={entry.estado} fill={ESTADO_BAR_COLORS[entry.estado] || '#607d8b'} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: NAVY2, border: `1px solid ${ORO}`, borderRadius: 8, fontSize: 12 }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value, name) => [`${value} sol.`, name]}
                            />
                          </PieChart>

                          {/* Total centrado en el donut */}
                          <Typography variant="h5" fontWeight={800} sx={{ color: TR_COLORS[idx % TR_COLORS.length], mt: -1.5, mb: 1 }}>
                            {row._total}
                          </Typography>

                          {/* Mini leyenda de estados con valor */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, alignItems: 'flex-start', maxWidth: 190, mx: 'auto' }}>
                            {pieData.map((entry) => (
                              <Box key={entry.estado} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, width: '100%' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ESTADO_BAR_COLORS[entry.estado], flexShrink: 0 }} />
                                <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'left', fontSize: '0.72rem' }}>
                                  {entry.name}
                                </Typography>
                                <Chip
                                  label={entry.value}
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700, bgcolor: `${ESTADO_BAR_COLORS[entry.estado]}22`, color: ESTADO_BAR_COLORS[entry.estado] }}
                                />
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Últimas solicitudes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Últimas 10 Solicitudes
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${ORO}44` }}>
                      {['N° Solicitud', 'Asegurado', 'Tipo Causal', 'Regional', 'Estado', 'Fecha'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            color: ORO,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.ultimas_solicitudes?.map((sol) => (
                      <tr
                        key={sol.id}
                        style={{ borderBottom: '1px solid #2A3D6B', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1f2f52')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '8px 12px', color: ORO, fontWeight: 600 }}>
                          {sol.numero_solicitud}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#fff' }}>{sol.asegurado_nombre}</td>
                        <td style={{ padding: '8px 12px', color: '#B0B8D0' }}>{sol.tipo_causal_nombre || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#B0B8D0' }}>{sol.regional_nombre || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <StatusChip estado={sol.estado} />
                        </td>
                        <td style={{ padding: '8px 12px', color: '#B0B8D0', whiteSpace: 'nowrap' }}>
                          {sol.created_at ? dayjs(sol.created_at).format('DD/MM/YYYY') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
