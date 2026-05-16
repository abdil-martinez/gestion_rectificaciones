import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Stack, Alert,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getSolicitudes } from '../../api/solicitudes'
import { StatusChip, PrioridadChip } from '../../components/common/StatusChip'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import { ORO } from '../../theme'

function PlazoIndicator({ fechaLimite, estado }) {
  if (!fechaLimite || ['FIN', 'ANU', 'APRO'].includes(estado)) {
    return <Typography variant="caption" color="text.secondary">—</Typography>
  }
  const hoy      = dayjs()
  const limite   = dayjs(fechaLimite)
  const diasRestantes = limite.diff(hoy, 'day')

  if (diasRestantes < 0) {
    return (
      <Chip
        icon={<WarningIcon />}
        label={`${Math.abs(diasRestantes)}d vencida`}
        size="small"
        sx={{ bgcolor: '#b71c1c', color: '#fff', fontWeight: 700 }}
      />
    )
  }
  if (diasRestantes <= 3) {
    return (
      <Chip
        icon={<AccessTimeIcon />}
        label={`${diasRestantes}d restantes`}
        size="small"
        sx={{ bgcolor: '#e65100', color: '#fff', fontWeight: 600 }}
      />
    )
  }
  if (diasRestantes <= 7) {
    return (
      <Chip
        icon={<AccessTimeIcon />}
        label={`${diasRestantes}d restantes`}
        size="small"
        sx={{ bgcolor: '#f57c00', color: '#fff', fontWeight: 600 }}
      />
    )
  }
  return (
    <Chip
      icon={<CheckCircleIcon />}
      label={`${diasRestantes}d restantes`}
      size="small"
      sx={{ bgcolor: '#1b5e20', color: '#fff', fontWeight: 500 }}
    />
  )
}

export default function WorkflowView() {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const [tab, setTab]           = useState(0)
  const [prioridad, setPrioridad] = useState('')

  const isSuperAdmin = ['ADMIN', 'SUPER'].includes(user?.rol)

  const myParams    = { analista_asignado: user?.id, estado: tab === 0 ? 'ASIG,REV' : undefined, prioridad: prioridad || undefined }
  const pendParams  = { estado: 'PEND', prioridad: prioridad || undefined }

  const { data: mySols, isLoading: loadingMy } = useQuery({
    queryKey: ['workflow-mis', user?.id, prioridad],
    queryFn:  () => getSolicitudes({ analista_asignado: user?.id, prioridad: prioridad || undefined }).then((r) => r.data),
    enabled:  tab === 0,
  })

  const { data: pendSols, isLoading: loadingPend } = useQuery({
    queryKey: ['workflow-pend', prioridad],
    queryFn:  () => getSolicitudes(pendParams).then((r) => r.data),
    enabled:  tab === 1 && isSuperAdmin,
  })

  const rows = tab === 0 ? mySols?.results : pendSols?.results
  const loading = tab === 0 ? loadingMy : loadingPend

  const SolicitudTable = ({ rows, loading }) => {
    if (loading) return <LoadingSpinner message="Cargando bandeja..." />
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>N° Solicitud</TableCell>
              <TableCell>Asegurado</TableCell>
              <TableCell>Causal</TableCell>
              <TableCell>Regional</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Prioridad</TableCell>
              <TableCell>Plazo</TableCell>
              <TableCell>Recepción</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!rows?.length && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay solicitudes en esta bandeja.
                </TableCell>
              </TableRow>
            )}
            {rows?.map((sol) => (
              <TableRow
                key={sol.id}
                sx={{ cursor: 'pointer', bgcolor: sol.vencida ? '#2c000055' : 'transparent' }}
                onClick={() => navigate(`/solicitudes/${sol.id}`)}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: ORO, fontFamily: 'monospace' }}>
                    {sol.numero_solicitud}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{sol.asegurado_nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{sol.asegurado_cedula}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{sol.tipo_causal_nombre || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{sol.regional_nombre || '—'}</Typography>
                </TableCell>
                <TableCell><StatusChip estado={sol.estado} /></TableCell>
                <TableCell><PrioridadChip prioridad={sol.prioridad} /></TableCell>
                <TableCell>
                  <PlazoIndicator fechaLimite={sol.fecha_limite} estado={sol.estado} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    {sol.fecha_recepcion ? dayjs(sol.fecha_recepcion).format('DD/MM/YYYY') : '—'}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Mi Bandeja de Trabajo</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestione sus solicitudes asignadas
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Prioridad</InputLabel>
          <Select value={prioridad} label="Prioridad" onChange={(e) => setPrioridad(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="BAJA">Baja</MenuItem>
            <MenuItem value="NORMAL">Normal</MenuItem>
            <MenuItem value="ALTA">Alta</MenuItem>
            <MenuItem value="URGENTE">Urgente</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
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
            <Tab
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>Mis Solicitudes</span>
                  {mySols?.count > 0 && (
                    <Chip label={mySols.count} size="small" sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, height: 18, fontSize: 11 }} />
                  )}
                </Stack>
              }
            />
            {isSuperAdmin && (
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>Pendientes de Asignación</span>
                    {pendSols?.count > 0 && (
                      <Chip label={pendSols.count} size="small" sx={{ bgcolor: '#2196f3', color: '#fff', fontWeight: 700, height: 18, fontSize: 11 }} />
                    )}
                  </Stack>
                }
              />
            )}
          </Tabs>
        </Box>

        <SolicitudTable rows={rows} loading={loading} />
      </Card>
    </Box>
  )
}
