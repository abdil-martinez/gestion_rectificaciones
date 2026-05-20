import React from 'react'
import { Chip } from '@mui/material'

const ESTADO_CONFIG = {
  BOR:  { label: 'Borrador',     color: 'default',   sx: { bgcolor: '#455a64', color: '#fff' } },
  PEND: { label: 'Pendiente',    color: 'info',      sx: {} },
  ASIG: { label: 'Asignado',     color: 'warning',   sx: {} },
  REV:  { label: 'En Revisión',  color: 'warning',   sx: { bgcolor: '#e65100', color: '#fff' } },
  APRO: { label: 'Rectificado',  color: 'success',   sx: {} },
  RECH: { label: 'Rechazado',    color: 'error',     sx: {} },
  DEV:  { label: 'Devuelto',     color: 'secondary', sx: {} },
  FIN:  { label: 'Finalizado',   color: 'success',   sx: { bgcolor: '#1b5e20', color: '#fff' } },
  ANU:  { label: 'Anulado',      color: 'error',     sx: { bgcolor: '#4a0000', color: '#ccc' } },
}

const PRIORIDAD_CONFIG = {
  BAJA:    { label: 'Baja',    sx: { bgcolor: '#37474f', color: '#90a4ae' } },
  NORMAL:  { label: 'Normal',  sx: { bgcolor: '#1565c0', color: '#fff' } },
  ALTA:    { label: 'Alta',    sx: { bgcolor: '#e65100', color: '#fff' } },
  URGENTE: { label: 'Urgente', sx: { bgcolor: '#b71c1c', color: '#fff', fontWeight: 700 } },
}

export function StatusChip({ estado, size = 'small' }) {
  const config = ESTADO_CONFIG[estado] || { label: estado, color: 'default', sx: {} }
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 600, ...config.sx }}
    />
  )
}

export function PrioridadChip({ prioridad, size = 'small' }) {
  const config = PRIORIDAD_CONFIG[prioridad] || { label: prioridad, sx: {} }
  return (
    <Chip
      label={config.label}
      size={size}
      sx={{ fontWeight: 600, ...config.sx }}
    />
  )
}

export default StatusChip
