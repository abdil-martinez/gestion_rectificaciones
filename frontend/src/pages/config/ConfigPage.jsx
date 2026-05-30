import React, { useState } from 'react'
import {
  Box, Card, CardContent, Grid, Typography, List, ListItemButton,
  ListItemText, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tooltip, Alert,
  CircularProgress, Chip, MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RestoreIcon from '@mui/icons-material/Restore'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import catalogosApi from '../../api/catalogos'
import { ORO, NAVY } from '../../theme'

const CATALOGOS = [
  { key: 'tipoSolicitud',          label: 'Tipos de Solicitud',          fields: [{ name: 'codigo', label: 'Código', required: true }, { name: 'descripcion', label: 'Descripción', required: true }] },
  { key: 'categoriaCausal',        label: 'Categorías de Causal',        fields: [{ name: 'nombre', label: 'Nombre', required: true }] },
  { key: 'tipoCausal',             label: 'Tipos de Causal',             fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'tipo', label: 'Categoría', type: 'fk_select', catalog: 'categoriaCausal', optionLabel: 'nombre', displayField: 'tipo_nombre' }] },
  { key: 'unidades',               label: 'Unidades',                    fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'descripcion', label: 'Descripción' }] },
  { key: 'regionales',             label: 'Regionales',                  fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'tipo_regional', label: 'Tipo de Regional', type: 'fk_select', catalog: 'tipoRegional', optionLabel: 'nombre', displayField: 'tipo_regional_nombre', required: true }] },
  { key: 'agencias',               label: 'Agencias',                    fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'regional', label: 'Regional', type: 'fk_select', catalog: 'regionales', optionLabel: 'nombre', displayField: 'regional_nombre', required: true }] },
  { key: 'administradoras',        label: 'Administradoras',             fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'codigo', label: 'Código', required: true }, { name: 'nit', label: 'NIT' }] },
  { key: 'tipoIdentificacion',     label: 'Tipos de Identificación',     fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'codigo', label: 'Código', required: true }] },
  { key: 'tipoPlanilla',           label: 'Tipos de Planilla',           fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'codigo', label: 'Código', required: true }] },
  { key: 'estadoDocumentacion',    label: 'Estados de Documentación',    fields: [{ name: 'nombre', label: 'Nombre', required: true }] },
  { key: 'documentos',             label: 'Documentos',                  fields: [{ name: 'codigo', label: 'Código', required: true }, { name: 'descripcion', label: 'Descripción', required: true }] },
  { key: 'areaSolicitante',        label: 'Áreas Solicitantes',          fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'codigo', label: 'Código', required: true }] },
  { key: 'estadoPlazo',            label: 'Estados de Plazo',            fields: [{ name: 'nombre', label: 'Nombre', required: true }, { name: 'limite_dias', label: 'Días Límite', type: 'number', required: true }] },
  { key: 'tipoRegional',           label: 'Tipos de Regional',           fields: [{ name: 'nombre', label: 'Nombre', required: true }] },
]

function FkSelectField({ field, fieldDef, error, helperText }) {
  const { data, isLoading } = useQuery({
    queryKey: ['config', fieldDef.catalog],
    queryFn: () => catalogosApi[fieldDef.catalog].getAll({ page_size: 200 }).then((r) => r.data.results || r.data),
    enabled: !!catalogosApi[fieldDef.catalog],
  })
  return (
    <TextField
      {...field}
      select
      label={fieldDef.label + (fieldDef.required ? ' *' : '')}
      fullWidth
      error={!!error}
      helperText={helperText}
      disabled={isLoading}
      value={field.value ?? ''}
    >
      <MenuItem value=""><em>— Seleccione —</em></MenuItem>
      {(data || []).map((opt) => (
        <MenuItem key={opt.id} value={opt.id}>{opt[fieldDef.optionLabel || 'nombre']}</MenuItem>
      ))}
    </TextField>
  )
}

function RecordDialog({ open, onClose, catalogo, record, onSave }) {
  const isEdit = !!record

  const defaultValues = React.useMemo(() => {
    const def = {}
    catalogo?.fields?.forEach((f) => {
      def[f.name] = record?.[f.name] ?? f.defaultValue ?? ''
    })
    return def
  }, [catalogo, record])

  const { control, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues })

  React.useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const onSubmit = async (data) => {
    await onSave(data)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>
        {isEdit ? 'Editar registro' : 'Nuevo registro'} — {catalogo?.label}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {catalogo?.fields?.map((f) => (
            <Controller
              key={f.name}
              name={f.name}
              control={control}
              rules={f.required ? { required: `${f.label} es requerido` } : {}}
              render={({ field }) =>
                f.type === 'fk_select' ? (
                  <FkSelectField
                    field={field}
                    fieldDef={f}
                    error={errors[f.name]}
                    helperText={errors[f.name]?.message}
                  />
                ) : f.type === 'select' ? (
                  <TextField
                    {...field}
                    select
                    label={f.label + (f.required ? ' *' : '')}
                    fullWidth
                    error={!!errors[f.name]}
                    helperText={errors[f.name]?.message}
                  >
                    {f.options?.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    {...field}
                    label={f.label + (f.required ? ' *' : '')}
                    fullWidth
                    type={f.type || 'text'}
                    error={!!errors[f.name]}
                    helperText={errors[f.name]?.message}
                  />
                )
              }
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Cancelar</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">
          {isEdit ? 'Guardar cambios' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ConfigPage() {
  const [selectedCat, setSelectedCat] = useState(CATALOGOS[0])
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editRecord, setEditRecord]   = useState(null)
  const queryClient = useQueryClient()

  const api = catalogosApi[selectedCat.key]

  const { data, isLoading } = useQuery({
    queryKey: ['config', selectedCat.key],
    queryFn:  () => api.getAll({ page_size: 100 }).then((r) => r.data.results || r.data),
    enabled:  !!api,
  })

  const handleSave = async (formData) => {
    try {
      if (editRecord) {
        await api.update(editRecord.id, formData)
        toast.success('Registro actualizado')
      } else {
        await api.create(formData)
        toast.success('Registro creado')
      }
      queryClient.invalidateQueries(['config', selectedCat.key])
      setDialogOpen(false)
      setEditRecord(null)
    } catch (err) {
      toast.error('Error al guardar: ' + JSON.stringify(err.response?.data || err.message))
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.remove(id)
      toast.success('Registro eliminado')
      queryClient.invalidateQueries(['config', selectedCat.key])
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const getDisplayFields = () => {
    return selectedCat.fields.slice(0, 3)
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Configuración del Sistema
      </Typography>

      <Grid container spacing={2.5}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #2A3D6B' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Catálogos
                </Typography>
              </Box>
              <List dense disablePadding>
                {CATALOGOS.map((cat) => (
                  <ListItemButton
                    key={cat.key}
                    selected={selectedCat.key === cat.key}
                    onClick={() => setSelectedCat(cat)}
                    sx={{ py: 1 }}
                  >
                    <ListItemText
                      primary={cat.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: selectedCat.key === cat.key ? 700 : 400,
                        color: selectedCat.key === cat.key ? ORO : 'text.primary',
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Content */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" fontWeight={700}>{selectedCat.label}</Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => { setEditRecord(null); setDialogOpen(true) }}
                >
                  Nuevo
                </Button>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: ORO }} size={32} />
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        {getDisplayFields().map((f) => (
                          <TableCell key={f.name}>{f.label}</TableCell>
                        ))}
                        <TableCell>Estado</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!data || data.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No hay registros.
                          </TableCell>
                        </TableRow>
                      )}
                      {data?.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{row.id}</TableCell>
                          {getDisplayFields().map((f) => (
                            <TableCell key={f.name}>
                              <Typography variant="body2">{row[f.displayField || f.name] || '—'}</Typography>
                            </TableCell>
                          ))}
                          <TableCell>
                            <Chip
                              label={row.deleted_at ? 'Inactivo' : 'Activo'}
                              size="small"
                              sx={{
                                bgcolor: row.deleted_at ? '#4a0000' : '#1b5e20',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: 11,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => { setEditRecord(row); setDialogOpen(true) }}
                              >
                                <EditIcon fontSize="small" sx={{ color: ORO }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={row.deleted_at ? 'Restaurar' : 'Eliminar'}>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(row.id)}
                              >
                                {row.deleted_at
                                  ? <RestoreIcon fontSize="small" sx={{ color: '#4caf50' }} />
                                  : <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
                                }
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <RecordDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null) }}
        catalogo={selectedCat}
        record={editRecord}
        onSave={handleSave}
      />
    </Box>
  )
}
