import { chromium } from '@playwright/test'

const BASE = 'http://localhost:5173'

async function shot(page, name) {
  const path = `C:/Users/amart/proyectos-claude/gestion_rectificaciones/screenshots/crea_${name}.png`
  await page.screenshot({ path, fullPage: false })
  console.log(`  [Screenshot] crea_${name}.png`)
}

// Selecciona la primera opción disponible de un MUI Select por su label
async function selectFirstOption(page, labelText) {
  const label  = page.locator(`label:has-text("${labelText}")`).first()
  const forId  = await label.getAttribute('for').catch(() => null)
  const select = forId
    ? page.locator(`[id="${forId}"]`)
    : label.locator('xpath=../..').locator('.MuiSelect-select').first()
  await select.click({ force: true })
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 })
  const options = page.locator('[role="option"]').filter({ hasNot: page.locator('[data-value=""]') })
  const count = await options.count()
  if (count === 0) throw new Error(`No hay opciones para "${labelText}"`)
  await options.first().click({ force: true })
  await page.waitForTimeout(300)
}

;(async () => {
  const { mkdirSync } = await import('fs')
  mkdirSync('C:/Users/amart/proyectos-claude/gestion_rectificaciones/screenshots', { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page    = await browser.newPage()
  page.setDefaultTimeout(15000)

  // Limpiar borrador guardado para empezar limpio
  await page.addInitScript(() => localStorage.removeItem('wizard_solicitud_draft'))

  const errors = []
  page.on('pageerror', e => errors.push(e.message))

  let passed = 0, failed = 0
  const ok   = (msg) => { console.log(`  [OK] ${msg}`); passed++ }
  const fail = (msg) => { console.log(`  [FAIL] ${msg}`); failed++ }

  // Cédula única para este test
  const cedulaTest = `TEST${Date.now().toString().slice(-8)}`

  try {
    // ── LOGIN ────────────────────────────────────
    console.log('\n=== LOGIN ===')
    await page.goto(`${BASE}/login`)
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'Admin123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE}/`, { timeout: 8000 })
    ok('Login exitoso')

    // ── PASO 1 — ASEGURADO ───────────────────────
    console.log('\n=== PASO 1 — ASEGURADO ===')
    await page.goto(`${BASE}/solicitudes/nueva`)
    await page.waitForSelector('text=Datos del Asegurado', { timeout: 8000 })
    await shot(page, '01_paso1')
    ok('Wizard cargado — Paso 1')

    // Cédula (campo obligatorio)
    await page.fill('input[name="asegurado_data.cedula"]', cedulaTest)
    await page.keyboard.press('Tab')
    await page.waitForTimeout(1200) // esperar búsqueda async

    // Nombre (campo obligatorio)
    await page.fill('input[name="asegurado_data.nombre"]', 'Carlos')
    await page.fill('input[name="asegurado_data.ap_paterno"]', 'Prueba')
    await page.waitForTimeout(200)
    await shot(page, '02_paso1_lleno')
    ok('Paso 1 completado')

    // ── PASO 2 — EMPLEADOR ───────────────────────
    console.log('\n=== PASO 2 — EMPLEADOR ===')
    await page.click('button:has-text("Siguiente")')
    await page.waitForSelector('text=Datos del Empleador', { timeout: 6000 })
    await shot(page, '03_paso2')
    ok('Avanzó al Paso 2 — Empleador')

    await page.fill('input[name="empleador_data.nombre_razon_social"]', 'Empresa Test RE SA')
    await page.waitForTimeout(200)
    await shot(page, '04_paso2_lleno')
    ok('Paso 2 completado')

    // ── PASO 3 — DETALLE ─────────────────────────
    console.log('\n=== PASO 3 — DETALLE ===')
    await page.click('button:has-text("Siguiente")')
    await page.waitForSelector('text=Detalle de la Rectificación', { timeout: 6000 })
    await shot(page, '05_paso3')
    ok('Avanzó al Paso 3 — Detalle')

    // Tipo de Causal (obligatorio)
    await selectFirstOption(page, 'Tipo de Causal')
    ok('Tipo de Causal seleccionado')

    // Tipo Regional (opcional) → Regional
    const tiposRegOptions = page.locator('[role="option"]')
    // Seleccionar VALLES en Tipo de Regional
    try {
      await selectFirstOption(page, 'Tipo de Regional')
      await page.waitForTimeout(500)
      await selectFirstOption(page, 'Regional (Departamento)')
      ok('Tipo de Regional y Regional seleccionados')
    } catch {
      ok('Regional no seleccionada (opcional)')
    }

    await shot(page, '06_paso3_lleno')

    // ── PASO 4 — FORMULARIOS ─────────────────────
    console.log('\n=== PASO 4 — FORMULARIOS ===')
    await page.click('button:has-text("Siguiente")')
    await page.waitForSelector('text=Rectificador FPC', { timeout: 6000 })
    await shot(page, '07_paso4')
    ok('Avanzó al Paso 4 — Formularios (sin llenar)')

    // ── PASO 5 — SOLICITANTE ─────────────────────
    console.log('\n=== PASO 5 — SOLICITANTE ===')
    await page.click('button:has-text("Siguiente")')
    await page.waitForTimeout(1500) // esperar query getMe
    await page.waitForSelector('text=Datos del Solicitante', { timeout: 6000 })
    await shot(page, '08_paso5')
    ok('Avanzó al Paso 5 — Solicitante')

    // Verificar que hay datos del usuario en sesión
    const panelSolic = await page.locator('text=/Nombre Completo|Correo/i').count() > 0
    panelSolic ? ok('Panel de datos del solicitante visible') : fail('Panel de solicitante no encontrado')

    // ── PASO 6 — RESUMEN ─────────────────────────
    console.log('\n=== PASO 6 — RESUMEN ===')
    await page.click('button:has-text("Siguiente")')
    await page.waitForSelector('text=Resumen de la Solicitud', { timeout: 6000 })
    await shot(page, '09_resumen')
    ok('Avanzó al Paso 6 — Resumen')

    // Verificar que el resumen muestra los datos ingresados
    const resumenText = await page.locator('text=Carlos').count() > 0
    resumenText ? ok('Resumen muestra nombre del asegurado') : fail('Resumen no muestra nombre')

    // ── CREAR SOLICITUD ───────────────────────────
    console.log('\n=== CREAR SOLICITUD ===')
    await page.click('button:has-text("Crear Solicitud")')

    // Esperar navegación a la página de detalle
    await page.waitForURL(/\/solicitudes\/\d+$/, { timeout: 15000 })
    await page.waitForTimeout(1000)
    await shot(page, '10_detalle_creado')
    ok('Solicitud creada — navegó al detalle')

    // Capturar el número de solicitud de la URL y la página
    const url = page.url()
    const idMatch = url.match(/\/solicitudes\/(\d+)$/)
    const solicitudId = idMatch ? idMatch[1] : null
    console.log(`  ID de solicitud: ${solicitudId}`)

    // Buscar el número RE en la página
    const pageText = await page.content()
    const reMatch  = pageText.match(/RE\d{4}-\d{6}/)
    if (reMatch) {
      console.log(`  Número de solicitud: ${reMatch[0]}`)
      ok(`Formato RE correcto: ${reMatch[0]}`)

      // Verificar patrón exacto
      const patronRE = /^RE\d{4}-\d{6}$/.test(reMatch[0])
      patronRE
        ? ok(`Patrón RE{AÑO}-{XXXXXX} verificado`)
        : fail(`Patrón incorrecto: ${reMatch[0]}`)
    } else {
      // Puede ser que sea formato viejo si el backend no se reinició
      const viejoMatch = pageText.match(/\d{4}-\d{5}/)
      if (viejoMatch) {
        fail(`Formato viejo detectado: ${viejoMatch[0]} — reinicia el backend para aplicar RE{AÑO}-{XXXXXX}`)
      } else {
        fail('No se encontró número de solicitud en la página')
      }
    }

    // Verificar título/encabezado de la página de detalle
    const h5 = await page.locator('h5, h4, h6').first().innerText().catch(() => '')
    console.log(`  Título de página: ${h5}`)
    await shot(page, '11_detalle_numero')

    // ── VERIFICAR EN LISTA ────────────────────────
    console.log('\n=== VERIFICAR EN LISTA ===')
    await page.goto(`${BASE}/solicitudes`)
    await page.waitForSelector('table tbody tr', { timeout: 8000 })
    await page.waitForTimeout(500)

    const listaTexto = await page.locator('table').first().innerText()
    if (reMatch && listaTexto.includes(reMatch[0])) {
      ok(`Número ${reMatch[0]} aparece en la lista de solicitudes`)
    } else if (reMatch) {
      // Puede estar en página 2, buscar por cédula
      await page.fill('input[placeholder*="Buscar"]', cedulaTest)
      await page.waitForTimeout(1200)
      const filtrado = await page.locator('table').first().innerText()
      filtrado.includes(reMatch[0])
        ? ok(`Número ${reMatch[0]} encontrado buscando por cédula`)
        : fail('Número RE no aparece en la lista filtrada')
    }
    await shot(page, '12_lista_con_nueva')

    // ── ERRORES JS ────────────────────────────────
    console.log('\n=== ERRORES JS ===')
    if (errors.length === 0) {
      ok('Sin errores JS')
    } else {
      errors.forEach(e => console.log(`  [ERROR JS] ${e}`))
      fail(`${errors.length} error(es) JS`)
    }

  } catch (err) {
    console.error(`\n[EXCEPCIÓN] ${err.message}`)
    await shot(page, 'error')
    failed++
  } finally {
    await browser.close()
    console.log(`\n${'═'.repeat(50)}`)
    console.log(`  RESULTADO: ${passed} pasadas / ${failed} fallidas`)
    console.log(failed === 0 ? '  ✓ TODAS LAS PRUEBAS PASARON' : '  ✗ HAY PRUEBAS FALLIDAS')
    console.log('═'.repeat(50))
  }
})()
