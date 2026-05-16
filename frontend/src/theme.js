import { createTheme } from '@mui/material/styles'

const ORO       = '#CBab58'   // R203 G171 B88
const ORO_DARK  = '#96783C'
const ORO_LIGHT = '#E8D494'
const NAVY      = '#0F1932'
const NAVY2     = '#19284B'
const BG_DEFAULT = '#0D1627'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main:         ORO,
      dark:         ORO_DARK,
      light:        ORO_LIGHT,
      contrastText: NAVY,
    },
    secondary: {
      main:         '#4C9FE8',
      contrastText: '#ffffff',
    },
    background: {
      default: BG_DEFAULT,
      paper:   NAVY2,
    },
    text: {
      primary:   '#FFFFFF',
      secondary: '#B0B8D0',
    },
    success: { main: '#4CAF50' },
    warning: { main: '#FF9800' },
    error:   { main: '#F44336' },
    info:    { main: '#2196F3' },
    divider: '#2A3D6B',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button:    { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: NAVY,
          borderRight: `1px solid ${ORO_DARK}44`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: NAVY2,
          borderBottom: `2px solid ${ORO}`,
          boxShadow: `0 2px 12px rgba(0,0,0,0.4)`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color:      NAVY,
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
          backgroundColor: NAVY2,
          border: `1px solid #2A3D6B`,
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: NAVY,
            color: ORO,
            fontWeight: 700,
            fontSize: '0.82rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#1f2f52' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#2A3D6B' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          mx: 1,
          '&.Mui-selected': {
            backgroundColor: `${ORO}22`,
            color: ORO,
            '& .MuiListItemIcon-root': { color: ORO },
            '&:hover': { backgroundColor: `${ORO}33` },
          },
          '&:hover': { backgroundColor: '#1f2f52' },
        },
      },
    },
  },
})

export { ORO, ORO_DARK, ORO_LIGHT, NAVY, NAVY2, BG_DEFAULT }
