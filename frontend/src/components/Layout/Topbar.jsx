import React from 'react'
import {
  AppBar, Toolbar, Typography, IconButton, Box,
  Tooltip, Avatar, Menu, MenuItem, Divider,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ORO, NAVY } from '../../theme'

const PAGE_TITLES = {
  '/':             'Dashboard',
  '/solicitudes':  'Solicitudes de Rectificación',
  '/workflow':     'Mi Bandeja de Trabajo',
  '/reportes':     'Reportes y Estadísticas',
  '/config':       'Configuración del Sistema',
  '/usuarios':     'Gestión de Usuarios',
}

export default function Topbar({ onMenuToggle, drawerWidth }) {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { user, clearAuth } = useAuthStore()
  const [anchorEl, setAnchorEl] = React.useState(null)

  const title = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => location.pathname.startsWith(path))?.[1] || 'GNARC'

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, color: ORO }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.nombre_completo || user?.username}
          </Typography>

          <Tooltip title="Perfil y opciones">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
              <Avatar
                src={user?.avatar || undefined}
                sx={{ width: 32, height: 32, bgcolor: ORO, color: NAVY, fontSize: 13, fontWeight: 700 }}
              >
                {user?.first_name?.[0] || user?.username?.[0] || '?'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { minWidth: 200 } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {user?.nombre_completo || user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/perfil') }}>
            <AccountCircleIcon sx={{ mr: 1.5, fontSize: 18 }} />
            Mi Perfil
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
