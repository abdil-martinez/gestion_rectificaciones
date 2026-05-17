import React, { useState } from 'react'
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, MenuItem, FormControl, InputLabel, Select,
  Avatar, Alert, CircularProgress, Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SearchIcon from '@mui/icons-material/Search'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/auth'
import catalogosApi from '../../api/catalogos'
import { ORO, NAVY } from '../../theme'

const ROL_CHOICES = [
  { value: 'ADMIN',    label: 'Administrador' },
  { value: 'SUPER',    label: 'Súper Analista' },
  { value: 'ANALIST',  label: 'Analista' },
  { value: 'CONSULTA', label: 'Consulta' },
]

const ROL_COLORS = {
  ADMIN:    { bgcolor: '#4a1942', color: '#e91e63' },
  SUPER:    { bgcolor: '#1a237e', color: '#64b5f6' },
  ANALIST:  { bgcolor: '#1b5e20', color: '#81c784' },
  CONSULTA: { bgcolor: '#37474f', color: '#90a4ae' },
}

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser]     = useState(null)
  const [search, setSearch]         = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn:  () => getUsers({ search: search || undefined }).then((r) => r.data),
  })

  const { data: tiposRegional } = useQuery({
    queryKey: ['tipo-regional'],
    queryFn:  () => catalogosApi.tipoRegional.getAll().then((r) => r.data.results || r.data),
    staleTime: 10 * 60_000,
  })

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { username: '', email: '', first_name: '', last_name: '', rol: 'ANALIST', tipo_regional: '', password: '', password2: '' },
  })

  const openCreate = () => {
    setEditUser(null)
    reset({ username: '', email: '', first_name: '', last_name: '', rol: 'ANALIST', tipo_regional: '', password: '', password2: '' })
    setDialogOpen(true)
  }

  const openEdit = (user) => {
    setEditUser(user)
    reset({ username: user.username, email: user.email, first_name: user.first_name, last_name: user.last_name, rol: user.rol, tipo_regional: user.tipo_regional || '' })
    setDialogOpen(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editUser) {
        await updateUser(editUser.id, { email: data.email, first_name: data.first_name, last_name: data.last_name, rol: data.rol, tipo_regional: data.tipo_regional || null })
        toast.success('Usuario actualizado')
      } else {
        await createUser(data)
        toast.success('Usuario creado correctamente')
      }
      queryClient.invalidateQueries(['users'])
      setDialogOpen(false)
    } catch (err) {
      const errData = err.response?.data
      toast.error(errData ? Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n') : 'Error al guardar')
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await deleteUser(user.id)
      toast.success(user.is_active ? 'Usuario desactivado' : 'Usuario actualizado')
      queryClient.invalidateQueries(['users'])
    } catch {
      toast.error('Error al cambiar estado del usuario')
    }
  }

  const users = data?.results || data || []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Gestión de Usuarios</Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.count ?? users.length} usuarios registrados
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo Usuario
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <TextField
            placeholder="Buscar por nombre, usuario, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: 350 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: ORO }} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre completo</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Tipo Regional</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => {
                  const rolConfig = ROL_COLORS[user.rol] || {}
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            src={user.avatar || undefined}
                            sx={{ width: 32, height: 32, bgcolor: ORO, color: NAVY, fontSize: 13, fontWeight: 700 }}
                          >
                            {user.first_name?.[0] || user.username?.[0] || '?'}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{user.username}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.nombre_completo || `${user.first_name} ${user.last_name}`.trim() || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{user.email || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ROL_CHOICES.find((r) => r.value === user.rol)?.label || user.rol}
                          size="small"
                          sx={{ ...rolConfig, fontWeight: 600, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.tipo_regional_nombre || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Activo' : 'Inactivo'}
                          size="small"
                          sx={{
                            bgcolor: user.is_active ? '#1b5e20' : '#4a0000',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(user)}>
                            <EditIcon fontSize="small" sx={{ color: ORO }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.is_active ? 'Desactivar' : 'Activar'}>
                          <IconButton size="small" onClick={() => handleToggleActive(user)}>
                            {user.is_active
                              ? <BlockIcon fontSize="small" sx={{ color: '#f44336' }} />
                              : <CheckCircleIcon fontSize="small" sx={{ color: '#4caf50' }} />
                            }
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="first_name"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Nombre(s)" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Apellidos" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="username"
                control={control}
                rules={{ required: 'El usuario es requerido' }}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Usuario *" disabled={!!editUser}
                    error={!!errors.username} helperText={errors.username?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Email" type="email" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="rol"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Rol</InputLabel>
                    <Select {...field} label="Rol">
                      {ROL_CHOICES.map((r) => (
                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="tipo_regional"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Regional</InputLabel>
                    <Select {...field} label="Tipo de Regional">
                      <MenuItem value="">Ninguno</MenuItem>
                      {tiposRegional?.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            {!editUser && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="password"
                    control={control}
                    rules={{ required: 'La contraseña es requerida', minLength: { value: 8, message: 'Mínimo 8 caracteres' } }}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Contraseña *" type="password"
                        error={!!errors.password} helperText={errors.password?.message} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="password2"
                    control={control}
                    rules={{ required: 'Confirme la contraseña' }}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Confirmar contraseña *" type="password"
                        error={!!errors.password2} helperText={errors.password2?.message} />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">
            {editUser ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
