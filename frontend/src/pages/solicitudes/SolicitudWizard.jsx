import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, Typography, Stepper, Step,
  StepLabel, Grid, TextField, MenuItem, FormControl,
  InputLabel, Select, Alert, CircularProgress, Divider,
  IconButton, Stack, Table, TableHead, TableRow, TableCell,
  TableBody, Checkbox, Chip, Tooltip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SendIcon from '@mui/icons-material/Send'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createSolicitud, createFormulario, createDocumentoRespaldo, getAsegurados, getEmpleadores } from '../../api/solicitudes'
import catalogosApi from '../../api/catalogos'
import { useAuthStore } from '../../store/authStore'
import { getMe } from '../../api/auth'
import { ORO } from '../../theme'

const STEPS = [
  'Datos del Asegurado',
  'Datos del Empleador',
  'Detalle de Rectificación',
  'Formularios y Documentos',
  'Datos del Solicitante',
  'Resumen y Confirmación',
]

const STORAGE_KEY = 'wizard_solicitud_draft'

function StepAsegurado({ control, errors, setValue }) {
  const [buscando, setBuscando]       = React.useState(false)
  const [encontrado, setEncontrado]   = React.useState(null) // null | true | false

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
    setBuscando(true)
    setEncontrado(null)
    try {
      const res = await getAsegurados({ cua: cua.trim() })
      const lista = res.data?.results ?? res.data ?? []
      if (lista.length > 0) {
        llenarDesdeAsegurado(lista[0])
      } else {
        setEncontrado(false)
      }
    } catch { setEncontrado(false) }
    finally  { setBuscando(false) }
  }

  const buscarPorCedula = async (cedula) => {
    if (!cedula?.trim()) return
    setBuscando(true)
    setEncontrado(null)
    try {
      const res = await getAsegurados({ cedula: cedula.trim() })
      const lista = res.data?.results ?? res.data ?? []
      if (lista.length > 0) {
        llenarDesdeAsegurado(lista[0])
      } else {
        setEncontrado(false)
      }
    } catch { setEncontrado(false) }
    finally  { setBuscando(false) }
  }

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Identificación del Asegurado
        </Typography>
      </Grid>

      {encontrado === true && (
        <Grid item xs={12}>
          <Alert severity="success" onClose={() => setEncontrado(null)}>
            Asegurado encontrado — campos completados automáticamente. Puede editar si es necesario.
          </Alert>
        </Grid>
      )}
      {encontrado === false && (
        <Grid item xs={12}>
          <Alert severity="info" onClose={() => setEncontrado(null)}>
            Asegurado no encontrado — complete los datos manualmente.
          </Alert>
        </Grid>
      )}

      {/* CUA — busca al perder el foco */}
      <Grid item xs={12} sm={6}>
        <Controller
          name="asegurado_data.cua"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="CUA"
              onBlur={(e) => { field.onBlur(); buscarPorCua(e.target.value) }}
              InputProps={{ endAdornment: buscando ? <CircularProgress size={18} /> : null }}
            />
          )}
        />
      </Grid>

      {/* Tipo de Identificación */}
      <Grid item xs={12} sm={6}>
        <Controller
          name="asegurado_data.tipo_identificacion"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Tipo de Identificación</InputLabel>
              <Select {...field} label="Tipo de Identificación" value={field.value ?? ''}>
                <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                {tiposId.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      {/* Cédula — busca al perder el foco */}
      <Grid item xs={12} sm={6}>
        <Controller
          name="asegurado_data.cedula"
          control={control}
          rules={{ required: 'La cédula es requerida' }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Cédula de Identidad *"
              error={!!errors.asegurado_data?.cedula}
              helperText={errors.asegurado_data?.cedula?.message}
              onBlur={(e) => { field.onBlur(); buscarPorCedula(e.target.value) }}
              InputProps={{ endAdornment: buscando ? <CircularProgress size={18} /> : null }}
            />
          )}
        />
      </Grid>

      {/* Tipo de Persona */}
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

      {/* Nombres y Apellidos */}
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

      {/* Celular */}
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
    setBuscando(true)
    setEncontrado(null)
    try {
      const res = await getEmpleadores({ numero_documento_identidad: numDoc.trim() })
      const lista = res.data?.results ?? res.data ?? []
      if (lista.length > 0) {
        llenarDesdeEmpleador(lista[0])
      } else {
        setEncontrado(false)
      }
    } catch { setEncontrado(false) }
    finally  { setBuscando(false) }
  }

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Datos del Empleador
        </Typography>
      </Grid>

      {encontrado === true && (
        <Grid item xs={12}>
          <Alert severity="success" onClose={() => setEncontrado(null)}>
            Empleador encontrado — campos completados automáticamente. Puede editar si es necesario.
          </Alert>
        </Grid>
      )}
      {encontrado === false && (
        <Grid item xs={12}>
          <Alert severity="info" onClose={() => setEncontrado(null)}>
            Empleador no encontrado — complete los datos manualmente.
          </Alert>
        </Grid>
      )}

      {/* N° de Identificación — primero, busca al perder foco */}
      <Grid item xs={12} sm={6}>
        <Controller
          name="empleador_data.numero_documento_identidad"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="N° de Identificación"
              onBlur={(e) => { field.onBlur(); buscarPorNumDoc(e.target.value) }}
              InputProps={{ endAdornment: buscando ? <CircularProgress size={18} /> : null }}
            />
          )}
        />
      </Grid>

      {/* Tipo de Identificación */}
      <Grid item xs={12} sm={6}>
        <Controller
          name="empleador_data.tipo_identificacion"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Tipo de Identificación</InputLabel>
              <Select {...field} label="Tipo de Identificación" value={field.value ?? ''}>
                <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                {tiposId.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      {/* Razón Social */}
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

      {/* Tipo Empleador */}
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

      {/* Representante Legal */}
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
          name="empleador_data.cua_representante_legal"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="CUA Representante Legal" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="empleador_data.numero_documento_representante"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="N° Doc. Representante" />
          )}
        />
      </Grid>
    </Grid>
  )
}

function StepDetalle({ control, errors, setValue }) {
  const [tipoRegionalId, setTipoRegionalId] = React.useState('')

  const { data: tiposCausal } = useQuery({
    queryKey: ['tipo-causal'],
    queryFn: () => catalogosApi.tipoCausal.getAll().then((r) => r.data.results || r.data),
  })
  const { data: tiposSolicitud } = useQuery({
    queryKey: ['tipo-solicitud'],
    queryFn: () => catalogosApi.tipoSolicitud.getAll().then((r) => r.data.results || r.data),
  })
  const { data: tiposRegional } = useQuery({
    queryKey: ['tipo-regional'],
    queryFn: () => catalogosApi.tipoRegional.getAll().then((r) => r.data.results || r.data),
    staleTime: 10 * 60_000,
  })
  const { data: regionales } = useQuery({
    queryKey: ['regionales', tipoRegionalId],
    queryFn: () => catalogosApi.regionales.getAll(
      tipoRegionalId ? { tipo_regional: tipoRegionalId } : {}
    ).then((r) => r.data.results || r.data),
    enabled: true,
  })
  const { data: administradoras } = useQuery({
    queryKey: ['administradoras'],
    queryFn: () => catalogosApi.administradoras.getAll().then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
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

      {/* Cascada: Tipo Regional → Regional */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Tipo de Regional</InputLabel>
          <Select
            value={tipoRegionalId}
            label="Tipo de Regional"
            onChange={(e) => {
              setTipoRegionalId(e.target.value)
              setValue('regional', '')
            }}
          >
            <MenuItem value=""><em>— Todos —</em></MenuItem>
            {tiposRegional?.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="regional"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Regional (Departamento)</InputLabel>
              <Select {...field} label="Regional (Departamento)" value={field.value ?? ''}>
                <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
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
      <Grid item xs={12} sm={6}>
        <Controller
          name="administradora"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>AFP Origen</InputLabel>
              <Select {...field} label="AFP Origen" value={field.value ?? ''}>
                <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                {administradoras?.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
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

function StepFormularios({ fpcRows, setFpcRows, docSelections, setDocSelections }) {
  const fileRefs = useRef({})

  const { data: tiposPlanilla = [] } = useQuery({
    queryKey: ['tipo-planilla'],
    queryFn: () => catalogosApi.tipoPlanilla.getAll().then((r) => r.data.results || r.data),
  })
  const { data: catalogosDocs = [] } = useQuery({
    queryKey: ['catalogo-documentos'],
    queryFn: () => catalogosApi.documentos.getAll().then((r) => r.data.results || r.data),
  })

  const emptyFpc = () => ({ numero: '', periodo: '', tipo_planilla: '', total_ganado: '' })
  const addFpc = () => setFpcRows((r) => [...r, emptyFpc()])
  const removeFpc = (idx) => setFpcRows((r) => r.filter((_, i) => i !== idx))
  const updateFpc = (idx, field, val) =>
    setFpcRows((rows) => rows.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const toggleDoc = (docId) =>
    setDocSelections((prev) => ({
      ...prev,
      [docId]: { ...prev[docId], checked: !prev[docId]?.checked, file: prev[docId]?.file || null },
    }))

  const attachFile = (docId, file) => {
    setDocSelections((prev) => ({
      ...prev,
      [docId]: { ...prev[docId], checked: true, file },
    }))
  }

  const headSx = { py: 0.8, px: 1, color: ORO, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid #2A3D6B', whiteSpace: 'nowrap' }
  const cellSx = { py: 0.6, px: 1, fontSize: '0.82rem', borderBottom: '1px solid #2A3D6B' }

  return (
    <Box>
      {/* FPC Table */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: ORO }}>
          Rectificador FPC — Formularios de Contribución
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addFpc} variant="outlined"
          sx={{ color: ORO, borderColor: ORO, '&:hover': { bgcolor: `${ORO}11` } }}>
          Agregar FPC
        </Button>
      </Box>
      <Box sx={{ overflowX: 'auto', mb: 3 }}>
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
              <TableRow key={idx} sx={{ bgcolor: '#0F1932' }}>
                <TableCell sx={cellSx}>{idx + 1}</TableCell>
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
                    {tiposPlanilla.map((t) => (
                      <MenuItem key={t.id} value={t.id} sx={{ fontSize: '0.82rem' }}>{t.nombre}</MenuItem>
                    ))}
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
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary', fontSize: '0.85rem' }}>
                  Sin formularios. Haga clic en "Agregar FPC" para ingresar los datos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Documentación de Respaldo */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: ORO }}>
        Documentación de Respaldo
      </Typography>
      {catalogosDocs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Cargando documentos...</Typography>
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
            {catalogosDocs.map((doc) => {
              const sel = docSelections[doc.id] || {}
              return (
                <TableRow key={doc.id} sx={{ '&:hover': { bgcolor: '#1a2844' } }}>
                  <TableCell sx={{ py: 0.5, px: 1, borderBottom: '1px solid #2A3D6B' }}>
                    <Checkbox checked={!!sel.checked} onChange={() => toggleDoc(doc.id)} size="small"
                      sx={{ color: ORO, '&.Mui-checked': { color: ORO }, p: 0 }} />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, px: 1, fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.secondary', borderBottom: '1px solid #2A3D6B' }}>
                    {doc.codigo}
                  </TableCell>
                  <TableCell sx={{ py: 0.5, px: 1, fontSize: '0.85rem', fontWeight: sel.checked ? 600 : 400, borderBottom: '1px solid #2A3D6B' }}>
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
  )
}

function StepSolicitante({ control }) {
  const userStore = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => getMe().then((r) => r.data),
    staleTime: 60_000,
    onSuccess: (data) => updateUser(data),
  })

  const { data: unidades } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => catalogosApi.unidades.getAll().then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })

  const { data: agencias } = useQuery({
    queryKey: ['agencias'],
    queryFn: () => catalogosApi.agencias.getAll().then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })

  const user = meData || userStore

  const InfoField = ({ label, value }) => (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.2 }}>
        {value || '—'}
      </Typography>
    </Box>
  )

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Datos del Solicitante
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Alert severity="success" icon={false} sx={{ mb: 1 }}>
          Los datos del solicitante se cargan automáticamente del usuario en sesión.
        </Alert>
      </Grid>

      {/* Datos del usuario en sesión — solo lectura */}
      <Grid item xs={12}>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          <InfoField label="Nombre Completo"  value={user?.nombre_completo || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()} />
          <InfoField label="Correo Electrónico" value={user?.email} />
          <InfoField label="Teléfono"         value={user?.telefono} />
          <InfoField label="Regional"         value={user?.regional_nombre} />
          <InfoField label="Agencia"          value={agencias?.find((a) => a.id === user?.agencia)?.nombre || user?.agencia_nombre} />
          <InfoField label="Unidad"           value={user?.unidad_nombre} />
        </Box>
      </Grid>

      {/* Unidad solicitante — editable, pre-llenada con la unidad del usuario */}
      <Grid item xs={12} sm={6}>
        <Controller
          name="area_solicitante"
          control={control}
          render={({ field }) => {
            if (!field.value && user?.unidad) {
              setTimeout(() => field.onChange(user.unidad), 0)
            }
            return (
              <FormControl fullWidth>
                <InputLabel>Unidad Solicitante</InputLabel>
                <Select {...field} label="Unidad Solicitante" value={field.value ?? ''}>
                  <MenuItem value=""><em>— Sin especificar —</em></MenuItem>
                  {unidades?.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )
          }}
        />
      </Grid>
    </Grid>
  )
}

function StepResumen({ getValues, fpcRows, docSelections }) {
  const values     = getValues()
  const fpcValidos = fpcRows.filter((r) => r.periodo)
  const docsChecked = Object.entries(docSelections).filter(([, s]) => s.checked)

  const { data: tiposPlanilla = [] } = useQuery({
    queryKey: ['tipo-planilla'],
    queryFn:  () => catalogosApi.tipoPlanilla.getAll().then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })
  const { data: catalogosDocs = [] } = useQuery({
    queryKey: ['catalogo-documentos'],
    queryFn:  () => catalogosApi.documentos.getAll().then((r) => r.data.results || r.data),
    staleTime: 5 * 60_000,
  })

  const getPlanilla  = (id) => tiposPlanilla.find((t) => t.id === Number(id))?.nombre || '—'
  const getDocInfo   = (id) => catalogosDocs.find((d) => d.id === Number(id))

  const headSx = { py: 0.8, px: 1, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: ORO, borderBottom: `2px solid #2A3D6B`, whiteSpace: 'nowrap' }
  const cellSx = { py: 0.6, px: 1, fontSize: '0.82rem', borderBottom: '1px solid #2A3D6B' }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: ORO }}>
        Resumen de la Solicitud
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Revise los datos antes de enviar. La solicitud se creará en estado <strong>Borrador</strong>.
      </Alert>

      {/* Tarjetas de resumen general */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Asegurado</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                {[values.asegurado_data?.nombre, values.asegurado_data?.ap_paterno, values.asegurado_data?.ap_materno].filter(Boolean).join(' ') || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">CI: {values.asegurado_data?.cedula || '—'}{values.asegurado_data?.cua ? ` | CUA: ${values.asegurado_data.cua}` : ''}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Empleador</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                {values.empleador_data?.nombre_razon_social || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                N° Doc: {values.empleador_data?.numero_documento_identidad || '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Detalle</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Prioridad: <strong>{values.prioridad || 'NORMAL'}</strong>{values.fecha_recepcion ? ` | Recepción: ${values.fecha_recepcion}` : ''}
              </Typography>
              {values.detalle_causal && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{values.detalle_causal}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Totales</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>{fpcValidos.length}</strong> formulario(s) FPC
              </Typography>
              <Typography variant="body2">
                <strong>{docsChecked.length}</strong> documento(s) recibidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla FPC */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Formularios FPC ({fpcValidos.length})
        </Typography>
        {fpcValidos.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
            Sin formularios FPC registrados.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto', border: '1px solid #2A3D6B', borderRadius: 1 }}>
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
                  <TableRow key={idx}>
                    <TableCell sx={{ ...cellSx, color: 'text.secondary' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ ...cellSx, fontFamily: 'monospace' }}>{row.numero || '—'}</TableCell>
                    <TableCell sx={cellSx}>{row.periodo}</TableCell>
                    <TableCell sx={cellSx}>{getPlanilla(row.tipo_planilla)}</TableCell>
                    <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 600 }}>
                      {row.total_ganado ? Number(row.total_ganado).toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
                {fpcValidos.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ ...cellSx, fontWeight: 700, textAlign: 'right', color: ORO }}>Total</TableCell>
                    <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 800, color: ORO }}>
                      {fpcValidos.reduce((s, r) => s + (Number(r.total_ganado) || 0), 0)
                        .toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Lista de documentos */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: ORO }}>
          Documentación de Respaldo ({docsChecked.length})
        </Typography>
        {docsChecked.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
            Sin documentos marcados como recibidos.
          </Typography>
        ) : (
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
                {docsChecked.map(([docId, sel]) => {
                  const doc = getDocInfo(docId)
                  return (
                    <TableRow key={docId}>
                      <TableCell sx={{ ...cellSx, fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {doc?.codigo || '—'}
                      </TableCell>
                      <TableCell sx={cellSx}>{doc?.descripcion || `Doc #${docId}`}</TableCell>
                      <TableCell sx={cellSx}>
                        {sel.file
                          ? <Chip icon={<AttachFileIcon sx={{ fontSize: '13px !important' }} />}
                              label={sel.file.name} size="small"
                              sx={{ bgcolor: `${ORO}22`, color: ORO, fontSize: '0.72rem', maxWidth: 200 }} />
                          : <Typography variant="caption" color="text.secondary">Sin archivo</Typography>
                        }
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default function SolicitudWizard() {
  const navigate        = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [saving, setSaving]         = useState(false)
  const [fpcRows, setFpcRows]       = useState([])
  const [docSelections, setDocSelections] = useState({})

  const { control, handleSubmit, getValues, setValue, trigger, formState: { errors } } =
    useForm({
      defaultValues: {
        asegurado_data:  { cua: '', tipo_identificacion: '', cedula: '', tipo_persona: 'NAT', nombre: '', ap_paterno: '', ap_materno: '', celular: '' },
        empleador_data:  { numero_documento_identidad: '', tipo_identificacion: '', nombre_razon_social: '', tipo_empleador: 'PRIVADO', nit: '', nombre_representante_legal: '', cua_representante_legal: '', numero_documento_representante: '' },
        tipo_solicitud:  '',
        tipo_causal:     '',
        regional:        '',
        administradora:  '',
        prioridad:       'NORMAL',
        detalle_causal:  '',
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
        tipo_solicitud:   data.tipo_solicitud   || undefined,
        tipo_causal:      data.tipo_causal      || undefined,
        regional:         data.regional         || undefined,
        administradora:   data.administradora   || undefined,
        area_solicitante: data.area_solicitante || undefined,
        fecha_recepcion:  data.fecha_recepcion  || undefined,
        fecha_limite:     data.fecha_limite     || undefined,
        asegurado_data: {
          ...data.asegurado_data,
          tipo_identificacion: data.asegurado_data?.tipo_identificacion || undefined,
        },
        empleador_data: {
          ...data.empleador_data,
          tipo_identificacion: data.empleador_data?.tipo_identificacion || undefined,
        },
      }
      const res = await createSolicitud(payload)
      const solicitudId = res.data.id
      localStorage.removeItem(STORAGE_KEY)

      // Guardar formularios FPC
      for (const row of fpcRows) {
        if (!row.periodo) continue
        try {
          await createFormulario({
            solicitud:    solicitudId,
            numero:       row.numero        || undefined,
            periodo:      row.periodo,
            tipo_planilla: row.tipo_planilla || undefined,
            total_ganado: row.total_ganado   || 0,
          })
        } catch { /* continúa con el siguiente */ }
      }

      // Guardar documentos tiqued
      const docsSeleccionados = Object.entries(docSelections).filter(([, s]) => s.checked)
      for (const [docId, sel] of docsSeleccionados) {
        try {
          const fd = new FormData()
          fd.append('solicitud', solicitudId)
          fd.append('documento', docId)
          if (sel.file) fd.append('archivo', sel.file)
          await createDocumentoRespaldo(fd)
        } catch { /* continúa con el siguiente */ }
      }

      const nFpc  = fpcRows.filter((r) => r.periodo).length
      const nDocs = docsSeleccionados.length
      toast.success(`Solicitud ${res.data.numero_solicitud} creada — ${nFpc} FPC, ${nDocs} documentos`)
      navigate(`/solicitudes/${solicitudId}`)
    } catch (err) {
      const errData = err.response?.data
      const flattenErrors = (obj, prefix = '') => {
        if (!obj || typeof obj !== 'object') return [`${prefix}: ${obj}`]
        if (Array.isArray(obj)) return [`${prefix}: ${obj.join(', ')}`]
        return Object.entries(obj).flatMap(([k, v]) =>
          flattenErrors(v, prefix ? `${prefix}.${k}` : k)
        )
      }
      const msg = errData ? flattenErrors(errData).join('\n') : 'Error al crear la solicitud'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const stepContent = [
    <StepAsegurado   key={0} control={control} errors={errors} setValue={setValue} />,
    <StepEmpleador   key={1} control={control} errors={errors} setValue={setValue} />,
    <StepDetalle     key={2} control={control} errors={errors} setValue={setValue} />,
    <StepFormularios key={3} fpcRows={fpcRows} setFpcRows={setFpcRows} docSelections={docSelections} setDocSelections={setDocSelections} />,
    <StepSolicitante key={4} control={control} />,
    <StepResumen     key={5} getValues={getValues} fpcRows={fpcRows} docSelections={docSelections} />,
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
