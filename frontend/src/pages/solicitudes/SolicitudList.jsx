import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, Chip, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Typography, IconButton, Tooltip,
  MenuItem, Select, FormControl, InputLabel, Grid, Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getSolicitudes, exportarExcel } from '../../api/solicitudes'
import { StatusChip, PrioridadChip } from '../../components/common/StatusChip'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import { ORO } from '../../theme'
import toast from 'react-hot-toast'

const ESTADOS = [
  { value: 'BOR', label: 'Borrador' },
  { value: 'PEND', label: 'Pendiente' },
  { value: 'ASIG', label: 'Asignado' },
  { value: 'REV', label: 'En Revisión' },
  { value: 'APRO', label: 'Aprobado' },
  { value: 'RECH', label: 'Rechazado' },
  { value: 'DEV', label: 'Devuelto' },
  { value: 'FIN', label: 'Finalizado' },
  { value: 'ANU', label: 'Anulado' },
]

export default function SolicitudList() {
  const navigate    = useNavigate()
  const { user }    = useAuthStore()
  const [page, setPage]         = useState(0)
  const [rowsPerPage]           = useState(20)
  const [search, setSearch]     = useState('')
  const [estado, setEstado]     = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [exportLoading, setExportLoading] = useState(false)

  const params = {
    page: page + 1,
    search:      search || undefined,
    estado:      estado || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['solicitudes', params],
    queryFn:  () => getSolicitudes(params).then((r) => r.data),
  })

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await exportarExcel({
        estado:      estado || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
      })
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
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exportLoading}
            size="small"
          >
            Exportar Excel
          </Button>
          {['ADMIN', 'SUPER', 'ANALIST'].includes(user?.rol) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/solicitudes/nueva')}
            >
              Nueva Solicitud
            </Button>
          )}
        </Stack>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Buscar por N°, asegurado, CI..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estado}
                  label="Estado"
                  onChange={(e) => { setEstado(e.target.value); setPage(0) }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {ESTADOS.map((e) => (
                    <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPage(0) }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPage(0) }}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => { setSearch(''); setEstado(''); setFechaDesde(''); setFechaHasta(''); setPage(0) }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner message="Cargando solicitudes..." />
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N° Solicitud</TableCell>
                    <TableCell>Asegurado</TableCell>
                    <TableCell>CI</TableCell>
                    <TableCell>Tipo Causal</TableCell>
                    <TableCell>Regional</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Prioridad</TableCell>
                    <TableCell>Analista</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.results?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No se encontraron solicitudes con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.results?.map((sol) => (
                    <TableRow
                      key={sol.id}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/solicitudes/${sol.id}`)}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: ORO, fontFamily: 'monospace' }}
                        >
                          {sol.numero_solicitud}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {sol.asegurado_nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {sol.asegurado_cedula}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {sol.tipo_causal_nombre || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {sol.regional_nombre || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip estado={sol.estado} />
                      </TableCell>
                      <TableCell>
                        <PrioridadChip prioridad={sol.prioridad} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {sol.analista_nombre || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {sol.created_at ? dayjs(sol.created_at).format('DD/MM/YYYY') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Ver detalle">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/solicitudes/${sol.id}`)}
                          >
                            <VisibilityIcon fontSize="small" sx={{ color: ORO }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data?.count || 0}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[20]}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
              sx={{ borderTop: '1px solid #2A3D6B' }}
            />
          </>
        )}
      </Card>
    </Box>
  )
}
