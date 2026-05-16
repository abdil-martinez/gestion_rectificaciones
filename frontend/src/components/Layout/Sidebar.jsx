import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AssignmentIcon from '@mui/icons-material/Assignment'
import InboxIcon from '@mui/icons-material/Inbox'
import BarChartIcon from '@mui/icons-material/BarChart'
import SettingsIcon from '@mui/icons-material/Settings'
import PeopleIcon from '@mui/icons-material/People'
import { useAuthStore } from '../../store/authStore'
import { ORO, NAVY } from '../../theme'

const NAV_ITEMS = [
  { label: 'Dashboard',      icon: <DashboardIcon />,  path: '/',           roles: ['ADMIN','SUPER','ANALIST','CONSULTA'] },
  { label: 'Solicitudes',    icon: <AssignmentIcon />,  path: '/solicitudes', roles: ['ADMIN','SUPER','ANALIST','CONSULTA'] },
  { label: 'Mi Bandeja',     icon: <InboxIcon />,       path: '/workflow',   roles: ['ADMIN','SUPER','ANALIST'] },
  { label: 'Reportes',       icon: <BarChartIcon />,    path: '/reportes',   roles: ['ADMIN','SUPER'] },
  { divider: true },
  { label: 'Usuarios',       icon: <PeopleIcon />,      path: '/usuarios',   roles: ['ADMIN','SUPER'] },
  { label: 'Configuración',  icon: <SettingsIcon />,    path: '/config',     roles: ['ADMIN'] },
]

export default function Sidebar({ drawerWidth = 240 }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuthStore()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.divider || item.roles?.includes(user?.rol)
  )

  return (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${ORO}33`,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${ORO}, #96783C)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 18,
            color: NAVY,
            flexShrink: 0,
          }}
        >
          G
        </Box>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, color: ORO, lineHeight: 1.1 }}
          >
            GNARC
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
            Rectificaciones
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, px: 1 }}>
        <List dense disablePadding>
          {visibleItems.map((item, idx) =>
            item.divider ? (
              <Divider key={`div-${idx}`} sx={{ my: 1, borderColor: '#2A3D6B' }} />
            ) : (
              <ListItemButton
                key={item.path}
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{ mb: 0.3, py: 1, px: 1.5 }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive(item.path) ? ORO : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 700 : 400,
                    color: isActive(item.path) ? ORO : 'text.primary',
                  }}
                />
              </ListItemButton>
            )
          )}
        </List>
      </Box>

      {/* User footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${ORO}22`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          src={user?.avatar || undefined}
          sx={{ width: 36, height: 36, bgcolor: ORO, color: NAVY, fontSize: 14, fontWeight: 700 }}
        >
          {user?.first_name?.[0] || user?.username?.[0] || '?'}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {user?.nombre_completo || user?.username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.rol}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
