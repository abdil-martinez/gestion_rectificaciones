import React from 'react'
import { Box, Typography } from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'

export default function AjustesFuturoBolivia() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <AccountBalanceIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Ajustes — Futuro de Bolivia
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Módulo en construcción.
      </Typography>
    </Box>
  )
}
