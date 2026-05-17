import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, InputAdornment, IconButton, CircularProgress,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import axios from 'axios'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { ORO, NAVY, NAVY2 } from '../../theme'

export default function Login() {
  const navigate   = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      const res = await login(data.username, data.password)
      const { access, refresh } = res.data

      const meRes = await axios.get('/api/accounts/me/', {
        headers: { Authorization: `Bearer ${access}` },
      })

      setAuth(meRes.data, access, refresh)
      toast.success(`Bienvenido, ${meRes.data.first_name || meRes.data.username}`)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(detail || 'Credenciales incorrectas. Verifique su usuario y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, #060e1f 0%, ${NAVY} 50%, #0a1428 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ORO}11 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 2,
          backgroundColor: NAVY2,
          border: `1px solid ${ORO}33`,
          boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 40px ${ORO}11`,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo / Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${ORO} 0%, #96783C 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: `0 8px 24px ${ORO}44`,
              }}
            >
              <Typography sx={{ fontSize: 32, fontWeight: 900, color: NAVY }}>G</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: ORO, letterSpacing: '-0.5px' }}>
              GNARC
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gestión de Solicitudes de Rectificación
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller
              name="username"
              control={control}
              rules={{ required: 'El usuario es requerido' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Usuario"
                  autoComplete="username"
                  autoFocus
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{ required: 'La contraseña es requerida' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Contraseña"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPass((p) => !p)} edge="end" size="small">
                          {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{
                py: 1.4,
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: `0 4px 16px ${ORO}44`,
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Ingresar'}
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 3 }}
          >
            Gestora Pública de la Seguridad Social de Largo Plazo
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
