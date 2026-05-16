import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { ORO } from '../../theme'

export default function LoadingSpinner({ message = 'Cargando...', fullHeight = false }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={{ height: fullHeight ? '60vh' : 'auto', py: fullHeight ? 0 : 4 }}
    >
      <CircularProgress sx={{ color: ORO }} size={40} thickness={4} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )
}
