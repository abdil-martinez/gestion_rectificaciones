import { createTheme } from '@mui/material/styles'

export const ORO       = '#CBab58'   // R203 G171 B88
export const ORO_DARK  = '#96783C'
export const ORO_LIGHT = '#E8D494'
export const NAVY      = '#0F1932'
export const NAVY2     = '#19284B'
export const BG_DEFAULT = '#0D1627'

// ── Dark / Medianoche azul profundo ──────────────────────────────────────────
const dark = {
  bgDefault:  '#0C1220',   // medianoche
  bgPaper:    '#141C30',   // azul profundo
  bgSurface:  '#080E18',   // noche cerrada
  bgHover:    '#1E2C48',   // hover azul profundo
  bgSelected: `${ORO}18`,
  textPrimary:    '#E8EEFA',   // blanco azulado
  textSecondary:  '#7088B0',   // acero azul
  divider:    '#1E2C44',       // separador azul oscuro
  sidebarBg:  '#080E18',       // sidebar noche cerrada
  appbarBg:   '#141C30',       // appbar azul profundo
  tableHead:  '#0C1220',       // cabecera medianoche
  tableRowHover: '#1E2C48',
  cardBorder: '#1E2C44',
}

// ── Light / Arena / Desierto ──────────────────────────────────────────────────
const light = {
  bgDefault:  '#F0EBE0',   // arena pálida
  bgPaper:    '#FAF6F0',   // blanco arena
  bgSurface:  '#E6DDD0',   // arena oscuro
  bgHover:    '#DDD3C4',   // hover arena
  bgSelected: `${ORO}20`,
  textPrimary:    '#201808',   // marrón arena oscuro
  textSecondary:  '#786050',   // arena medio
  divider:    '#C8BAA8',       // separador arena
  sidebarBg:  '#E6DDD0',       // sidebar arena oscuro
  appbarBg:   '#E6DDD0',       // appbar arena oscuro
  tableHead:  '#DDD3C4',       // cabecera arena
  tableRowHover: '#DDD3C4',
  cardBorder: '#C8BAA8',
}

export const createAppTheme = (mode) => {
  const t  = mode === 'dark' ? dark : light
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main:         ORO,
        dark:         ORO_DARK,
        light:        ORO_LIGHT,
        contrastText: NAVY,
      },
      secondary: {
        main:         isDark ? '#4C9FE8' : '#2A6DB5',
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
      success: { main: '#4CAF50' },
      warning: { main: '#FF9800' },
      error:   { main: '#F44336' },
      info:    { main: '#2196F3' },
      divider: t.divider,
      // Custom tokens accessible via theme.vars (MUI v5 approach via augmentation)
      // We expose them as palette.custom for use in components
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
            borderBottom: `2px solid ${ORO}`,
            boxShadow: isDark
              ? '0 2px 12px rgba(0,0,0,0.4)'
              : '0 2px 8px rgba(0,0,0,0.08)',
            color: isDark ? '#fff' : t.textPrimary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          containedPrimary: {
            color: NAVY,
            fontWeight: 700,
            '&:hover': { backgroundColor: ORO_DARK },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          colorPrimary: { backgroundColor: ORO, color: NAVY, fontWeight: 600 },
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
              : '0 1px 6px rgba(0,0,0,0.06)',
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
              color: isDark ? ORO : ORO_DARK,
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: `2px solid ${t.divider}`,
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': { backgroundColor: t.tableRowHover },
            '&.Mui-selected': { backgroundColor: t.bgSelected },
            '&.Mui-selected:hover': { backgroundColor: isDark ? `${ORO}18` : `${ORO}22` },
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
              color: ORO,
              '& .MuiListItemIcon-root': { color: ORO },
              '&:hover': { backgroundColor: isDark ? `${ORO}33` : `${ORO}28` },
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
            backgroundColor: isDark ? '#1E2C48' : '#201808',
            color: isDark ? '#E8EEFA' : '#FAF6F0',
            fontSize: '0.78rem',
          },
        },
      },
    },
  })
}

// Retrocompatibilidad: exportar tema dark por defecto
export const theme = createAppTheme('dark')
