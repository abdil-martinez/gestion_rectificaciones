import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, Typography, Stepper, Step,
  StepLabel, Grid, TextField, MenuItem, FormControl,
  InputLabel, Select, Alert, CircularProgress, Divider,
  IconButton, Stack, Table, TableHead, TableRow, TableCell,
  TableBody, Checkbox, Chip, Tooltip, LinearProgress, StepConnector,
} from '@mui/material'
import { stepConnectorClasses } from '@mui/material/StepConnector'
import { styled } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SendIcon from '@mui/icons-material/Send'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import AssignmentIcon from '@mui/icons-material/Assignment'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import BadgeIcon from '@mui/icons-material/Badge'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import SearchIcon from '@mui/icons-material/Search'
import WorkIcon from '@mui/icons-material/Work'
import ListAltIcon from '@mui/icons-material/ListAlt'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import toast from 'react-hot-toast'
import { createSolicitud, createFormulario, createDocumentoRespaldo, getAsegurados, getEmpleadores } from '../../api/solicitudes'
import catalogosApi from '../../api/catalogos'
import { useAuthStore } from '../../store/authStore'
import { getMe } from '../../api/auth'
import { ORO } from '../../theme'
import SolicitudPDF from '../../components/SolicitudPDF'

/* ── Metadatos de pasos ─────────────────────────────────────────────── */
const STEPS = [
  { label: 'Datos del Asegurado',       icon: PersonIcon,      desc: 'Identificación del beneficiario' },
  { label: 'Datos del Empleador',        icon: BusinessIcon,    desc: 'Empresa o empleador' },
  { label: 'Detalle de Rectificación',   icon: AssignmentIcon,  desc: 'Causal y detalles' },
  { label: 'Formularios y Documentos',   icon: FolderOpenIcon,  desc: 'FPCs y respaldos' },
  { label: 'Datos del Solicitante',      icon: BadgeIcon,       desc: 'Información del gestor' },
  { label: 'Resumen y Confirmación',     icon: FactCheckIcon,   desc: 'Revisión final' },
]

const STORAGE_KEY = 'wizard_solicitud_draft'

/* ── Conector animado ───────────────────────────────────────────────── */
const GlowConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 20, left: 'calc(-50% + 22px)', right: 'calc(50% + 22px)',
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#2A3D6B', borderTopWidth: 2, transition: 'border-color 0.4s ease',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    borderColor: ORO,
    boxShadow: `0 0 6px ${ORO}66`,
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    borderColor: ORO,
  },
}))

/* ── Ícono personalizado de paso ────────────────────────────────────── */
function CustomStepIcon({ active, completed, icon: stepNum }) {
  const Icon = STEPS[(stepNum - 1)]?.icon || CheckCircleIcon
  return (
    <Box sx={{
      width: 42, height: 42, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: completed
        ? `linear-gradient(135deg, ${ORO} 0%, #b8943e 100%)`
        : active
          ? `linear-gradient(135deg, ${ORO}22 0%, ${ORO}08 100%)`
          : 'rgba(15, 25, 50, 0.9)',
      border: `2px solid ${completed ? ORO : active ? ORO : '#2A3D6B'}`,
      boxShadow: active ? `0 0 14px ${ORO}55, 0 0 4px ${ORO}33` : completed ? `0 2px 8px ${ORO}44` : 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {completed
        ? <CheckCircleIcon sx={{ fontSize: 20, color: '#0F1932' }} />
        : <Icon sx={{ fontSize: 20, color: active ? ORO : '#4a6080', transition: 'color 0.3s ease' }} />
      }
    </Box>
  )
}

/* ── Encabezado de sección con gradiente ────────────────────────────── */
function SectionHeader({ icon, title, subtitle }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      mb: 2.5, px: 2, py: 1.5,
      background: `linear-gradient(90deg, ${ORO}18 0%, ${ORO}06 50%, transparent 100%)`,
      borderLeft: `3px solid ${ORO}`,
      borderRadius: '0 8px 8px 0',
    }}>
      <Box sx={{ color: ORO, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        )}
      </Box>
    </Box>
  )
}

/* ── Grupo de campos con fondo sutil ────────────────────────────────── */
function FieldGroup({ title, children }) {
  return (
    <Box sx={{
      border: '1px solid rgba(42,61,107,0.5)',
      borderRadius: 2, p: 2.5, mb: 2.5,
      background: 'rgba(15, 25, 50, 0.35)',
      backdropFilter: 'blur(4px)',
    }}>
      {title && (
        <Typography variant="caption" sx={{
          display: 'block', mb: 2, fontWeight: 700,
          textTransform: 'uppercase', fontSize: '0.68rem',
          color: `${ORO}cc`, letterSpacing: '0.08em',
        }}>
          {title}
        </Typography>
      )}
      {children}
    </Box>
  )
}

/* ── Paso 1: Asegurado ──────────────────────────────────────────────── */
function StepAsegurado({ control, errors, setValue }) {
  const [buscando, setBuscando]       = React.useState(false)
  const [encontrado, setEncontrado]   = React.useState(null)

  const { data: tiposIdData } = useQuery({
    queryKey: ['tipo-identificacion'],
    queryFn:  () => catalogosApi.tipoIdentificacion.getAll({ activo: true }),
    staleTime: 5 * 60_000,
  })
  const tiposId = tiposIdData?.data?.results ?? tiposIdData?.data ?? []

  const llenarDesdeAsegurado = (a) => {
    setValue('asegurado_data.cua',                a.cua                ?? '')
    setValue('asegurado_data.tipo_identificacion', a.tipo_identificacion ?? '')
    setValue('asegurado_data.cedula',              a.cedula             ?? '')
    setValue('asegurado_data.tipo_persona',        a.tipo_persona       ?? 'NAT')
    setValue('asegurado_data.nombre',              a.nombre             ?? '')
    setValue('asegurado_data.ap_paterno',          a.ap_paterno         ?? '')
    setValue('asegurado_data.ap_materno',          a.ap_materno         ?? '')
    setValue('asegurado_data.celular',             a.celular            ?? '')
    setEncontrado(true)
    toast.success('Datos del asegurado cargados automáticamente')
  }

  const buscarPorCua = async (cua) => {
    if (!cua?.trim()) return
    setBuscando(true); setEncontrado(null)
    try {
      const res = await getAsegurados({ cua: cua.trim() })
      const lista = res.data?.results ?? res.data ?? []
      lista.length > 0 ? llenarDesdeAsegurado(lista[0]) : setEncontrado(false)
    } catch { setEncontrado(false) }
    finally  { setBuscando(false) }
  }

  const buscarPorCedula = async (cedula) => {
    if (!cedula?.trim()) return
    setBuscando(true); setEncontrado(null)
    try {
      const res = await getAsegurados({ cedula: cedula.trim() })
      const lista = res.data?.results ?? res.data ?? []
      lista.length > 0 ? llenarDesdeAsegurado(lista[0]) : setEncontrado(false)
    } catch { setEncontrado(false) }
    finally  { setBuscando(false) }
  }

  return (
    <Box>
      <SectionHeader icon={<PersonIcon />} title="Identificación del Asegurado" subtitle="Busque por CUA o cédula para autocompletar" />

      {encontrado === true && (
        <Alert severity="success" onClose={() => setEncontrado(null)} sx={{ mb: 2 }}>
          Asegurado encontrado — campos completados automáticamente. Puede editar si es necesario.
        </Alert>
      )}
      {encontrado === false && (
        <Alert severity="info" onClose={() => setEncontrado(null)} sx={{ mb: 2 }}>
          Asegurado no encontrado — complete los datos manualmente.
        </Alert>
      )}

      <FieldGroup title="Búsqueda rápida">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller name="asegurado_data.cua" control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="CUA"
                  onBlur={(e) => { field.onBlur(); buscarPorCua(e.target.value) }}
                  InputProps={{ endAdornment: buscando ? <CircularProgress size={18} /> : <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} /> }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="asegurado_data.cedula" control={control}
              rules={{ required: 'La cédula es requerida' }}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Cédula de Identidad *"
                  error={!!errors.asegurado_data?.cedula}
                  helperText={errors.asegurado_data?.cedula?.message}
                  onBlur={(e) => { field.onBlur(); buscarPorCedula(e.target.value) }}
                  InputProps={{ endAdornment: buscando ? <CircularProgress size={18} /> : <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} /> }}
                />
              )}
            />
          </Grid>
        </Grid>
      </FieldGroup>

      <FieldGroup title="Datos personales">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller name="asegurado_data.tipo_identificacion" control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Tipo de Identificación</InputLabel>
                  <Select {...field} label="Tipo de Identificación" value={field.value ?? ''}>
                    <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                    {tiposId.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="asegurado_data.tipo_persona" control={control}
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
          <Grid item xs={12} sm={4}>
            <Controller name="asegurado_data.nombre" control={control}
              rules={{ required: 'El nombre es requerido' }}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Nombre(s) *"
                  error={!!errors.asegurado_data?.nombre}
                  helperText={errors.asegurado_data?.nombre?.message} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller name="asegurado_data.ap_paterno" control={control}
              render={({ field }) => <TextField {...field} fullWidth label="Apellido Paterno" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller name="asegurado_data.ap_materno" control={control}
              render={({ field }) => <TextField {...field} fullWidth label="Apellido Materno" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="asegurado_data.celular" control={control}
              render={({ field }) => <TextField {...field} fullWidth label="Celular" />}
            />
          </Grid>
        </Grid>
      </FieldGroup>
    </Box>
  )
}

/* ── Paso 2: Empleador ──────────────────────────────────────────────── */
function StepEmpleador({ control, errors, setValue }) {
  const [buscando, setBuscando]     = React.useState(false)
  const [encontrado, setEncontrado] = React.useState(null)

  const { data: tiposIdData } = useQuery({
    queryKey: ['tipo-identificacion'],
    queryFn:  () => catalogosApi.tipoIdentificacion.getAll({ activo: true }),
    staleTime: 5 * 60_000,
  })
  const tiposId = tiposIdData?.data?.results ?? tiposIdData?.data ?? []

  const llenarDesdeEmpleador = (e) => {
    setValue('empleador_data.numero_documento_identidad', e.numero_documento_identidad ?? '')
    setValue('empleador_data.tipo_identificacion',        e.tipo_identificacion        ?? '')
    setValue('empleador_data.nombre_razon_social',        e.nombre_razon_social        ?? '')
    setValue('empleador_data.tipo_empleador',             e.tipo_empleador             ?? 'PRIVADO')
    setValue('empleador_data.nit',                        e.nit                        ?? '')
    setValue('empleador_data.nombre_representante_legal', e.nombre_representante_legal ?? '')
    setValue('empleador_data.cua_representante_legal',    e.cua_representante_legal    ?? '')
    setValue('empleador_data.numero_documento_representante', e.numero_documento_representante ?? '')
    setEncontrado(true)
    toast.success('Datos del empleador cargados automáticamente')
  }

  const buscarPorNumDoc = async (numDoc) => {
    if (!numDoc?.trim()) return
    setBuscando(true); setEncontrado(null)
    try {
      const res = await getEmpleadores({ numero_documento_identidad: numDoc.trim() })
      const lista = res.data?.results ?? res.data ?? []
      lista.length > 0 ? llenarDesdeEmpleador(lista[0]) : setEncontrado(false)
    } catch { setEncontrado(false) }
    finally  { setBuscando(false) }
  }

  return (
    <Box>
      <SectionHeader icon={<BusinessIcon />} title="Datos del Empleador" subtitle="Ingrese el N° de identificación para autocompletar" />

      {encontrado === true && (
        <Alert severity="success" onClose={() => setEncontrado(null)} sx={{ mb: 2 }}>
          Empleador encontrado — campos completados automáticamente.
        </Alert>
      )}
      {encontrado === false && (
        <Alert severity="info" onClose={() => setEncontrado(null)} sx={{ mb: 2 }}>
          Empleador no encontrado — complete los datos manualmente.
        </Alert>
      )}

      <FieldGroup title="Identificación del empleador">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller name="empleador_data.numero_documento_identidad" control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="N° de Identificación"
                  onBlur={(e) => { field.onBlur(); buscarPorNumDoc(e.target.value) }}
                  InputProps={{ endAdornment: buscando ? <CircularProgress size={18} /> : <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} /> }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="empleador_data.tipo_identificacion" control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Tipo de Identificación</InputLabel>
                  <Select {...field} label="Tipo de Identificación" value={field.value ?? ''}>
                    <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                    {tiposId.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller name="empleador_data.nombre_razon_social" control={control}
              rules={{ required: 'La razón social es requerida' }}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Razón Social / Nombre *"
                  error={!!errors.empleador_data?.nombre_razon_social}
                  helperText={errors.empleador_data?.nombre_razon_social?.message} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="empleador_data.tipo_empleador" control={control}
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
        </Grid>
      </FieldGroup>

      <FieldGroup title="Representante legal">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller name="empleador_data.nombre_representante_legal" control={control}
              render={({ field }) => <TextField {...field} fullWidth label="Representante Legal" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="empleador_data.cua_representante_legal" control={control}
              render={({ field }) => <TextField {...field} fullWidth label="CUA Representante Legal" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="empleador_data.numero_documento_representante" control={control}
              render={({ field }) => <TextField {...field} fullWidth label="N° Doc. Representante" />}
            />
          </Grid>
        </Grid>
      </FieldGroup>
    </Box>
  )
}

/* ── Paso 3: Detalle ────────────────────────────────────────────────── */
function StepDetalle({ control, errors, setValue }) {
  const [tipoRegionalId, setTipoRegionalId] = React.useState('')

  const { data: tiposCausal }    = useQuery({ queryKey: ['tipo-causal'],    queryFn: () => catalogosApi.tipoCausal.getAll().then((r) => r.data.results || r.data) })
  const { data: tiposSolicitud } = useQuery({ queryKey: ['tipo-solicitud'], queryFn: () => catalogosApi.tipoSolicitud.getAll().then((r) => r.data.results || r.data) })
  const { data: tiposRegional }  = useQuery({ queryKey: ['tipo-regional'],  queryFn: () => catalogosApi.tipoRegional.getAll().then((r) => r.data.results || r.data), staleTime: 10 * 60_000 })
  const { data: regionales }     = useQuery({
    queryKey: ['regionales', tipoRegionalId],
    queryFn:  () => catalogosApi.regionales.getAll(tipoRegionalId ? { tipo_regional: tipoRegionalId } : {}).then((r) => r.data.results || r.data),
  })
  const { data: administradoras } = useQuery({ queryKey: ['administradoras'], queryFn: () => catalogosApi.administradoras.getAll().then((r) => r.data.results || r.data), staleTime: 5 * 60_000 })

  return (
    <Box>
      <SectionHeader icon={<AssignmentIcon />} title="Detalle de la Rectificación" subtitle="Causal, regional y fechas del proceso" />

      <FieldGroup title="Clasificación">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller name="tipo_solicitud" control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Tipo de Solicitud</InputLabel>
                  <Select {...field} label="Tipo de Solicitud">
                    {tiposSolicitud?.map((t) => <MenuItem key={t.id} value={t.id}>{t.descripcion}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="tipo_causal" control={control}
              rules={{ required: 'El tipo de causal es requerido' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.tipo_causal}>
                  <InputLabel>Tipo de Causal *</InputLabel>
                  <Select {...field} label="Tipo de Causal *">
                    {tiposCausal?.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Regional</InputLabel>
              <Select value={tipoRegionalId} label="Tipo de Regional"
                onChange={(e) => { setTipoRegionalId(e.target.value); setValue('regional', '') }}>
                <MenuItem value=""><em>— Todos —</em></MenuItem>
                {tiposRegional?.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="regional" control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Regional (Departamento)</InputLabel>
                  <Select {...field} label="Regional (Departamento)" value={field.value ?? ''}>
                    <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                    {regionales?.map((r) => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="prioridad" control={control}
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
            <Controller name="administradora" control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>AFP Origen</InputLabel>
                  <Select {...field} label="AFP Origen" value={field.value ?? ''}>
                    <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                    {administradoras?.map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </FieldGroup>

      <FieldGroup title="Fechas y descripción">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller name="fecha_recepcion" control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Fecha de Recepción" type="date" InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller name="fecha_limite" control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Fecha Límite" type="date" InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller name="detalle_causal" control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth multiline rows={3} label="Detalle / Descripción de la causal" />
              )}
            />
          </Grid>
        </Grid>
      </FieldGroup>
    </Box>
  )
}

/* ── Paso 4: Formularios y Documentos ───────────────────────────────── */
function StepFormularios({ fpcRows, setFpcRows, docSelections, setDocSelections }) {
  const fileRefs = useRef({})

  const { data: tiposPlanilla = [] } = useQuery({ queryKey: ['tipo-planilla'],       queryFn: () => catalogosApi.tipoPlanilla.getAll().then((r) => r.data.results || r.data) })
  const { data: catalogosDocs = [] } = useQuery({ queryKey: ['catalogo-documentos'], queryFn: () => catalogosApi.documentos.getAll().then((r) => r.data.results || r.data) })

  const emptyFpc = () => ({ numero: '', periodo: '', tipo_planilla: '', total_ganado: '' })
  const addFpc    = () => setFpcRows((r) => [...r, emptyFpc()])
  const removeFpc = (idx) => setFpcRows((r) => r.filter((_, i) => i !== idx))
  const updateFpc = (idx, field, val) =>
    setFpcRows((rows) => rows.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const toggleDoc  = (docId) =>
    setDocSelections((prev) => ({ ...prev, [docId]: { ...prev[docId], checked: !prev[docId]?.checked, file: prev[docId]?.file || null } }))
  const attachFile = (docId, file) =>
    setDocSelections((prev) => ({ ...prev, [docId]: { ...prev[docId], checked: true, file } }))

  const headSx = { py: 0.8, px: 1, color: ORO, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid #2A3D6B', whiteSpace: 'nowrap' }
  const cellSx = { py: 0.6, px: 1, fontSize: '0.82rem', borderBottom: '1px solid #2A3D6B' }

  return (
    <Box>
      <SectionHeader icon={<FolderOpenIcon />} title="Formularios y Documentos" subtitle="Registre los FPC y la documentación de respaldo" />

      {/* FPC */}
      <Box sx={{ border: '1px solid rgba(42,61,107,0.5)', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: 2, py: 1.5,
          background: `linear-gradient(90deg, ${ORO}12 0%, transparent 100%)`,
          borderBottom: '1px solid rgba(42,61,107,0.5)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ListAltIcon sx={{ color: ORO, fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: ORO }}>
              Rectificador FPC — Formularios de Contribución
            </Typography>
          </Box>
          <Button size="small" startIcon={<AddIcon />} onClick={addFpc} variant="outlined"
            sx={{ color: ORO, borderColor: ORO, '&:hover': { bgcolor: `${ORO}11` } }}>
            Agregar FPC
          </Button>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['N°', 'N° FPC', 'Período', 'Tipo Planilla', 'Total Ganado (Bs.)', ''].map((h) => (
                  <TableCell key={h} sx={headSx}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {fpcRows.map((row, idx) => (
                <TableRow key={idx} sx={{
                  bgcolor: idx % 2 === 0 ? '#0F1932' : '#0a1428',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: `${ORO}08` },
                }}>
                  <TableCell sx={{ ...cellSx, color: `${ORO}88`, fontWeight: 700, width: 40 }}>{idx + 1}</TableCell>
                  <TableCell sx={cellSx}>
                    <TextField size="small" variant="standard" placeholder="N° FPC" value={row.numero}
                      onChange={(e) => updateFpc(idx, 'numero', e.target.value)}
                      inputProps={{ style: { fontSize: '0.82rem' } }} sx={{ width: 90 }} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <TextField size="small" variant="standard" placeholder="YYYY-MM" value={row.periodo}
                      onChange={(e) => updateFpc(idx, 'periodo', e.target.value)}
                      inputProps={{ style: { fontSize: '0.82rem' } }} sx={{ width: 90 }} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Select size="small" variant="standard" value={row.tipo_planilla}
                      onChange={(e) => updateFpc(idx, 'tipo_planilla', e.target.value)}
                      sx={{ fontSize: '0.82rem', minWidth: 150 }} displayEmpty>
                      <MenuItem value=""><em>Seleccionar</em></MenuItem>
                      {tiposPlanilla.map((t) => <MenuItem key={t.id} value={t.id} sx={{ fontSize: '0.82rem' }}>{t.nombre}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <TextField size="small" variant="standard" placeholder="0.00" value={row.total_ganado}
                      onChange={(e) => updateFpc(idx, 'total_ganado', e.target.value)}
                      inputProps={{ style: { fontSize: '0.82rem', textAlign: 'right' } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                    <Tooltip title="Eliminar fila">
                      <IconButton size="small" onClick={() => removeFpc(idx)}>
                        <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {fpcRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Sin formularios. Haga clic en "Agregar FPC" para ingresar los datos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* Documentos */}
      <Box sx={{ border: '1px solid rgba(42,61,107,0.5)', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 1.5,
          background: `linear-gradient(90deg, ${ORO}12 0%, transparent 100%)`,
          borderBottom: '1px solid rgba(42,61,107,0.5)',
        }}>
          <AttachFileIcon sx={{ color: ORO, fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: ORO }}>
            Documentación de Respaldo
          </Typography>
        </Box>
        {catalogosDocs.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={20} sx={{ color: ORO }} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Recibido', 'Código', 'Documento', 'Archivo adjunto'].map((h) => (
                  <TableCell key={h} sx={headSx}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {catalogosDocs.map((doc, idx) => {
                const sel = docSelections[doc.id] || {}
                return (
                  <TableRow key={doc.id} sx={{
                    bgcolor: sel.checked ? `${ORO}08` : idx % 2 === 0 ? '#0F1932' : '#0a1428',
                    transition: 'background 0.2s',
                    '&:hover': { bgcolor: `${ORO}10` },
                  }}>
                    <TableCell sx={{ py: 0.5, px: 1, borderBottom: '1px solid #2A3D6B', width: 48 }}>
                      <Checkbox checked={!!sel.checked} onChange={() => toggleDoc(doc.id)} size="small"
                        sx={{ color: ORO, '&.Mui-checked': { color: ORO }, p: 0 }} />
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.secondary', borderBottom: '1px solid #2A3D6B' }}>
                      {doc.codigo}
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.85rem', fontWeight: sel.checked ? 600 : 400, borderBottom: '1px solid #2A3D6B', color: sel.checked ? '#fff' : 'text.secondary' }}>
                      {doc.descripcion}
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1, borderBottom: '1px solid #2A3D6B' }}>
                      <input type="file" ref={(el) => { fileRefs.current[doc.id] = el }} style={{ display: 'none' }}
                        onChange={(e) => e.target.files[0] && attachFile(doc.id, e.target.files[0])} />
                      {sel.file ? (
                        <Chip icon={<AttachFileIcon sx={{ fontSize: '14px !important' }} />}
                          label={sel.file.name} size="small" onClick={() => fileRefs.current[doc.id]?.click()}
                          sx={{ bgcolor: `${ORO}22`, color: ORO, fontSize: '0.72rem', maxWidth: 200 }} />
                      ) : (
                        <Tooltip title="Adjuntar archivo">
                          <IconButton size="small" onClick={() => fileRefs.current[doc.id]?.click()}>
                            <UploadFileIcon fontSize="small" sx={{ color: sel.checked ? ORO : 'text.disabled' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  )
}

/* ── Paso 5: Solicitante ────────────────────────────────────────────── */
function StepSolicitante({ control }) {
  const userStore  = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => getMe().then((r) => r.data),
    staleTime: 60_000,
    onSuccess: (data) => updateUser(data),
  })
  const { data: unidades } = useQuery({
    queryKey: ['unidades'],
    queryFn:  () => catalogosApi.unidades.getAll().then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })

  const user = meData || userStore

  const InfoField = ({ label, value }) => (
    <Box>
      <Typography variant="caption" sx={{ color: `${ORO}99`, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.3 }}>{value || '—'}</Typography>
    </Box>
  )

  return (
    <Box>
      <SectionHeader icon={<BadgeIcon />} title="Datos del Solicitante" subtitle="Datos del usuario en sesión" />

      <FieldGroup title="Información del usuario en sesión">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
          <InfoField label="Nombre Completo"    value={user?.nombre_completo || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()} />
          <InfoField label="Correo Electrónico" value={user?.email} />
          <InfoField label="Teléfono"           value={user?.telefono} />
          <InfoField label="Tipo de Regional"   value={user?.tipo_regional_nombre} />
          <InfoField label="Regional"           value={user?.regional_nombre} />
          <InfoField label="Unidad"             value={user?.unidad_nombre} />
        </Box>
      </FieldGroup>

      <FieldGroup title="Unidad solicitante">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Controller name="area_solicitante" control={control}
              render={({ field }) => {
                if (!field.value && user?.unidad) setTimeout(() => field.onChange(user.unidad), 0)
                return (
                  <FormControl fullWidth>
                    <InputLabel>Unidad Solicitante</InputLabel>
                    <Select {...field} label="Unidad Solicitante" value={field.value ?? ''}>
                      <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                      {unidades?.map((u) => <MenuItem key={u.id} value={u.id}>{u.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                )
              }}
            />
          </Grid>
        </Grid>
      </FieldGroup>
    </Box>
  )
}

/* ── Paso 6: Resumen ────────────────────────────────────────────────── */
function StepResumen({ getValues, fpcRows, docSelections }) {
  const values     = getValues()
  const fpcValidos = fpcRows.filter((r) => r.periodo)
  const docsChecked = Object.entries(docSelections).filter(([, s]) => s.checked)
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: tiposPlanilla = [] } = useQuery({ queryKey: ['tipo-planilla'],       queryFn: () => catalogosApi.tipoPlanilla.getAll().then((r) => r.data.results || r.data), staleTime: 5 * 60_000 })
  const { data: catalogosDocs = [] } = useQuery({ queryKey: ['catalogo-documentos'], queryFn: () => catalogosApi.documentos.getAll().then((r) => r.data.results || r.data), staleTime: 5 * 60_000 })
  const { data: tiposCausal   = [] } = useQuery({ queryKey: ['tipo-causal'],         queryFn: () => catalogosApi.tipoCausal.getAll().then((r) => r.data.results || r.data), staleTime: 10 * 60_000 })
  const { data: regionales    = [] } = useQuery({ queryKey: ['regionales-all'],      queryFn: () => catalogosApi.regionales.getAll({ page_size: 200 }).then((r) => r.data.results || r.data), staleTime: 10 * 60_000 })

  const getPlanilla = (id) => tiposPlanilla.find((t) => t.id === Number(id))?.nombre || '—'
  const getDocInfo  = (id) => catalogosDocs.find((d) => d.id === Number(id))

  const handleDescargarPDF = async () => {
    setPdfLoading(true)
    try {
      const blob = await pdf(
        <SolicitudPDF values={values} fpcRows={fpcRows} docsChecked={docsChecked}
          tiposPlanilla={tiposPlanilla} catalogosDocs={catalogosDocs}
          tiposCausal={tiposCausal} regionales={regionales} numero={null} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'solicitud_rectificacion_borrador.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { toast.error('Error al generar PDF: ' + e.message) }
    finally { setPdfLoading(false) }
  }

  const headSx = { py: 0.8, px: 1, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: ORO, borderBottom: `2px solid #2A3D6B`, whiteSpace: 'nowrap' }
  const cellSx = { py: 0.6, px: 1, fontSize: '0.82rem', borderBottom: '1px solid #2A3D6B' }

  const SummaryCard = ({ icon: Icon, label, primary, secondary, accent }) => (
    <Card variant="outlined" sx={{
      position: 'relative', overflow: 'hidden',
      border: `1px solid ${accent || ORO}44`,
      background: `linear-gradient(135deg, ${accent || ORO}10 0%, transparent 60%)`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 20px ${accent || ORO}22` },
    }}>
      <Box sx={{ position: 'absolute', top: -8, right: -8, opacity: 0.07 }}>
        <Icon sx={{ fontSize: 72, color: accent || ORO }} />
      </Box>
      <CardContent sx={{ py: 1.5, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
          <Icon sx={{ color: accent || ORO, fontSize: 16 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>
            {label}
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.3 }}>{primary || '—'}</Typography>
        {secondary && <Typography variant="caption" color="text.secondary">{secondary}</Typography>}
      </CardContent>
    </Card>
  )

  return (
    <Box>
      <SectionHeader icon={<FactCheckIcon />} title="Resumen y Confirmación" subtitle="Revise los datos antes de crear la solicitud" />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
        <Alert severity="info" sx={{ flex: 1, mb: 0 }}>
          La solicitud se creará en estado <strong>Borrador</strong>. Podrá enviarla desde el detalle.
        </Alert>
        <Button variant="outlined" size="small"
          startIcon={pdfLoading ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
          disabled={pdfLoading} onClick={handleDescargarPDF}
          sx={{ whiteSpace: 'nowrap', borderColor: ORO, color: ORO, '&:hover': { borderColor: ORO, bgcolor: `${ORO}18` } }}>
          {pdfLoading ? 'Generando…' : 'Descargar PDF'}
        </Button>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <SummaryCard icon={PersonIcon} label="Asegurado"
            primary={[values.asegurado_data?.nombre, values.asegurado_data?.ap_paterno, values.asegurado_data?.ap_materno].filter(Boolean).join(' ')}
            secondary={`CI: ${values.asegurado_data?.cedula || '—'}${values.asegurado_data?.cua ? ` · CUA: ${values.asegurado_data.cua}` : ''}`}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SummaryCard icon={BusinessIcon} label="Empleador"
            primary={values.empleador_data?.nombre_razon_social}
            secondary={`N° Doc: ${values.empleador_data?.numero_documento_identidad || '—'}`}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SummaryCard icon={AssignmentIcon} label="Detalle"
            primary={`Prioridad: ${values.prioridad || 'NORMAL'}`}
            secondary={values.fecha_recepcion ? `Recepción: ${values.fecha_recepcion}` : undefined}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SummaryCard icon={FolderOpenIcon} label="Totales"
            primary={`${fpcValidos.length} formulario(s) FPC`}
            secondary={`${docsChecked.length} documento(s) de respaldo`}
            accent="#4fc3f7"
          />
        </Grid>
      </Grid>

      {/* Tabla FPC */}
      {fpcValidos.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ListAltIcon sx={{ color: ORO, fontSize: 16 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: ORO }}>
              Formularios FPC ({fpcValidos.length})
            </Typography>
          </Box>
          <Box sx={{ border: '1px solid #2A3D6B', borderRadius: 1, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>#</TableCell>
                  <TableCell sx={headSx}>N° FPC</TableCell>
                  <TableCell sx={headSx}>Período</TableCell>
                  <TableCell sx={headSx}>Tipo Planilla</TableCell>
                  <TableCell sx={{ ...headSx, textAlign: 'right' }}>Total Ganado (Bs.)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fpcValidos.map((row, idx) => (
                  <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#0F1932' : '#0a1428' }}>
                    <TableCell sx={{ ...cellSx, color: `${ORO}88`, fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ ...cellSx, fontFamily: 'monospace' }}>{row.numero || '—'}</TableCell>
                    <TableCell sx={cellSx}>{row.periodo}</TableCell>
                    <TableCell sx={cellSx}>{getPlanilla(row.tipo_planilla)}</TableCell>
                    <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 600 }}>
                      {row.total_ganado ? Number(row.total_ganado).toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: `${ORO}0d` }}>
                  <TableCell colSpan={4} sx={{ ...cellSx, fontWeight: 700, textAlign: 'right', color: ORO }}>Total</TableCell>
                  <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 800, color: ORO }}>
                    {fpcValidos.reduce((s, r) => s + (Number(r.total_ganado) || 0), 0)
                      .toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      {/* Documentos */}
      {docsChecked.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AttachFileIcon sx={{ color: ORO, fontSize: 16 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: ORO }}>
              Documentación de Respaldo ({docsChecked.length})
            </Typography>
          </Box>
          <Box sx={{ border: '1px solid #2A3D6B', borderRadius: 1, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Código</TableCell>
                  <TableCell sx={headSx}>Documento</TableCell>
                  <TableCell sx={headSx}>Archivo adjunto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docsChecked.map(([docId, sel], idx) => {
                  const doc = getDocInfo(docId)
                  return (
                    <TableRow key={docId} sx={{ bgcolor: idx % 2 === 0 ? '#0F1932' : '#0a1428' }}>
                      <TableCell sx={{ ...cellSx, fontFamily: 'monospace', color: 'text.secondary' }}>{doc?.codigo || '—'}</TableCell>
                      <TableCell sx={cellSx}>{doc?.descripcion || `Doc #${docId}`}</TableCell>
                      <TableCell sx={cellSx}>
                        {sel.file
                          ? <Chip icon={<AttachFileIcon sx={{ fontSize: '13px !important' }} />}
                              label={sel.file.name} size="small"
                              sx={{ bgcolor: `${ORO}22`, color: ORO, fontSize: '0.72rem', maxWidth: 200 }} />
                          : <Typography variant="caption" color="text.disabled">Sin archivo</Typography>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </Box>
  )
}

/* ── Componente principal ───────────────────────────────────────────── */
export default function SolicitudWizard() {
  const navigate  = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [saving, setSaving]         = useState(false)
  const [fpcRows, setFpcRows]       = useState([])
  const [docSelections, setDocSelections] = useState({})

  const { control, handleSubmit, getValues, setValue, trigger, formState: { errors } } =
    useForm({
      defaultValues: {
        asegurado_data:  { cua: '', tipo_identificacion: '', cedula: '', tipo_persona: 'NAT', nombre: '', ap_paterno: '', ap_materno: '', celular: '' },
        empleador_data:  { numero_documento_identidad: '', tipo_identificacion: '', nombre_razon_social: '', tipo_empleador: 'PRIVADO', nit: '', nombre_representante_legal: '', cua_representante_legal: '', numero_documento_representante: '' },
        tipo_solicitud:   '',
        tipo_causal:      '',
        regional:         '',
        administradora:   '',
        prioridad:        'NORMAL',
        detalle_causal:   '',
        fecha_recepcion:  '',
        fecha_limite:     '',
        area_solicitante: '',
        ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
      },
    })

  useEffect(() => {
    const sub = setInterval(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(getValues())) }, 5000)
    return () => clearInterval(sub)
  }, [getValues])

  const FIELDS_BY_STEP = {
    0: ['asegurado_data.cedula', 'asegurado_data.nombre'],
    1: ['empleador_data.nombre_razon_social'],
    2: ['tipo_causal'],
    3: [], 4: [], 5: [],
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
        tipo_solicitud:   data.tipo_solicitud   || undefined,
        tipo_causal:      data.tipo_causal      || undefined,
        regional:         data.regional         || undefined,
        administradora:   data.administradora   || undefined,
        area_solicitante: data.area_solicitante || undefined,
        fecha_recepcion:  data.fecha_recepcion  || undefined,
        fecha_limite:     data.fecha_limite     || undefined,
        asegurado_data: { ...data.asegurado_data, tipo_identificacion: data.asegurado_data?.tipo_identificacion || undefined },
        empleador_data: { ...data.empleador_data, tipo_identificacion: data.empleador_data?.tipo_identificacion || undefined },
      }
      const res = await createSolicitud(payload)
      const solicitudId = res.data.id
      localStorage.removeItem(STORAGE_KEY)

      for (const row of fpcRows) {
        if (!row.periodo) continue
        try { await createFormulario({ solicitud: solicitudId, numero: row.numero || undefined, periodo: row.periodo, tipo_planilla: row.tipo_planilla || undefined, total_ganado: row.total_ganado || 0 }) } catch { /* continúa */ }
      }
      for (const [docId, sel] of Object.entries(docSelections).filter(([, s]) => s.checked)) {
        try {
          const fd = new FormData()
          fd.append('solicitud', solicitudId); fd.append('documento', docId)
          if (sel.file) fd.append('archivo', sel.file)
          await createDocumentoRespaldo(fd)
        } catch { /* continúa */ }
      }

      const nFpc  = fpcRows.filter((r) => r.periodo).length
      const nDocs = Object.values(docSelections).filter((s) => s.checked).length
      toast.success(`Solicitud ${res.data.numero_solicitud} creada — ${nFpc} FPC, ${nDocs} documentos`)
      navigate(`/solicitudes/${solicitudId}`)
    } catch (err) {
      const flattenErrors = (obj, prefix = '') => {
        if (!obj || typeof obj !== 'object') return [`${prefix}: ${obj}`]
        if (Array.isArray(obj)) return [`${prefix}: ${obj.join(', ')}`]
        return Object.entries(obj).flatMap(([k, v]) => flattenErrors(v, prefix ? `${prefix}.${k}` : k))
      }
      toast.error(err.response?.data ? flattenErrors(err.response.data).join('\n') : 'Error al crear la solicitud')
    } finally { setSaving(false) }
  }

  const stepContent = [
    <StepAsegurado   key={0} control={control} errors={errors} setValue={setValue} />,
    <StepEmpleador   key={1} control={control} errors={errors} setValue={setValue} />,
    <StepDetalle     key={2} control={control} errors={errors} setValue={setValue} />,
    <StepFormularios key={3} fpcRows={fpcRows} setFpcRows={setFpcRows} docSelections={docSelections} setDocSelections={setDocSelections} />,
    <StepSolicitante key={4} control={control} />,
    <StepResumen     key={5} getValues={getValues} fpcRows={fpcRows} docSelections={docSelections} />,
  ]

  const progress = Math.round((activeStep / (STEPS.length - 1)) * 100)

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton onClick={() => navigate('/solicitudes')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={700}>Nueva Solicitud de Rectificación</Typography>
          <Typography variant="caption" color="text.secondary">
            {STEPS[activeStep].desc}
          </Typography>
        </Box>
      </Box>

      <Card sx={{ overflow: 'hidden' }}>
        {/* Barra de progreso */}
        <LinearProgress variant="determinate" value={progress} sx={{
          height: 3, borderRadius: 0,
          bgcolor: '#1a2844',
          '& .MuiLinearProgress-bar': {
            bgcolor: ORO,
            boxShadow: `0 0 8px ${ORO}88`,
          },
        }} />

        <CardContent sx={{ pt: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} alternativeLabel connector={<GlowConnector />} sx={{ mb: 4 }}>
            {STEPS.map((step, idx) => (
              <Step key={step.label}>
                <StepLabel StepIconComponent={CustomStepIcon}>
                  <Typography variant="caption" sx={{
                    fontWeight: activeStep === idx ? 700 : 400,
                    color: activeStep === idx ? ORO : idx < activeStep ? `${ORO}88` : 'text.disabled',
                    transition: 'color 0.3s ease',
                    fontSize: '0.72rem',
                  }}>
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Contenido del paso con animación */}
          <Box
            key={activeStep}
            sx={{
              minHeight: 320,
              animation: 'wizardFadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes wizardFadeIn': {
                from: { opacity: 0, transform: 'translateY(14px)' },
                to:   { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {stepContent[activeStep]}
          </Box>

          <Divider sx={{ my: 3, borderColor: '#2A3D6B' }} />

          {/* Navegación */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || saving}
              startIcon={<ArrowBackIcon />}>
              Anterior
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {STEPS.map((_, idx) => (
                <Box key={idx} sx={{
                  width: idx === activeStep ? 20 : 6,
                  height: 6, borderRadius: 3,
                  bgcolor: idx === activeStep ? ORO : idx < activeStep ? `${ORO}55` : '#2A3D6B',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </Box>

            {activeStep < STEPS.length - 1 ? (
              <Button variant="contained" onClick={handleNext} endIcon={<ArrowForwardIcon />}
                sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 700, '&:hover': { bgcolor: '#b8943e' } }}>
                Siguiente
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                sx={{ bgcolor: ORO, color: '#0F1932', fontWeight: 800, px: 3, '&:hover': { bgcolor: '#b8943e' } }}>
                {saving ? 'Creando...' : 'Crear Solicitud'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
