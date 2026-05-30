import React, { useState, useMemo } from 'react'
import {
  Box, Typography, TextField, Button, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Checkbox, FormControlLabel, Divider, Stack, InputAdornment,
  Alert, Tooltip, IconButton, Collapse,
  Stepper, Step, StepLabel,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import TuneIcon from '@mui/icons-material/Tune'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import FilterListIcon from '@mui/icons-material/FilterList'
import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@mui/material/styles'
import { MOCK_HA_PREVISION } from './mockDataPrevision'
import { MOCK_FO_RESULTADO } from './mockDataFO'
import { MOCK_RE } from './mockDataRE'

const AFP_LABEL = { 2: 'Previsión', 1: 'Futuro de Bolivia' }

function fmtNum(n, dec = 2) {
  return Number(n).toLocaleString('es-BO', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function fmtPeriodo(p) {
  return `${p.slice(0, 4)}/${p.slice(4)}`
}

function buildIndex(data) {
  const periods = []
  const byPeriod = {}
  for (const row of data) {
    if (!byPeriod[row.periodo]) {
      byPeriod[row.periodo] = []
      periods.push(row.periodo)
    }
    byPeriod[row.periodo].push(row)
  }
  return { periods: periods.sort(), byPeriod }
}

export default function AjustesPrevision() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [activeStep, setActiveStep] = useState(0)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [reFilterConsec, setReFilterConsec] = useState('')
  const [reFilterSalMin, setReFilterSalMin] = useState('')
  const [reFilterSalMax, setReFilterSalMax] = useState('')
  const [reFilterDias, setReFilterDias] = useState(new Set())
  const [cuaInput, setCuaInput] = useState('')
  const [searchedCua, setSearchedCua] = useState(null)
  const [data, setData] = useState([])
  const [selectedPeriods, setSelectedPeriods] = useState(new Set())
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [periodFilter, setPeriodFilter] = useState('')
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  const [rangeError, setRangeError] = useState('')
  const [error, setError] = useState('')

  const { periods, byPeriod } = useMemo(() => buildIndex(data), [data])

  const filteredPeriods = useMemo(() => {
    const q = periodFilter.replace('/', '').trim()
    if (!q) return periods
    return periods.filter(p => p.includes(q))
  }, [periods, periodFilter])

  const handleSearch = () => {
    const cua = cuaInput.trim()
    if (!cua) { setError('Ingrese un CUA'); return }
    const found = MOCK_HA_PREVISION.filter(r => r.cua === cua)
    if (!found.length) { setError(`No se encontraron registros para CUA ${cua}`); return }
    setError('')
    setData(found)
    setSearchedCua(cua)
    setActiveStep(0)
    setSelectedPeriods(new Set())
    setSelectedRows(new Set())
    setPeriodFilter('')
    setRangeFrom('')
    setRangeTo('')
    setRangeError('')
  }

  const normalizePeriod = (val) => val.replace('/', '').trim()

  const handleApplyRange = () => {
    const from = normalizePeriod(rangeFrom)
    const to   = normalizePeriod(rangeTo)
    if (!from && !to) { setRangeError('Ingrese al menos un período'); return }
    if ((from && !/^\d{6}$/.test(from)) || (to && !/^\d{6}$/.test(to))) {
      setRangeError('Formato inválido — use AAAAMM (ej. 201601)')
      return
    }
    const f = from || periods[0]
    const t = to   || periods[periods.length - 1]
    if (f > t) { setRangeError('El período "Desde" debe ser menor o igual al "Hasta"'); return }
    setRangeError('')
    const inRange = periods.filter(p => p >= f && p <= t)
    if (!inRange.length) { setRangeError('No hay períodos en ese rango'); return }
    setSelectedPeriods(prev => {
      const next = new Set(prev)
      inRange.forEach(p => next.add(p))
      return next
    })
  }

  const handleClearRange = () => {
    const from = normalizePeriod(rangeFrom)
    const to   = normalizePeriod(rangeTo)
    const f = from || periods[0]
    const t = to   || periods[periods.length - 1]
    setRangeError('')
    setSelectedPeriods(prev => {
      const next = new Set(prev)
      periods.filter(p => p >= f && p <= t).forEach(p => next.delete(p))
      return next
    })
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch() }

  const togglePeriod = (p) => {
    setSelectedPeriods(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  const allSelected = filteredPeriods.length > 0 && filteredPeriods.every(p => selectedPeriods.has(p))
  const someSelected = filteredPeriods.some(p => selectedPeriods.has(p)) && !allSelected

  const toggleAll = () => {
    setSelectedPeriods(prev => {
      const next = new Set(prev)
      if (allSelected) filteredPeriods.forEach(p => next.delete(p))
      else filteredPeriods.forEach(p => next.add(p))
      return next
    })
  }

  const toggleRow = (id) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const togglePeriodRows = (p) => {
    const rows = byPeriod[p] || []
    const allSel = rows.every(r => selectedRows.has(r.id))
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (allSel) rows.forEach(r => next.delete(r.id))
      else rows.forEach(r => next.add(r.id))
      return next
    })
  }

  const visibleRows = useMemo(() => {
    if (!selectedPeriods.size) return []
    return data.filter(r => selectedPeriods.has(r.periodo))
  }, [data, selectedPeriods])

  const summary = useMemo(() => {
    if (!selectedPeriods.size) return null
    const rows = visibleRows
    return {
      periodos: selectedPeriods.size,
      registros: rows.length,
      totalSalario: rows.reduce((s, r) => s + r.salario, 0),
      totalCotizacion: rows.reduce((s, r) => s + r.cotizacion, 0),
      totalCuotas: rows.reduce((s, r) => s + r.cuotas, 0),
    }
  }, [visibleRows, selectedPeriods])

  const foSummary = useMemo(() => {
    if (!selectedRows.size) return null
    const rows = visibleRows.filter(r => selectedRows.has(r.id))
    if (!rows.length) return null
    return {
      registros: rows.length,
      totalSalario: rows.reduce((s, r) => s + r.salario, 0),
      totalCotizacion: rows.reduce((s, r) => s + r.cotizacion, 0),
      totalCuotas: rows.reduce((s, r) => s + r.cuotas, 0),
    }
  }, [visibleRows, selectedRows])

  const periodTotals = useMemo(() => {
    const t = {}
    for (const p of periods) {
      const rows = byPeriod[p] || []
      t[p] = {
        sal: rows.reduce((s, r) => s + r.salario, 0),
        cuotas: rows.reduce((s, r) => s + r.cuotas, 0),
        count: rows.length,
      }
    }
    return t
  }, [periods, byPeriod])

  // Lookup: (periodo+salario) -> cuota HA de las filas seleccionadas
  const haLookup = useMemo(() => {
    const map = {}
    for (const row of visibleRows) {
      if (!selectedRows.has(row.id)) continue
      const key = `${row.periodo}_${row.salario}`
      if (!map[key]) map[key] = 0
      map[key] += row.cuotas
    }
    return map
  }, [visibleRows, selectedRows])

  // Filas FO+resultado filtradas por períodos seleccionados
  const foMergedRows = useMemo(() =>
    MOCK_FO_RESULTADO.filter(r => selectedPeriods.has(r.periodo))
  , [selectedPeriods])

  // Filas RE filtradas por períodos seleccionados
  const reRows = useMemo(() =>
    MOCK_RE.filter(r => selectedPeriods.has(r.periodo))
  , [selectedPeriods])

  // Días únicos disponibles (para chips)
  const reDiasOptions = useMemo(() =>
    [...new Set(reRows.map(r => r.dias))].sort((a, b) => a - b)
  , [reRows])

  // Filas RE con filtros aplicados
  const filteredReRows = useMemo(() => {
    let rows = reRows
    if (reFilterConsec.trim())
      rows = rows.filter(r => r.consecutivo.includes(reFilterConsec.trim()))
    const sMin = parseFloat(reFilterSalMin)
    const sMax = parseFloat(reFilterSalMax)
    if (!isNaN(sMin)) rows = rows.filter(r => r.salario >= sMin)
    if (!isNaN(sMax)) rows = rows.filter(r => r.salario <= sMax)
    if (reFilterDias.size > 0) rows = rows.filter(r => reFilterDias.has(r.dias))
    return rows
  }, [reRows, reFilterConsec, reFilterSalMin, reFilterSalMax, reFilterDias])

  const reFiltersActive = reFilterConsec.trim() || reFilterSalMin || reFilterSalMax || reFilterDias.size > 0

  const clearReFilters = () => {
    setReFilterConsec('')
    setReFilterSalMin('')
    setReFilterSalMax('')
    setReFilterDias(new Set())
  }

  const toggleReFilterDias = (d) => {
    setReFilterDias(prev => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  const toggleExpand = (key) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const firstRow = data[0]

  const cellSx = {
    py: 0.6, px: 1.5, fontSize: '0.78rem',
    borderBottom: `1px solid ${isDark ? '#2a3d6b' : '#e8eaf0'}`,
  }
  const headSx = { ...cellSx, fontWeight: 700, bgcolor: isDark ? '#1a2a4a' : '#f0f3fa', whiteSpace: 'nowrap' }

  return (
    <Box sx={{ p: 3, maxWidth: 1400 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <TuneIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Ajustes — Previsión</Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3, maxWidth: 600 }}>
        <Step><StepLabel>Historial de Aportes</StepLabel></Step>
        <Step><StepLabel>FO</StepLabel></Step>
        <Step><StepLabel>RE</StepLabel></Step>
      </Stepper>

      {/* ── PASO 1: Historial de Aportes ── */}
      {activeStep === 0 && <>

      {/* Search bar */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary">
          Búsqueda por CUA del Asegurado
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <TextField
            label="CUA"
            placeholder="Ej. 19305564"
            value={cuaInput}
            onChange={e => setCuaInput(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            sx={{ width: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            error={!!error}
            helperText={error}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ height: 40, textTransform: 'none', fontWeight: 600 }}
          >
            Buscar
          </Button>
        </Stack>
      </Paper>

      {/* Results */}
      {searchedCua && data.length > 0 && (
        <>
          {/* Info card */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">CUA</Typography>
              <Typography variant="body1" fontWeight={700}>{firstRow.cua}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">CI</Typography>
              <Typography variant="body1" fontWeight={600}>{firstRow.ci}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">AFP Origen</Typography>
              <Chip
                label={AFP_LABEL[firstRow.afp] || firstRow.afp}
                size="small"
                color="primary"
                sx={{ fontWeight: 600, mt: 0.2 }}
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Períodos encontrados</Typography>
              <Typography variant="body1" fontWeight={600}>{periods.length}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total registros</Typography>
              <Typography variant="body1" fontWeight={600}>{data.length}</Typography>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>

            {/* Period selector panel */}
            <Paper variant="outlined" sx={{ width: 280, flexShrink: 0, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{
                px: 2, py: 1.5,
                bgcolor: isDark ? '#1a2a4a' : '#f0f3fa',
                borderBottom: `1px solid ${isDark ? '#2a3d6b' : '#e0e4ef'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Typography variant="subtitle2" fontWeight={700}>Seleccionar Períodos</Typography>
                <Tooltip title={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}>
                  <IconButton size="small" onClick={toggleAll}>
                    {allSelected
                      ? <CheckBoxIcon fontSize="small" color="primary" />
                      : someSelected
                        ? <IndeterminateCheckBoxIcon fontSize="small" color="primary" />
                        : <CheckBoxOutlineBlankIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Period filter input */}
              <Box sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${isDark ? '#2a3d6b' : '#e0e4ef'}` }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Buscar período (ej. 2016, 201603)"
                  value={periodFilter}
                  onChange={e => setPeriodFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                />
                {periodFilter && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {filteredPeriods.length} de {periods.length} período{periods.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>

              {/* Range selector */}
              <Box sx={{ px: 1.5, py: 1.2, borderBottom: `1px solid ${isDark ? '#2a3d6b' : '#e0e4ef'}` }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Por rango
                </Typography>
                <Stack direction="row" spacing={1} mb={1}>
                  <TextField
                    size="small"
                    label="Desde"
                    placeholder="201601"
                    value={rangeFrom}
                    onChange={e => { setRangeFrom(e.target.value); setRangeError('') }}
                    inputProps={{ maxLength: 7 }}
                    sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                  />
                  <TextField
                    size="small"
                    label="Hasta"
                    placeholder="201704"
                    value={rangeTo}
                    onChange={e => { setRangeTo(e.target.value); setRangeError('') }}
                    inputProps={{ maxLength: 7 }}
                    sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                  />
                </Stack>
                {rangeError && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.8 }}>
                    {rangeError}
                  </Typography>
                )}
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleApplyRange}
                    sx={{ flex: 1, fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}
                  >
                    Seleccionar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={handleClearRange}
                    sx={{ flex: 1, fontSize: '0.75rem', textTransform: 'none' }}
                  >
                    Quitar
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
                {filteredPeriods.length === 0 ? (
                  <Box sx={{ px: 2, py: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Sin resultados para "{periodFilter}"
                    </Typography>
                  </Box>
                ) : null}
                {filteredPeriods.map(p => {
                  const t = periodTotals[p]
                  const checked = selectedPeriods.has(p)
                  return (
                    <Box
                      key={p}
                      onClick={() => togglePeriod(p)}
                      sx={{
                        px: 2, py: 1.2,
                        cursor: 'pointer',
                        borderBottom: `1px solid ${isDark ? '#2a3d6b' : '#eef0f8'}`,
                        bgcolor: checked
                          ? (isDark ? '#1a3a6a' : '#e8eeff')
                          : 'transparent',
                        '&:hover': { bgcolor: isDark ? '#1a3060' : '#f0f2fb' },
                        display: 'flex', alignItems: 'flex-start', gap: 1,
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        size="small"
                        sx={{ p: 0, mt: 0.1, flexShrink: 0 }}
                        onClick={e => { e.stopPropagation(); togglePeriod(p) }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={checked ? 700 : 500}>
                          {fmtPeriodo(p)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {t.count} reg · Bs {fmtNum(t.sal)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtNum(t.cuotas, 8)} cuotas
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Paper>

            {/* Table / right side */}
            <Box sx={{ flex: 1, minWidth: 0 }}>

              {/* Summary strip */}
              {summary && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5, mb: 1.5, borderRadius: 2,
                    display: 'flex', gap: 3, flexWrap: 'wrap',
                    bgcolor: isDark ? '#0f2040' : '#eef1ff',
                    borderColor: isDark ? '#2a4a8a' : '#c5caec',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">Períodos sel.</Typography>
                    <Typography variant="body2" fontWeight={700}>{summary.periodos}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Registros</Typography>
                    <Typography variant="body2" fontWeight={700}>{summary.registros}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Salario</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">Bs {fmtNum(summary.totalSalario)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Cotización</Typography>
                    <Typography variant="body2" fontWeight={700}>Bs {fmtNum(summary.totalCotizacion)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Cuotas</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">{fmtNum(summary.totalCuotas, 8)}</Typography>
                  </Box>
                </Paper>
              )}

              {/* FO selection summary */}
              {foSummary && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5, mb: 1.5, borderRadius: 2,
                    display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center',
                    bgcolor: isDark ? '#0d2a1a' : '#e8f5e9',
                    borderColor: isDark ? '#1b5e20' : '#a5d6a7',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Para FO
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Filas sel.</Typography>
                    <Typography variant="body2" fontWeight={700}>{foSummary.registros}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Salario</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">Bs {fmtNum(foSummary.totalSalario)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Cotización</Typography>
                    <Typography variant="body2" fontWeight={700}>Bs {fmtNum(foSummary.totalCotizacion)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Cuotas HA (a reemplazar)</Typography>
                    <Typography variant="body2" fontWeight={700} color="warning.main">{fmtNum(foSummary.totalCuotas, 8)}</Typography>
                  </Box>
                </Paper>
              )}

              {!selectedPeriods.size ? (
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Seleccione uno o más períodos para ver el detalle del historial de aportes.
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 520, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ ...headSx, width: 36, px: 1 }} />
                        <TableCell sx={headSx}>Período</TableCell>
                        <TableCell sx={headSx}>Días</TableCell>
                        <TableCell sx={{ ...headSx, textAlign: 'right' }}>Salario (Bs)</TableCell>
                        <TableCell sx={headSx}>Planilla</TableCell>
                        <TableCell sx={{ ...headSx, textAlign: 'right' }}>Cotización (Bs)</TableCell>
                        <TableCell sx={{ ...headSx, textAlign: 'right' }}>Cuotas</TableCell>
                        <TableCell sx={{ ...headSx, textAlign: 'center' }}>Signo</TableCell>
                        <TableCell sx={headSx}>Empleador</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.from(selectedPeriods).sort().map(p => {
                        const rows = byPeriod[p] || []
                        const t = periodTotals[p]
                        const allPeriodSel = rows.every(r => selectedRows.has(r.id))
                        const somePeriodSel = rows.some(r => selectedRows.has(r.id)) && !allPeriodSel
                        return (
                          <React.Fragment key={p}>
                            {rows.map((row, i) => {
                              const rowSel = selectedRows.has(row.id)
                              return (
                                <TableRow
                                  key={row.id}
                                  onClick={() => toggleRow(row.id)}
                                  sx={{
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: isDark ? '#1a2a4a' : '#f0f4ff' },
                                    bgcolor: rowSel
                                      ? (isDark ? '#0d2a1a' : '#f0fff4')
                                      : i % 2 === 0 ? 'transparent' : (isDark ? '#111d35' : '#fafbff'),
                                  }}
                                >
                                  <TableCell sx={{ ...cellSx, px: 1, width: 36 }}>
                                    <Checkbox
                                      checked={rowSel}
                                      size="small"
                                      sx={{ p: 0 }}
                                      onClick={e => { e.stopPropagation(); toggleRow(row.id) }}
                                    />
                                  </TableCell>
                                  <TableCell sx={cellSx}>{i === 0 ? fmtPeriodo(row.periodo) : ''}</TableCell>
                                  <TableCell sx={cellSx}>{row.dias}</TableCell>
                                  <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.salario)}</TableCell>
                                  <TableCell sx={{ ...cellSx, fontFamily: 'monospace', fontSize: '0.72rem' }}>{row.planilla}</TableCell>
                                  <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.cotizacion)}</TableCell>
                                  <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.cuotas, 8)}</TableCell>
                                  <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                                    <Chip
                                      label={row.signo}
                                      size="small"
                                      color={row.signo === 'CRE' ? 'success' : 'error'}
                                      sx={{ fontSize: '0.7rem', height: 20, fontWeight: 700 }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ ...cellSx, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Tooltip title={row.empleador} placement="left">
                                      <span>{row.empleador}</span>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                            {/* Period subtotal row */}
                            <TableRow
                              sx={{ bgcolor: isDark ? '#1a2a4a' : '#eef1ff', cursor: 'pointer' }}
                              onClick={() => togglePeriodRows(p)}
                            >
                              <TableCell sx={{ ...cellSx, px: 1, width: 36 }}>
                                <Checkbox
                                  checked={allPeriodSel}
                                  indeterminate={somePeriodSel}
                                  size="small"
                                  sx={{ p: 0 }}
                                  onClick={e => { e.stopPropagation(); togglePeriodRows(p) }}
                                />
                              </TableCell>
                              <TableCell sx={{ ...cellSx, fontWeight: 700, color: 'primary.main' }}>
                                Subtotal {fmtPeriodo(p)}
                              </TableCell>
                              <TableCell sx={cellSx} />
                              <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700 }}>{fmtNum(t.sal)}</TableCell>
                              <TableCell sx={cellSx} />
                              <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700 }}>
                                {fmtNum(t.sal * 0.1)}
                              </TableCell>
                              <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700, color: 'success.main' }}>
                                {fmtNum(t.cuotas, 8)}
                              </TableCell>
                              <TableCell sx={cellSx} />
                              <TableCell sx={cellSx} />
                            </TableRow>
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        </>
      )}

      {/* Botón Siguiente — solo visible cuando hay filas seleccionadas */}
      {searchedCua && data.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Tooltip title={!foSummary ? 'Seleccioná al menos un total en la tabla para continuar' : ''}>
            <span>
              <Button
                variant="contained"
                size="large"
                disabled={!foSummary}
                endIcon={<ArrowForwardIcon />}
                onClick={() => setActiveStep(1)}
                sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}
              >
                Siguiente
              </Button>
            </span>
          </Tooltip>
        </Box>
      )}

      {/* fin paso 1 */}
      </>}

      {/* ── PASO 2: FO ── */}
      {activeStep === 1 && <>

        {/* Navegación */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setActiveStep(0)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Volver al Historial
          </Button>
        </Box>

        {/* Resumen de lo seleccionado en Paso 1 */}
        {foSummary && (
          <Paper variant="outlined" sx={{
            p: 2, mb: 3, borderRadius: 2,
            bgcolor: isDark ? '#0d2a1a' : '#e8f5e9',
            borderColor: isDark ? '#1b5e20' : '#a5d6a7',
          }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              Totales seleccionados del Historial de Aportes
            </Typography>
            <Stack direction="row" spacing={4} flexWrap="wrap">
              <Box>
                <Typography variant="caption" color="text.secondary">Filas</Typography>
                <Typography variant="body1" fontWeight={700}>{foSummary.registros}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Períodos</Typography>
                <Typography variant="body1" fontWeight={700}>{selectedPeriods.size}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Salario</Typography>
                <Typography variant="body1" fontWeight={700} color="success.main">Bs {fmtNum(foSummary.totalSalario)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Cotización</Typography>
                <Typography variant="body1" fontWeight={700}>Bs {fmtNum(foSummary.totalCotizacion)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Cuotas HA actuales</Typography>
                <Typography variant="body1" fontWeight={700} color="warning.main">{fmtNum(foSummary.totalCuotas, 8)}</Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Tabla FO + Resultado */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headSx, width: 32, px: 1 }} />
                <TableCell sx={headSx}>Período</TableCell>
                <TableCell sx={headSx}>Seq. Det.</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Salario (Bs)</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Cuotas FO</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Monto Prev. (Bs)</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right', color: 'success.main' }}>Total Cuotas Equiv.</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Cuota HA actual</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Diferencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                // Agrupar por periodo para mostrar subtotales
                const byPeriodo = {}
                for (const row of foMergedRows) {
                  if (!byPeriodo[row.periodo]) byPeriodo[row.periodo] = []
                  byPeriodo[row.periodo].push(row)
                }
                const elements = []
                for (const periodo of Array.from(selectedPeriods).sort()) {
                  const rows = byPeriodo[periodo] || []
                  const periodTotalEquiv = rows.reduce((s, r) => s + r.total_cuotas_equiv, 0)
                  const periodHaTotal = rows.reduce((s, r) => {
                    const k = `${r.periodo}_${r.salario}`
                    return s + (haLookup[k] || 0)
                  }, 0)

                  rows.forEach((row, i) => {
                    const rowKey = `${row.periodo}_${row.seq}`
                    const expanded = expandedRows.has(rowKey)
                    const haKey = `${row.periodo}_${row.salario}`
                    const haCuota = haLookup[haKey] || null
                    const diff = haCuota != null ? row.total_cuotas_equiv - haCuota : null

                    elements.push(
                      <TableRow
                        key={rowKey}
                        onClick={() => toggleExpand(rowKey)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: i % 2 === 0 ? 'transparent' : (isDark ? '#111d35' : '#fafbff'),
                          '&:hover': { bgcolor: isDark ? '#1a2a4a' : '#f0f4ff' },
                        }}
                      >
                        <TableCell sx={{ ...cellSx, px: 1 }}>
                          <IconButton size="small" sx={{ p: 0 }}>
                            {expanded
                              ? <KeyboardArrowDownIcon fontSize="small" />
                              : <KeyboardArrowRightIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={cellSx}>{i === 0 ? fmtPeriodo(row.periodo) : ''}</TableCell>
                        <TableCell sx={{ ...cellSx, fontFamily: 'monospace' }}>{row.seq}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{fmtNum(row.salario)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{fmtNum(row.suma_cuotas_fo, 8)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{fmtNum(row.monto_prev)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700, color: 'success.main' }}>
                          {fmtNum(row.total_cuotas_equiv, 8)}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', color: 'text.secondary' }}>
                          {haCuota != null ? fmtNum(haCuota, 8) : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right' }}>
                          {diff != null ? (
                            <Typography variant="caption" fontWeight={700}
                              sx={{ color: diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary' }}>
                              {diff > 0 ? '+' : ''}{fmtNum(diff, 8)}
                            </Typography>
                          ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                      </TableRow>
                    )

                    // Filas de detalle FO (sub-transacciones) expandibles
                    elements.push(
                      <TableRow key={`${rowKey}_detail`}>
                        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <Box sx={{
                              mx: 4, my: 0.5, mb: 1,
                              borderRadius: 1,
                              border: `1px solid ${isDark ? '#2a3d6b' : '#dde1f0'}`,
                              overflow: 'hidden',
                            }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: isDark ? '#0d1a30' : '#f5f6ff' }}>
                                    <TableCell sx={{ ...cellSx, fontWeight: 700, fontSize: '0.72rem' }}>Sub-transacción</TableCell>
                                    <TableCell sx={{ ...cellSx, fontWeight: 700, fontSize: '0.72rem', textAlign: 'right' }}>Cant. Cuotas</TableCell>
                                    <TableCell sx={{ ...cellSx, fontWeight: 700, fontSize: '0.72rem', textAlign: 'right' }}>Monto (Bs)</TableCell>
                                    <TableCell sx={{ ...cellSx, fontWeight: 700, fontSize: '0.72rem' }}>Fecha</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {row.fo_detail.map((d, di) => (
                                    <TableRow key={di} sx={{ bgcolor: 'transparent' }}>
                                      <TableCell sx={{ ...cellSx, fontSize: '0.72rem' }}>
                                        <Chip label={`${d.sub} — ${d.label}`} size="small"
                                          sx={{ fontSize: '0.68rem', height: 18, fontWeight: 600 }} />
                                      </TableCell>
                                      <TableCell sx={{ ...cellSx, fontSize: '0.72rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                        {fmtNum(d.cant_cuotas, 8)}
                                      </TableCell>
                                      <TableCell sx={{ ...cellSx, fontSize: '0.72rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                        {fmtNum(d.monto)}
                                      </TableCell>
                                      <TableCell sx={{ ...cellSx, fontSize: '0.72rem', color: 'text.secondary' }}>{d.fec}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )
                  })

                  // Subtotal del período
                  elements.push(
                    <TableRow key={`${periodo}_sub`} sx={{ bgcolor: isDark ? '#1a2a4a' : '#eef1ff' }}>
                      <TableCell sx={cellSx} />
                      <TableCell sx={{ ...cellSx, fontWeight: 700, color: 'primary.main' }}>
                        Subtotal {fmtPeriodo(periodo)}
                      </TableCell>
                      <TableCell sx={cellSx} />
                      <TableCell sx={cellSx} />
                      <TableCell sx={cellSx} />
                      <TableCell sx={cellSx} />
                      <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700, color: 'success.main' }}>
                        {fmtNum(periodTotalEquiv, 8)}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700 }}>
                        {periodHaTotal > 0 ? fmtNum(periodHaTotal, 8) : '—'}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700 }}>
                        {periodHaTotal > 0 ? (
                          <Typography variant="caption" fontWeight={700}
                            sx={{ color: (periodTotalEquiv - periodHaTotal) >= 0 ? 'success.main' : 'error.main' }}>
                            {(periodTotalEquiv - periodHaTotal) >= 0 ? '+' : ''}
                            {fmtNum(periodTotalEquiv - periodHaTotal, 8)}
                          </Typography>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  )
                }
                return elements
              })()}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Botón Siguiente → RE */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setActiveStep(2)}
            sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}
          >
            Siguiente
          </Button>
        </Box>

      {/* fin paso 2 */}
      </>}

      {/* ── PASO 3: RE ── */}
      {activeStep === 2 && <>

        {/* Navegación */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setActiveStep(1)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Volver a FO
          </Button>
        </Box>

        {/* Resumen primas — reactivo a filtros */}
        {reRows.length > 0 && (() => {
          const src = filteredReRows
          const totalRcBs = src.reduce((s, r) => s + r.prima_rc_bs, 0)
          const totalRpBs = src.reduce((s, r) => s + r.prima_rp_bs, 0)
          const periodos   = new Set(src.map(r => r.periodo)).size
          return (
            <Paper variant="outlined" sx={{
              p: 2, mb: 2, borderRadius: 2,
              bgcolor: isDark ? '#1a1000' : '#fff8e1',
              borderColor: isDark ? '#5d4037' : '#ffe082',
            }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                Resumen Primas — RE
              </Typography>
              <Stack direction="row" spacing={4} flexWrap="wrap" alignItems="flex-end">
                <Box>
                  <Typography variant="caption" color="text.secondary">Períodos</Typography>
                  <Typography variant="body1" fontWeight={700}>{periodos}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Registros</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {src.length}
                    {reFiltersActive && <Typography component="span" variant="caption" color="text.secondary"> / {reRows.length} total</Typography>}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Prima RC total (Bs)</Typography>
                  <Typography variant="body1" fontWeight={700} color="warning.dark">Bs {fmtNum(totalRcBs)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Prima RP total (Bs)</Typography>
                  <Typography variant="body1" fontWeight={700}>Bs {fmtNum(totalRpBs)}</Typography>
                </Box>
              </Stack>
            </Paper>
          )
        })()}

        {/* Barra de filtros */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={700}>Filtros</Typography>
            {reFiltersActive && (
              <Button
                size="small"
                startIcon={<CloseIcon fontSize="small" />}
                onClick={clearReFilters}
                sx={{ ml: 'auto', textTransform: 'none', fontSize: '0.75rem' }}
              >
                Limpiar
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1.5} alignItems="flex-start">

            {/* Consecutivo */}
            <TextField
              size="small"
              label="Consecutivo"
              placeholder="Ej. 5707059"
              value={reFilterConsec}
              onChange={e => setReFilterConsec(e.target.value)}
              sx={{ width: 160 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                endAdornment: reFilterConsec ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setReFilterConsec('')}><CloseIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            {/* Rango salario */}
            <TextField
              size="small"
              label="Salario mín."
              placeholder="0.00"
              value={reFilterSalMin}
              onChange={e => setReFilterSalMin(e.target.value)}
              type="number"
              sx={{ width: 130 }}
            />
            <TextField
              size="small"
              label="Salario máx."
              placeholder="Sin límite"
              value={reFilterSalMax}
              onChange={e => setReFilterSalMax(e.target.value)}
              type="number"
              sx={{ width: 130 }}
            />

            {/* Chips de días */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Días cotizados
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {reDiasOptions.map(d => (
                  <Chip
                    key={d}
                    label={`${d} días`}
                    size="small"
                    clickable
                    color={reFilterDias.has(d) ? 'primary' : 'default'}
                    variant={reFilterDias.has(d) ? 'filled' : 'outlined'}
                    onClick={() => toggleReFilterDias(d)}
                    sx={{ fontWeight: reFilterDias.has(d) ? 700 : 400 }}
                  />
                ))}
              </Stack>
            </Box>

          </Stack>

          {reFiltersActive && filteredReRows.length === 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              Sin resultados con los filtros actuales.
            </Typography>
          )}
        </Paper>

        {/* Tabla RE */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Período</TableCell>
                <TableCell sx={headSx}>Consecutivo</TableCell>
                <TableCell sx={headSx}>Seq.</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'center' }}>Días</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Salario (Bs)</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Cotización (Bs)</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Prima RC (Bs)</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Prima RP (Bs)</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Tot. Cuota RC</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Tot. Cuota RP</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right', color: 'warning.main' }}>Prima RC calc. (Bs)</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Prima RP calc. (Bs)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const byPeriodo = {}
                for (const r of filteredReRows) {
                  if (!byPeriodo[r.periodo]) byPeriodo[r.periodo] = []
                  byPeriodo[r.periodo].push(r)
                }
                const elements = []
                for (const periodo of Array.from(selectedPeriods).sort()) {
                  const rows = byPeriodo[periodo] || []
                  if (!rows.length) continue
                  const totRc     = rows.reduce((s, r) => s + r.tot_cuota_rc, 0)
                  const totRp     = rows.reduce((s, r) => s + r.tot_cuota_rp, 0)
                  const totRcBs   = rows.reduce((s, r) => s + r.prima_rc_bs, 0)
                  const totRpBs   = rows.reduce((s, r) => s + r.prima_rp_bs, 0)
                  const totSal    = rows.reduce((s, r) => s + r.salario, 0)

                  rows.forEach((row, i) => {
                    elements.push(
                      <TableRow
                        key={`${row.consecutivo}_${row.seq}`}
                        sx={{
                          bgcolor: i % 2 === 0 ? 'transparent' : (isDark ? '#111d35' : '#fafbff'),
                          '&:hover': { bgcolor: isDark ? '#1a2a4a' : '#f8f9ff' },
                        }}
                      >
                        <TableCell sx={cellSx}>{i === 0 ? fmtPeriodo(periodo) : ''}</TableCell>
                        <TableCell sx={{ ...cellSx, fontFamily: 'monospace', fontSize: '0.72rem' }}>{row.consecutivo}</TableCell>
                        <TableCell sx={{ ...cellSx, fontFamily: 'monospace' }}>{row.seq}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'center' }}>{row.dias}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.salario)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.cotizacion)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.prima_rc)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.prima_rp)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.tot_cuota_rc, 8)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.tot_cuota_rp, 8)}</TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 600, color: 'warning.dark', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtNum(row.prima_rc_bs)}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(row.prima_rp_bs)}</TableCell>
                      </TableRow>
                    )
                  })

                  // Subtotal período
                  elements.push(
                    <TableRow key={`${periodo}_sub`} sx={{ bgcolor: isDark ? '#1a1500' : '#fff3cd' }}>
                      <TableCell sx={{ ...cellSx, fontWeight: 700, color: 'warning.dark' }}>
                        Subtotal {fmtPeriodo(periodo)}
                      </TableCell>
                      <TableCell sx={cellSx} />
                      <TableCell sx={cellSx} />
                      <TableCell sx={cellSx} />
                      <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700 }}>{fmtNum(totSal)}</TableCell>
                      <TableCell sx={cellSx} />
                      <TableCell sx={cellSx} />
                      <TableCell sx={cellSx} />
                      <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700 }}>{fmtNum(totRc, 8)}</TableCell>
                      <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700 }}>{fmtNum(totRp, 8)}</TableCell>
                      <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700, color: 'warning.dark' }}>{fmtNum(totRcBs)}</TableCell>
                      <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 700 }}>{fmtNum(totRpBs)}</TableCell>
                    </TableRow>
                  )
                }
                return elements
              })()}
            </TableBody>
          </Table>
        </TableContainer>

      {/* fin paso 3 */}
      </>}

    </Box>
  )
}
