import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, Typography, Stepper, Step,
  StepLabel, Grid, TextField, MenuItem, FormControl,
  InputLabel, Select, Alert, CircularProgress, Divider,
  IconButton, Stack,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SendIcon from '@mui/icons-material/Send'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createSolicitud } from '../../api/solicitudes'
import catalogosApi from '../../api/catalogos'
import { StatusChip } from '../../components/common/StatusChip'
import { ORO, NAVY2 } from '../../theme'

const STEPS = [
  'Datos del Asegurado',
  'Datos del Empleador',
  'Detalle de Rectificación',
  'Formularios y Documentos',
  'Datos del Solicitante',
  'Resumen y Confirmación',
]

const STORAGE_KEY = 'wizard_solicitud_draft'

function StepAsegurado({ control, errors }) {
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Identificación del Asegurado
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="asegurado_data.cedula"
          control={control}
          rules={{ required: 'La cédula es requerida' }}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Cédula de Identidad *" error={!!errors.asegurado_data?.cedula}
              helperText={errors.asegurado_data?.cedula?.message} />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="asegurado_data.cua"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="CUA" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller
          name="asegurado_data.nombre"
          control={control}
          rules={{ required: 'El nombre es requerido' }}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Nombre(s) *" error={!!errors.asegurado_data?.nombre}
              helperText={errors.asegurado_data?.nombre?.message} />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller
          name="asegurado_data.ap_paterno"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Apellido Paterno" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller
          name="asegurado_data.ap_materno"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Apellido Materno" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="asegurado_data.tipo_persona"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Tipo de Persona</InputLabel>
              <Select {...field} label="Tipo de Persona">
                <MenuItem value="NAT">Natural</MenuItem>
                <MenuItem value="JUR">Jurídica</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="asegurado_data.celular"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Celular" />
          )}
        />
      </Grid>
    </Grid>
  )
}

function StepEmpleador({ control, errors }) {
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Datos del Empleador
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="empleador_data.nombre_razon_social"
          control={control}
          rules={{ required: 'La razón social es requerida' }}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Razón Social / Nombre *"
              error={!!errors.empleador_data?.nombre_razon_social}
              helperText={errors.empleador_data?.nombre_razon_social?.message} />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="empleador_data.tipo_empleador"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Tipo de Empleador</InputLabel>
              <Select {...field} label="Tipo de Empleador">
                <MenuItem value="PUBLICO">Público</MenuItem>
                <MenuItem value="PRIVADO">Privado</MenuItem>
                <MenuItem value="MIXTO">Mixto</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="empleador_data.nit"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="NIT" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="empleador_data.nombre_representante_legal"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Representante Legal" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="empleador_data.numero_documento_identidad"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="N° Documento" />
          )}
        />
      </Grid>
    </Grid>
  )
}

function StepDetalle({ control, errors }) {
  const { data: tiposCausal } = useQuery({
    queryKey: ['tipo-causal'],
    queryFn: () => catalogosApi.tipoCausal.getAll().then((r) => r.data.results || r.data),
  })
  const { data: tiposSolicitud } = useQuery({
    queryKey: ['tipo-solicitud'],
    queryFn: () => catalogosApi.tipoSolicitud.getAll().then((r) => r.data.results || r.data),
  })
  const { data: regionales } = useQuery({
    queryKey: ['regionales'],
    queryFn: () => catalogosApi.regionales.getAll().then((r) => r.data.results || r.data),
  })

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Detalle de la Rectificación
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="tipo_solicitud"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Tipo de Solicitud</InputLabel>
              <Select {...field} label="Tipo de Solicitud">
                {tiposSolicitud?.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.descripcion}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="tipo_causal"
          control={control}
          rules={{ required: 'El tipo de causal es requerido' }}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.tipo_causal}>
              <InputLabel>Tipo de Causal *</InputLabel>
              <Select {...field} label="Tipo de Causal *">
                {tiposCausal?.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="regional"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Regional</InputLabel>
              <Select {...field} label="Regional">
                {regionales?.map((r) => (
                  <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="prioridad"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Prioridad</InputLabel>
              <Select {...field} label="Prioridad">
                <MenuItem value="BAJA">Baja</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="ALTA">Alta</MenuItem>
                <MenuItem value="URGENTE">Urgente</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="fecha_recepcion"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Fecha de Recepción" type="date" InputLabelProps={{ shrink: true }} />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="fecha_limite"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Fecha Límite" type="date" InputLabelProps={{ shrink: true }} />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="detalle_causal"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth multiline rows={3} label="Detalle / Descripción de la causal" />
          )}
        />
      </Grid>
    </Grid>
  )
}

function StepFormularios({ control }) {
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Valores FPC
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Los formularios de contribución se podrán agregar en el detalle de la solicitud después de crearla.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth multiline rows={4} label="Observaciones adicionales" />
          )}
        />
      </Grid>
    </Grid>
  )
}

function StepSolicitante({ control }) {
  const { data: areas } = useQuery({
    queryKey: ['area-solicitante'],
    queryFn: () => catalogosApi.areaSolicitante.getAll().then((r) => r.data.results || r.data),
  })

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Datos del Solicitante
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="area_solicitante"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Área Solicitante</InputLabel>
              <Select {...field} label="Área Solicitante">
                {areas?.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  )
}

function StepResumen({ getValues }) {
  const values = getValues()
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: ORO }}>
        Resumen de la Solicitud
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Revise los datos antes de enviar. La solicitud se creará en estado <strong>Borrador</strong>.
      </Alert>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ bgcolor: '#0F1932' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Asegurado</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                {[values.asegurado_data?.nombre, values.asegurado_data?.ap_paterno, values.asegurado_data?.ap_materno].filter(Boolean).join(' ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">CI: {values.asegurado_data?.cedula || '—'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ bgcolor: '#0F1932' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Empleador</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                {values.empleador_data?.nombre_razon_social || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">NIT: {values.empleador_data?.nit || '—'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#0F1932' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Detalle</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Prioridad: <strong>{values.prioridad || 'NORMAL'}</strong> | Recepción: <strong>{values.fecha_recepcion || '—'}</strong>
              </Typography>
              {values.detalle_causal && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {values.detalle_causal}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default function SolicitudWizard() {
  const navigate     = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [saving, setSaving]         = useState(false)

  const { control, handleSubmit, getValues, trigger, formState: { errors } } =
    useForm({
      defaultValues: {
        asegurado_data:  { cedula: '', nombre: '', ap_paterno: '', ap_materno: '', cua: '', tipo_persona: 'NAT', celular: '' },
        empleador_data:  { nombre_razon_social: '', tipo_empleador: 'PRIVADO', nit: '', nombre_representante_legal: '', numero_documento_identidad: '' },
        tipo_solicitud:  '',
        tipo_causal:     '',
        regional:        '',
        prioridad:       'NORMAL',
        detalle_causal:  '',
        observaciones:   '',
        fecha_recepcion: '',
        fecha_limite:    '',
        area_solicitante: '',
        ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
      },
    })

  // Auto-save to localStorage
  useEffect(() => {
    const sub = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getValues()))
    }, 5000)
    return () => clearInterval(sub)
  }, [getValues])

  const FIELDS_BY_STEP = {
    0: ['asegurado_data.cedula', 'asegurado_data.nombre'],
    1: ['empleador_data.nombre_razon_social'],
    2: ['tipo_causal'],
    3: [],
    4: [],
    5: [],
  }

  const handleNext = async () => {
    const fieldsToValidate = FIELDS_BY_STEP[activeStep] || []
    const valid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate)
    if (valid) setActiveStep((s) => s + 1)
  }

  const handleBack = () => setActiveStep((s) => s - 1)

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        tipo_solicitud:   data.tipo_solicitud  || undefined,
        tipo_causal:      data.tipo_causal     || undefined,
        regional:         data.regional        || undefined,
        area_solicitante: data.area_solicitante || undefined,
        fecha_recepcion:  data.fecha_recepcion  || undefined,
        fecha_limite:     data.fecha_limite     || undefined,
      }
      const res = await createSolicitud(payload)
      localStorage.removeItem(STORAGE_KEY)
      toast.success(`Solicitud ${res.data.numero_solicitud} creada exitosamente`)
      navigate(`/solicitudes/${res.data.id}`)
    } catch (err) {
      const errData = err.response?.data
      const msg = errData
        ? Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join('\n')
        : 'Error al crear la solicitud'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const stepContent = [
    <StepAsegurado key={0} control={control} errors={errors} />,
    <StepEmpleador key={1} control={control} errors={errors} />,
    <StepDetalle   key={2} control={control} errors={errors} />,
    <StepFormularios key={3} control={control} />,
    <StepSolicitante key={4} control={control} />,
    <StepResumen   key={5} getValues={getValues} />,
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton onClick={() => navigate('/solicitudes')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>Nueva Solicitud de Rectificación</Typography>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {STEPS.map((label, idx) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: ORO },
                      '&.Mui-completed': { color: ORO },
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: activeStep === idx ? 700 : 400,
                      color: activeStep === idx ? ORO : 'text.secondary',
                    }}
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 300 }}>
            {stepContent[activeStep]}
          </Box>

          <Divider sx={{ my: 3, borderColor: '#2A3D6B' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || saving}
              startIcon={<ArrowBackIcon />}
            >
              Anterior
            </Button>

            <Typography variant="caption" color="text.secondary">
              Paso {activeStep + 1} de {STEPS.length}
            </Typography>

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                sx={{ fontWeight: 800 }}
              >
                {saving ? 'Creando...' : 'Crear Solicitud'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
