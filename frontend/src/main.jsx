import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { createAppTheme, ORO } from './theme'
import { useThemeStore } from './store/themeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function ThemeWrapper({ children }) {
  const { mode } = useThemeStore()
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })

  const effectiveMode = mode === 'system'
    ? (prefersDark ? 'dark' : 'light')
    : mode

  const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode])

  const toastBg     = effectiveMode === 'dark' ? '#141C30' : '#FAF6F0'
  const toastColor  = effectiveMode === 'dark' ? '#E8EEFA' : '#201808'
  const toastBorder = effectiveMode === 'dark' ? `1px solid ${ORO}` : `1px solid ${ORO}88`

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: toastBg,
            color:      toastColor,
            border:     toastBorder,
            boxShadow:  effectiveMode === 'dark'
              ? '0 4px 16px rgba(0,0,0,0.4)'
              : '0 4px 16px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: ORO, secondary: effectiveMode === 'dark' ? '#0F1932' : '#fff' } },
          error:   { iconTheme: { primary: '#F44336', secondary: '#fff' } },
        }}
      />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeWrapper>
          <App />
        </ThemeWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
