import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Collapse,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AssignmentIcon from '@mui/icons-material/Assignment'
import InboxIcon from '@mui/icons-material/Inbox'
import BarChartIcon from '@mui/icons-material/BarChart'
import SettingsIcon from '@mui/icons-material/Settings'
import PeopleIcon from '@mui/icons-material/People'
import TuneIcon from '@mui/icons-material/Tune'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useAuthStore } from '../../store/authStore'
import { ORO, NAVY, BRAND_RED, BRAND_BLUE, BRAND_INDIGO } from '../../theme'

const NAV_ITEMS = [
  { label: 'Dashboard',      icon: <DashboardIcon />,  path: '/',           roles: ['ADMIN','SUPER','ANALIST','CONSULTA'] },
  { label: 'Solicitudes',    icon: <AssignmentIcon />,  path: '/solicitudes', roles: ['ADMIN','SUPER','ANALIST','CONSULTA'] },
  { label: 'Mi Bandeja',     icon: <InboxIcon />,       path: '/workflow',   roles: ['ADMIN','SUPER','ANALIST'] },
  { label: 'Reportes',       icon: <BarChartIcon />,    path: '/reportes',   roles: ['ADMIN','SUPER'] },
  {
    label: 'Ajustes', icon: <TuneIcon />, roles: ['ADMIN','SUPER'],
    children: [
      { label: 'Previsión',         path: '/ajustes/prevision' },
      { label: 'Futuro de Bolivia', path: '/ajustes/futuro-bolivia' },
    ],
  },
  { divider: true },
  { label: 'Usuarios',       icon: <PeopleIcon />,      path: '/usuarios',   roles: ['ADMIN','SUPER'] },
  { label: 'Configuración',  icon: <SettingsIcon />,    path: '/config',     roles: ['ADMIN'] },
]

export default function Sidebar({ drawerWidth = 240 }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuthStore()
  const theme     = useTheme()
  const isDark    = theme.palette.mode === 'dark'
  const [openGroups, setOpenGroups] = useState(() => {
    const inAjustes = location.pathname.startsWith('/ajustes')
    return inAjustes ? { Ajustes: true } : {}
  })

  const toggleGroup = (label) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

  const accent         = isDark ? ORO        : BRAND_BLUE
  const accentContrast = isDark ? NAVY       : '#ffffff'
  const logoTextColor  = isDark ? ORO        : BRAND_BLUE
  const navText        = isDark ? 'text.primary' : '#6B7280'
  const navTextActive  = isDark ? ORO        : BRAND_INDIGO
  const dividerColor   = isDark ? '#2A3D6B'  : '#D0D4E0'
  const borderColor    = isDark ? `${ORO}33` : '#D0D4E0'

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isGroupActive = (item) =>
    item.children?.some((c) => location.pathname.startsWith(c.path))

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.divider || item.roles?.includes(user?.rol)
  )

  const navItemSx = (active) => ({
    mb: 0.3, py: 1, px: 1.5,
    position: 'relative', overflow: 'hidden',
    transition: 'all 0.2s ease',
    '&::before': active && isDark ? {
      content: '""',
      position: 'absolute', left: 0, top: '15%',
      height: '70%', width: 3, borderRadius: '0 3px 3px 0',
      background: `linear-gradient(180deg, ${ORO}cc, ${ORO})`,
      boxShadow: `0 0 10px ${ORO}99`,
    } : {},
    '&:hover': {
      backgroundColor: isDark ? `${ORO}12` : '#F0F2F9',
      '& .nav-icon': { transform: 'scale(1.2) rotate(-5deg)' },
      '& .nav-label': { letterSpacing: '0.01em' },
    },
    '&.Mui-selected': {
      backgroundColor: isDark ? `${ORO}18` : '#EAEDF5',
      backdropFilter: 'blur(4px)',
      '&:hover': { backgroundColor: isDark ? `${ORO}28` : '#E0E4F4' },
    },
  })

  return (
    <Box sx={{ width: drawerWidth, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Logo */}
      <Box sx={{
        px: 2.5, py: 3,
        display: 'flex', alignItems: 'center', gap: 1.5,
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <Box sx={{
          width: 42, height: 42, borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 18, color: accentContrast, flexShrink: 0,
          background: isDark
            ? `linear-gradient(135deg, ${ORO}, #96783C)`
            : `linear-gradient(135deg, ${BRAND_RED}, #B71C1C)`,
          boxShadow: isDark ? `0 0 16px ${ORO}55` : '0 2px 8px rgba(229,57,53,0.4)',
          '@keyframes logoShimmer': {
            '0%':   { backgroundPosition: '0% 50%' },
            '50%':  { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'rotate(8deg) scale(1.1)',
            boxShadow: isDark ? `0 0 24px ${ORO}88` : '0 4px 16px rgba(229,57,53,0.6)',
          },
        }}>
          G
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{
            fontWeight: 800, color: logoTextColor, lineHeight: 1.1,
            textShadow: isDark ? `0 0 12px ${ORO}66` : 'none',
          }}>
            GNARC
          </Typography>
          <Typography variant="caption" sx={{ lineHeight: 1, color: isDark ? 'text.secondary' : '#94A3B8' }}>
            Rectificaciones
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, px: 1 }}>
        <List dense disablePadding>
          {visibleItems.map((item, idx) => {
            if (item.divider) return <Divider key={`div-${idx}`} sx={{ my: 1, borderColor: dividerColor }} />

            if (item.children) {
              const groupActive = isGroupActive(item)
              const open = !!openGroups[item.label]
              return (
                <React.Fragment key={item.label}>
                  <ListItemButton
                    selected={groupActive}
                    onClick={() => toggleGroup(item.label)}
                    sx={navItemSx(groupActive)}
                  >
                    <ListItemIcon sx={{
                      minWidth: 36,
                      color: groupActive ? navTextActive : (isDark ? 'text.secondary' : '#9CA3AF'),
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: groupActive ? 700 : 400,
                        color: groupActive ? navTextActive : navText,
                      }}
                    />
                    {open
                      ? <ExpandLessIcon sx={{ fontSize: 18, color: groupActive ? navTextActive : (isDark ? 'text.secondary' : '#9CA3AF') }} />
                      : <ExpandMoreIcon sx={{ fontSize: 18, color: groupActive ? navTextActive : (isDark ? 'text.secondary' : '#9CA3AF') }} />
                    }
                  </ListItemButton>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <List dense disablePadding sx={{ pl: 1.5 }}>
                      {item.children.map((child) => {
                        const childActive = isActive(child.path)
                        return (
                          <ListItemButton
                            key={child.path}
                            selected={childActive}
                            onClick={() => navigate(child.path)}
                            sx={navItemSx(childActive)}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <Box sx={{
                                width: 6, height: 6, borderRadius: '50%',
                                bgcolor: childActive ? navTextActive : (isDark ? 'text.secondary' : '#9CA3AF'),
                              }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={child.label}
                              primaryTypographyProps={{
                                fontSize: '0.813rem',
                                fontWeight: childActive ? 700 : 400,
                                color: childActive ? navTextActive : navText,
                              }}
                            />
                          </ListItemButton>
                        )
                      })}
                    </List>
                  </Collapse>
                </React.Fragment>
              )
            }

            return (
              <ListItemButton
                key={item.path}
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={navItemSx(isActive(item.path))}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: isActive(item.path) ? navTextActive : (isDark ? 'text.secondary' : '#9CA3AF'),
                  '& svg': {
                    transition: 'transform 0.25s ease',
                    filter: isActive(item.path) && isDark ? `drop-shadow(0 0 4px ${ORO}99)` : 'none',
                  },
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 700 : 400,
                    color: isActive(item.path) ? navTextActive : navText,
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>

      {/* User footer */}
      <Box sx={{
        p: 2,
        borderTop: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', gap: 1.5,
        background: isDark ? `linear-gradient(0deg, ${ORO}08 0%, transparent 100%)` : 'transparent',
      }}>
        <Avatar
          src={user?.avatar || undefined}
          sx={{
            width: 36, height: 36,
            bgcolor: accent, color: accentContrast,
            fontSize: 14, fontWeight: 700,
            boxShadow: isDark ? `0 0 0 2px ${ORO}44, 0 0 12px ${ORO}33` : '0 0 0 2px #1A73E844',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: isDark ? `0 0 0 3px ${ORO}88, 0 0 20px ${ORO}55` : '0 0 0 3px #1A73E888',
              transform: 'scale(1.1)',
            },
          }}
        >
          {user?.first_name?.[0] || user?.username?.[0] || '?'}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{
            fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            color: isDark ? 'text.primary' : '#1A1A2E',
          }}>
            {user?.nombre_completo || user?.username}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? 'text.secondary' : '#6B7280' }}>
            {user?.rol}
          </Typography>
        </Box>
      </Box>

    </Box>
  )
}
