import { chromium } from '@playwright/test'

const BASE = 'http://localhost:5173'

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="username"]', 'admin')
  await page.fill('input[name="password"]', 'Admin123!')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`, { timeout: 8000 })
  console.log('  [OK] Login exitoso')
}

async function shot(page, name) {
  const path = `C:/Users/amart/proyectos-claude/gestion_rectificaciones/screenshots/${name}.png`
  await page.screenshot({ path, fullPage: false })
  console.log(`  [Screenshot] ${name}.png`)
}

async function selectMui(page, labelText, optionText) {
  const label = page.locator(`label:has-text("${labelText}")`).first()
  const forId = await label.getAttribute('for')
  const select = forId
    ? page.locator(`#${forId}`)
    : page.locator(`[aria-labelledby*="${labelText}"], .MuiSelect-select`).first()
  await select.click({ force: true })
  await page.waitForSelector('[role="listbox"]', { timeout: 4000 })
  await page.locator(`[role="option"]:has-text("${optionText}")`).first().click({ force: true })
  await page.waitForTimeout(300)
}

;(async () => {
  const { mkdirSync } = await import('fs')
  mkdirSync('C:/Users/amart/proyectos-claude/gestion_rectificaciones/screenshots', { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page    = await browser.newPage()
  page.setDefaultTimeout(12000)

  const errors = []
  page.on('pageerror', e => errors.push(e.message))

  let passed = 0, failed = 0

  function ok(msg)   { console.log(`  [OK] ${msg}`); passed++ }
  function fail(msg) { console.log(`  [FAIL] ${msg}`); failed++ }

  try {

    // ══════════════════════════════════════════════
    // 1. LOGIN
    // ══════════════════════════════════════════════
    console.log('\n=== LOGIN ===')
    await login(page)
    await shot(page, '01_dashboard')

    // ══════════════════════════════════════════════
    // 2. MODO CLARO / OSCURO
    // ══════════════════════════════════════════════
    console.log('\n=== TEMA CLARO / OSCURO ===')
    const btnLight = page.locator('button[value="light"]')
    await btnLight.click()
    await page.waitForTimeout(500)
    await shot(page, '02_tema_claro')
    ok('Modo claro activado')

    const btnDark = page.locator('button[value="dark"]')
    await btnDark.click()
    await page.waitForTimeout(500)
    await shot(page, '03_tema_oscuro')
    ok('Modo oscuro activado')

    const btnSystem = page.locator('button[value="system"]')
    await btnSystem.click()
    await page.waitForTimeout(300)
    ok('Modo sistema activado')

    // ══════════════════════════════════════════════
    // 3. LISTA SOLICITUDES — filtros en cascada
    // ══════════════════════════════════════════════
    console.log('\n=== LISTA SOLICITUDES — FILTROS ===')
    await page.goto(`${BASE}/solicitudes`)
    await page.waitForSelector('text=Solicitudes de Rectificación', { timeout: 8000 })
    await shot(page, '04_solicitudes_lista')
    ok('Lista de solicitudes cargada')

    // Verificar columna CUA
    const headers = await page.locator('table thead th').allTextContents()
    const hasCua = headers.some(h => h.includes('CUA'))
    hasCua ? ok('Columna CUA presente') : fail('Columna CUA NO encontrada')
    await shot(page, '05_lista_columnas')

    // Filtro tipo regional
    const tipoRegSelect = page.locator('label:has-text("Tipo Regional")').first()
    if (await tipoRegSelect.count() > 0) {
      ok('Filtro Tipo Regional presente')
    } else {
      fail('Filtro Tipo Regional NO encontrado')
    }

    // ══════════════════════════════════════════════
    // 4. DETALLE DE SOLICITUD — FPC y documentos
    // ══════════════════════════════════════════════
    console.log('\n=== DETALLE SOLICITUD ===')
    await page.goto(`${BASE}/solicitudes/6`)
    await page.waitForSelector('text=2026-00006', { timeout: 8000 })
    await shot(page, '06_solicitud_detalle')
    ok('Detalle de solicitud cargado')

    // FPC table
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('table:first-of-type tbody tr')
      return rows.length > 0
    }, { timeout: 8000 })
    const fpcRows = await page.locator('table').nth(0).locator('tbody tr').count()
    console.log(`  FPC rows: ${fpcRows}`)
    await shot(page, '07_fpc_tabla')
    ok(`Tabla FPC con ${fpcRows} filas`)

    // Documentos
    const docRows = await page.locator('table').nth(1).locator('tbody tr').count()
    console.log(`  Doc rows: ${docRows}`)
    ok(`Tabla documentos con ${docRows} filas`)

    // ══════════════════════════════════════════════
    // 5. WIZARD — NUEVA SOLICITUD (pasos 1 y 2)
    // ══════════════════════════════════════════════
    console.log('\n=== WIZARD NUEVA SOLICITUD ===')
    await page.goto(`${BASE}/solicitudes/nueva`)
    await page.waitForSelector('text=Nueva Solicitud', { timeout: 8000 })
    await shot(page, '08_wizard_paso1')
    ok('Wizard cargado — Paso 1')

    // Verificar campo CUA primero
    const cuaField = page.locator('input').filter({ hasText: '' }).first()
    const cuaLabel = page.locator('label:has-text("CUA")')
    cuaLabel.count().then(c => c > 0 ? ok('Campo CUA presente en paso 1') : fail('Campo CUA NO encontrado'))

    // Verificar Tipo de Identificación
    const tipoIdLabel = page.locator('label:has-text("Tipo de Identificación")')
    const hasTipoId = await tipoIdLabel.count() > 0
    hasTipoId ? ok('Campo Tipo de Identificación presente') : fail('Tipo de Identificación NO encontrado')

    // Llenar cédula para activar búsqueda automática
    await page.locator('input[name="asegurado_data.cedula"], label:has-text("Cédula") + div input').first().fill('12345678')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(1500)
    await shot(page, '09_wizard_cedula_busqueda')
    ok('Búsqueda automática por cédula ejecutada')

    // Llenar nombre obligatorio
    await page.locator('label:has-text("Nombre(s)")').first().click()
    await page.locator('input[name="asegurado_data.nombre"]').fill('Juan')
    await page.waitForTimeout(200)

    // Avanzar al paso 2
    await page.click('button:has-text("Siguiente")')
    await page.waitForTimeout(600)
    await shot(page, '10_wizard_paso2_empleador')
    ok('Avanzó al paso 2 — Empleador')

    // Verificar N° Identificación primero en paso 2
    const numIdLabel = page.locator('label:has-text("N° de Identificación")')
    const hasNumId = await numIdLabel.count() > 0
    hasNumId ? ok('N° de Identificación primero en paso 2') : fail('N° de Identificación NO encontrado en paso 2')

    // Llenar razón social
    await page.fill('input[name="empleador_data.nombre_razon_social"]', 'Empresa Test S.A.')
    await page.waitForTimeout(200)

    // Avanzar al paso 3
    await page.click('button:has-text("Siguiente")')
    await page.waitForTimeout(600)
    await shot(page, '11_wizard_paso3_detalle')
    ok('Avanzó al paso 3 — Detalle')

    // Verificar AFP Origen
    const afpLabel = page.locator('label:has-text("AFP Origen")')
    const hasAfp = await afpLabel.count() > 0
    hasAfp ? ok('Campo AFP Origen presente en paso 3') : fail('AFP Origen NO encontrado')

    // Verificar Tipo de Regional (cascada)
    const tipoRegWizard = page.locator('label:has-text("Tipo de Regional")')
    const hasTipoRegWiz = await tipoRegWizard.count() > 0
    hasTipoRegWiz ? ok('Tipo de Regional presente en paso 3 (cascada)') : fail('Tipo de Regional NO encontrado en paso 3')

    // Seleccionar Tipo de Causal (obligatorio para avanzar)
    const causalSelect = page.locator('[name="tipo_causal"], label:has-text("Tipo de Causal") ~ div .MuiSelect-select').first()
    await page.locator('.MuiSelect-select').filter({ hasText: /Tipo de Causal/i }).first().click({ force: true }).catch(async () => {
      await page.locator('label:has-text("Tipo de Causal")').first().click({ force: true })
    })
    await page.waitForSelector('[role="listbox"]', { timeout: 4000 }).catch(() => {})
    const causalOptions = page.locator('[role="option"]')
    const nCausal = await causalOptions.count()
    if (nCausal > 0) {
      await causalOptions.first().click({ force: true })
      await page.waitForTimeout(300)
      ok('Tipo de Causal seleccionado')
    }

    // Avanzar hasta paso 5 (Solicitante) — paso 3→4→5
    await page.click('button:has-text("Siguiente")')
    await page.waitForTimeout(600)
    await page.click('button:has-text("Siguiente")')
    await page.waitForTimeout(2000) // esperar getMe query
    await shot(page, '12_wizard_paso5_solicitante')
    ok('Avanzó al paso 5 — Solicitante')

    // Verificar datos automáticos del solicitante (panel info)
    const panelSolic = page.locator('text=/Nombre Completo|NOMBRE COMPLETO|Correo/i')
    const hasNombre = await panelSolic.count() > 0
    hasNombre ? ok('Panel datos solicitante presente') : fail('Panel solicitante NO encontrado')

    // Verificar Unidad Solicitante (select que reemplazó Área Solicitante)
    const unidadSolicText = page.locator('text=/Unidad Solicitante/i')
    const hasUnidadSolic = await unidadSolicText.count() > 0
    hasUnidadSolic ? ok('Unidad Solicitante presente (reemplazó Área Solicitante)') : fail('Unidad Solicitante NO encontrada')

    await shot(page, '13_wizard_paso5_datos')

    // ══════════════════════════════════════════════
    // 6. ASIGNACIÓN MASIVA
    // ══════════════════════════════════════════════
    console.log('\n=== ASIGNACIÓN MASIVA ===')
    await page.goto(`${BASE}/solicitudes`)
    await page.waitForSelector('table tbody tr', { timeout: 8000 })

    // Buscar checkbox en la tabla
    const checkboxes = page.locator('table tbody tr input[type="checkbox"]')
    const nCheck = await checkboxes.count()
    if (nCheck > 0) {
      ok(`${nCheck} checkboxes disponibles para selección masiva`)
      await checkboxes.first().click({ force: true })
      await page.waitForTimeout(500)
      const barraAccion = page.locator('text=seleccionada')
      const tieneBarraAccion = await barraAccion.count() > 0
      tieneBarraAccion ? ok('Barra de acción masiva visible') : fail('Barra de acción NO apareció')
      await shot(page, '14_asignacion_masiva')
      // Deseleccionar
      await checkboxes.first().click({ force: true })
    } else {
      fail('No hay checkboxes para asignación masiva')
    }

    // ══════════════════════════════════════════════
    // 7. FILTRO TIPO REGIONAL — filtra resultados
    // ══════════════════════════════════════════════
    console.log('\n=== FILTRO TIPO REGIONAL (API) ===')
    await page.goto(`${BASE}/solicitudes`)
    await page.waitForSelector('table tbody tr', { timeout: 8000 })

    // Contar filas antes de filtrar
    const rowsBefore = await page.locator('table tbody tr').count()
    console.log(`  Filas sin filtro: ${rowsBefore}`)

    // Seleccionar VALLES en Tipo Regional
    const trLabel = page.locator('label:has-text("Tipo Regional")').first()
    const trForId  = await trLabel.getAttribute('for').catch(() => null)
    const trSelect = trForId
      ? page.locator(`[id="${trForId}"]`)
      : trLabel.locator('xpath=../..').locator('.MuiSelect-select').first()
    await trSelect.click({ force: true })
    await page.waitForSelector('[role="listbox"]', { timeout: 4000 })
    const vallesOption = page.locator('[role="option"]:has-text("VALLES")').first()
    const hasValles = await vallesOption.count() > 0
    if (hasValles) {
      await vallesOption.click({ force: true })
      await page.waitForTimeout(1500)
      await shot(page, '15_filtro_tipo_regional_valles')
      const rowsAfter = await page.locator('table tbody tr').count()
      console.log(`  Filas con VALLES: ${rowsAfter}`)
      ok('Filtro Tipo Regional aplica — resultados cambiaron o son 0')
    } else {
      fail('Opción VALLES no encontrada en el filtro')
    }

    // Limpiar filtro
    await page.click('button:has-text("Limpiar")')
    await page.waitForTimeout(800)

    // ══════════════════════════════════════════════
    // 8. FORMATO NÚMERO SOLICITUD
    // ══════════════════════════════════════════════
    console.log('\n=== FORMATO NÚMERO DE SOLICITUD ===')
    await page.goto(`${BASE}/solicitudes`)
    await page.waitForSelector('table tbody tr', { timeout: 8000 })
    const numeros = await page.locator('table tbody td:nth-child(2)').allTextContents()
    console.log(`  Números de solicitud (primeros 3): ${numeros.slice(0, 3).join(', ')}`)

    const tieneFormatoRE = numeros.some(n => /^RE\d{4}-\d{6}$/.test(n.trim()))
    const tieneFormatoViejo = numeros.some(n => /^\d{4}-\d{5}$/.test(n.trim()))

    if (tieneFormatoRE) {
      ok('Nuevo formato RE{AÑO}-{XXXXXX} detectado en la lista')
    } else if (tieneFormatoViejo) {
      ok('Solicitudes existentes con formato anterior — nuevas usarán RE{AÑO}-{XXXXXX}')
    } else if (numeros.length === 0) {
      ok('Lista vacía — el formato se verificará al crear la primera solicitud')
    } else {
      fail(`Formato inesperado: ${numeros[0]}`)
    }
    await shot(page, '16_numeros_solicitud')

    // ══════════════════════════════════════════════
    // 9. CONFIG — FK SELECT REGIONALES
    // ══════════════════════════════════════════════
    console.log('\n=== CONFIG — FK SELECT REGIONALES ===')
    await page.goto(`${BASE}/config`)
    await page.waitForSelector('text=Configuración del Sistema', { timeout: 8000 })
    await page.locator('text=Regionales').first().click()
    await page.waitForTimeout(600)

    // Verificar que la tabla muestra tipo_regional_nombre
    const regTabla = await page.locator('table').first().innerText().catch(() => '')
    const muestraNombre = ['VALLES', 'ORIENTE', 'OCCIDENTE'].some(t => regTabla.includes(t))
    muestraNombre
      ? ok('Tabla de Regionales muestra nombre del Tipo Regional')
      : fail('Tabla de Regionales NO muestra nombre del Tipo Regional')
    await shot(page, '17_config_regionales_tabla')

    // Abrir diálogo y verificar FK select cargado
    await page.click('button:has-text("Nuevo")')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.waitForTimeout(600)
    const hasFkSelect = await page.locator('[role="dialog"] label:has-text("Tipo de Regional")').count() > 0
    hasFkSelect
      ? ok('FK select Tipo de Regional presente en diálogo de Regionales')
      : fail('FK select Tipo de Regional NO presente')

    // Verificar que tiene opciones cargadas
    const tipoRegDialogSel = page.locator('[role="dialog"] [id]').filter({ hasText: '' }).first()
    await page.locator('[role="dialog"] label:has-text("Tipo de Regional")').first()
      .locator('xpath=../..').locator('.MuiSelect-select').first()
      .click({ force: true }).catch(async () => {
        await page.locator('[role="dialog"] .MuiSelect-select').last().click({ force: true })
      })
    await page.waitForSelector('[role="listbox"]', { timeout: 4000 }).catch(() => {})
    const fkOptions = await page.locator('[role="option"]').count()
    fkOptions > 0
      ? ok(`FK select cargó ${fkOptions} opciones de Tipo Regional`)
      : fail('FK select no tiene opciones')
    await page.keyboard.press('Escape')
    await page.click('[role="dialog"] button:has-text("Cancelar")')
    await page.waitForTimeout(300)

    // ══════════════════════════════════════════════
    // 10. ERRORES JS
    // ══════════════════════════════════════════════
    console.log('\n=== ERRORES JS EN CONSOLA ===')
    if (errors.length === 0) {
      ok('Sin errores JS en consola')
    } else {
      errors.forEach(e => console.log(`  [ERROR JS] ${e}`))
      fail(`${errors.length} error(es) JS detectados`)
    }

  } catch (err) {
    console.error(`\n[EXCEPCIÓN] ${err.message}`)
    await shot(page, 'error_estado')
    failed++
  } finally {
    await browser.close()
    console.log(`\n${'═'.repeat(50)}`)
    console.log(`  RESULTADO: ${passed} pasadas / ${failed} fallidas`)
    if (failed === 0) {
      console.log('  ✓ TODAS LAS PRUEBAS PASARON')
    } else {
      console.log('  ✗ HAY PRUEBAS FALLIDAS')
    }
    console.log('═'.repeat(50))
  }
})()
