import { createTheme } from '@mui/material/styles'

export const ORO       = '#CBab58'
export const ORO_DARK  = '#96783C'
export const ORO_LIGHT = '#E8D494'
export const NAVY      = '#0F1932'
export const NAVY2     = '#19284B'
export const BG_DEFAULT = '#0D1627'

// ── Modo claro / Azul Moderno ─────────────────────────────────────────────────
export const BRAND_RED    = '#E53935'
export const BRAND_BLUE   = '#1A73E8'
export const BRAND_INDIGO = '#3B4FC2'

// ── Dark / Medianoche azul profundo ──────────────────────────────────────────
const dark = {
  bgDefault:     '#0C1220',
  bgPaper:       '#141C30',
  bgSurface:     '#080E18',
  bgHover:       '#1E2C48',
  bgSelected:    `${ORO}18`,
  textPrimary:   '#E8EEFA',
  textSecondary: '#7088B0',
  divider:       '#1E2C44',
  sidebarBg:     '#080E18',
  appbarBg:      '#141C30',
  tableHead:     '#0C1220',
  tableRowHover: '#1E2C48',
  cardBorder:    '#1E2C44',
}

// ── Light / Azul Moderno · Gris Frío ─────────────────────────────────────────
const light = {
  bgDefault:     '#F5F6FA',
  bgPaper:       '#FFFFFF',
  bgSurface:     '#F5F6FA',
  bgHover:       '#EAEDF5',
  bgSelected:    '#EAEDF5',
  textPrimary:   '#1A1A2E',
  textSecondary: '#6B7280',
  divider:       '#D0D4E0',
  sidebarBg:     '#FFFFFF',
  appbarBg:      '#FFFFFF',
  tableHead:     '#F5F6FA',
  tableRowHover: '#F0F2F9',
  cardBorder:    '#D0D4E0',
}

export const createAppTheme = (mode) => {
  const t      = mode === 'dark' ? dark : light
  const isDark = mode === 'dark'

  const primaryMain  = isDark ? ORO        : BRAND_BLUE
  const primaryDark  = isDark ? ORO_DARK   : '#1557B0'
  const primaryLight = isDark ? ORO_LIGHT  : '#4D8EF0'
  const primaryText  = isDark ? NAVY       : '#ffffff'

  return createTheme({
    palette: {
      mode,
      primary: {
        main:         primaryMain,
        dark:         primaryDark,
        light:        primaryLight,
        contrastText: primaryText,
      },
      secondary: {
        main:         isDark ? '#4C9FE8' : BRAND_INDIGO,
        contrastText: '#ffffff',
      },
      background: {
        default: t.bgDefault,
        paper:   t.bgPaper,
      },
      text: {
        primary:   t.textPrimary,
        secondary: t.textSecondary,
      },
      success: { main: '#1DB954' },
      warning: { main: '#FF9800' },
      error:   { main: '#F44336' },
      info:    { main: '#2196F3' },
      divider: t.divider,
      custom: {
        bgSurface:  t.bgSurface,
        bgHover:    t.bgHover,
        bgSelected: t.bgSelected,
        sidebarBg:  t.sidebarBg,
        appbarBg:   t.appbarBg,
        tableHead:  t.tableHead,
        cardBorder: t.cardBorder,
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      h4:       { fontWeight: 700 },
      h5:       { fontWeight: 600 },
      h6:       { fontWeight: 600 },
      subtitle1:{ fontWeight: 500 },
      button:   { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: t.sidebarBg,
            borderRight: `1px solid ${t.divider}`,
            boxShadow: isDark ? '2px 0 12px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: t.appbarBg,
            borderBottom: `2px solid ${isDark ? ORO : BRAND_BLUE}`,
            boxShadow: isDark
              ? '0 2px 12px rgba(0,0,0,0.4)'
              : '0 1px 6px rgba(0,0,0,0.08)',
            color: isDark ? '#ffffff' : t.textPrimary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease',
          },
          containedPrimary: {
            color: isDark ? NAVY : '#ffffff',
            fontWeight: 700,
            '&:hover': {
              backgroundColor: primaryDark,
              transform: 'translateY(-1px)',
              boxShadow: isDark ? `0 4px 14px ${ORO}55` : '0 4px 12px rgba(26,115,232,0.4)',
            },
            '&:active': { transform: 'translateY(0)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: isDark ? ORO : BRAND_BLUE,
            color: isDark ? NAVY : '#ffffff',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: t.bgPaper,
            border: `1px solid ${t.cardBorder}`,
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 1px 6px rgba(0,0,0,0.25)'
              : '0 1px 4px rgba(0,0,0,0.07)',
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.2s ease',
            '&:hover': {
              boxShadow: isDark
                ? `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${ORO}22`
                : '0 4px 16px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: t.bgPaper,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: t.tableHead,
              color: isDark ? ORO : BRAND_BLUE,
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: `2px solid ${isDark ? t.divider : BRAND_BLUE}55`,
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease',
            '&:hover': { backgroundColor: t.tableRowHover },
            '&.Mui-selected': { backgroundColor: t.bgSelected },
            '&.Mui-selected:hover': { backgroundColor: isDark ? `${ORO}18` : '#EAEDF5' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: t.divider },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: t.divider },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiSelect:    { defaultProps: { size: 'small' } },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'transparent' : '#FFFFFF',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            borderColor: t.divider,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: t.bgSelected,
              color: isDark ? ORO : BRAND_INDIGO,
              '& .MuiListItemIcon-root': { color: isDark ? ORO : BRAND_INDIGO },
              '&:hover': { backgroundColor: isDark ? `${ORO}33` : '#E0E4F4' },
            },
            '&:hover': { backgroundColor: t.bgHover },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: t.bgPaper,
            border: `1px solid ${t.cardBorder}`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: t.bgPaper,
            border: `1px solid ${t.cardBorder}`,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#1E2C48' : '#1A1A2E',
            color: '#F5F6FA',
            fontSize: '0.78rem',
          },
        },
      },
    },
  })
}

// Retrocompatibilidad: exportar tema dark por defecto
export const theme = createAppTheme('dark')
