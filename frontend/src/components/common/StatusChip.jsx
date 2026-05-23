import React from 'react'
import { Chip } from '@mui/material'

const pulseKeyframes = (color) => ({
  '@keyframes chipPulse': {
    '0%, 100%': { boxShadow: `0 0 0 0 ${color}66` },
    '50%':      { boxShadow: `0 0 0 6px ${color}00` },
  },
  animation: 'chipPulse 2s ease-in-out infinite',
})

const glowKeyframes = (color) => ({
  '@keyframes chipGlow': {
    '0%, 100%': { boxShadow: `0 0 4px 1px ${color}55` },
    '50%':      { boxShadow: `0 0 10px 3px ${color}99` },
  },
  animation: 'chipGlow 1.5s ease-in-out infinite',
})

const ESTADO_CONFIG = {
  BOR:  { label: 'Borrador',    color: 'default',   sx: { bgcolor: '#455a64', color: '#fff', transition: 'all 0.2s' } },
  PEND: { label: 'Pendiente',   color: 'info',      sx: { ...pulseKeyframes('#2196f3') } },
  ASIG: { label: 'Asignado',    color: 'warning',   sx: { ...pulseKeyframes('#ff9800') } },
  REV:  { label: 'En Revisión', color: 'warning',   sx: { bgcolor: '#e65100', color: '#fff', ...glowKeyframes('#e65100') } },
  APRO: { label: 'Rectificado', color: 'success',   sx: { ...glowKeyframes('#1db954') } },
  RECH: { label: 'Rechazado',   color: 'error',     sx: { transition: 'all 0.2s', '&:hover': { transform: 'scale(1.05)' } } },
  DEV:  { label: 'Devuelto',    color: 'secondary', sx: { transition: 'all 0.2s' } },
  FIN:  { label: 'Finalizado',  color: 'success',   sx: { bgcolor: '#1b5e20', color: '#fff' } },
  ANU:  { label: 'Anulado',     color: 'error',     sx: { bgcolor: '#4a0000', color: '#ccc' } },
}

const PRIORIDAD_CONFIG = {
  BAJA:    { label: 'Baja',    sx: { bgcolor: '#37474f', color: '#90a4ae' } },
  NORMAL:  { label: 'Normal',  sx: { bgcolor: '#1565c0', color: '#fff' } },
  ALTA:    { label: 'Alta',    sx: { bgcolor: '#e65100', color: '#fff', ...pulseKeyframes('#e65100') } },
  URGENTE: { label: 'Urgente', sx: {
    bgcolor: '#b71c1c', color: '#fff', fontWeight: 700,
    '@keyframes urgentPulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(183,28,28,0.7)', transform: 'scale(1)' },
      '50%':      { boxShadow: '0 0 0 8px rgba(183,28,28,0)',  transform: 'scale(1.04)' },
    },
    animation: 'urgentPulse 1.2s ease-in-out infinite',
  }},
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
