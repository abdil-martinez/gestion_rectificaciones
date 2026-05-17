import { chromium } from '@playwright/test'

const BASE = 'http://localhost:5173'

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="username"]', 'admin')
  await page.fill('input[name="password"]', 'Admin123!')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`, { timeout: 8000 })
}

async function shot(page, name) {
  const path = `C:/Users/amart/proyectos-claude/gestion_rectificaciones/screenshots/reg_${name}.png`
  await page.screenshot({ path, fullPage: false })
  console.log(`  [Screenshot] reg_${name}.png`)
}

// Navega a Config → categoría → abre diálogo Nuevo → llena campos → guarda
async function crearRegistro(page, categoriaLabel, campos) {
  // Click en la categoría del sidebar
  await page.locator(`text=${categoriaLabel}`).first().click()
  await page.waitForTimeout(600)

  // Click en botón "Nuevo"
  await page.click('button:has-text("Nuevo")')
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  await page.waitForTimeout(400)

  for (const [label, value] of Object.entries(campos)) {
    // Buscar el campo por su label
    const labelEl = page.locator(`[role="dialog"] label:has-text("${label}")`).first()
    const forId = await labelEl.getAttribute('for').catch(() => null)
    if (forId) {
      const input = page.locator(`#${forId}`)
      const tagName = await input.evaluate(el => el.tagName).catch(() => null)
      if (tagName === 'INPUT') {
        await input.fill(String(value))
      } else {
        // Es un select MUI
        await input.click({ force: true })
        await page.waitForSelector('[role="listbox"]', { timeout: 4000 })
        await page.locator(`[role="option"]:has-text("${value}")`).first().click({ force: true })
        await page.waitForTimeout(300)
      }
    } else {
      // Buscar select MUI por div con rol combobox cercano al label
      const selectDiv = page.locator(`[role="dialog"]`).locator(`div.MuiSelect-select`).filter({ hasText: '' }).first()
      await selectDiv.click({ force: true })
      await page.waitForSelector('[role="listbox"]', { timeout: 4000 })
      await page.locator(`[role="option"]:has-text("${value}")`).first().click({ force: true })
      await page.waitForTimeout(300)
    }
  }

  // Click en Crear
  await page.click('[role="dialog"] button:has-text("Crear")')
  await page.waitForTimeout(800)

  // Verificar que el diálogo se cerró (éxito) o mostrar el error
  const dialogStillOpen = await page.locator('[role="dialog"]').count()
  if (dialogStillOpen > 0) {
    const errText = await page.locator('[role="dialog"]').innerText().catch(() => '?')
    throw new Error(`Diálogo no se cerró. Contenido: ${errText.slice(0, 200)}`)
  }
}

// Versión robusta para fk_select: busca el select MUI por label adyacente
async function selectFkField(page, labelText, optionText) {
  const label = page.locator(`[role="dialog"] label`).filter({ hasText: labelText }).first()
  await label.waitFor({ timeout: 4000 })

  const forId = await label.getAttribute('for').catch(() => null)

  let selectEl
  if (forId) {
    // MUI genera IDs con colons (:r2p:) — usar atributo en lugar de selector CSS #id
    selectEl = page.locator(`[role="dialog"] [id="${forId}"]`).first()
  } else {
    selectEl = label.locator('xpath=../..').locator('.MuiSelect-select').first()
  }

  await selectEl.click({ force: true })
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 })

  const option = page.locator(`[role="option"]:has-text("${optionText}")`).first()
  await option.waitFor({ timeout: 4000 })
  await option.click({ force: true })
  await page.waitForTimeout(300)
}

;(async () => {
  const { mkdirSync } = await import('fs')
  mkdirSync('C:/Users/amart/proyectos-claude/gestion_rectificaciones/screenshots', { recursive: true })

  const browser = await chromium.launch({ headless: false, slowMo: 80 })
  const page    = await browser.newPage()
  page.setDefaultTimeout(15000)

  let passed = 0, failed = 0
  const errors = []
  page.on('pageerror', e => errors.push(e.message))

  function ok(msg)   { console.log(`  [OK] ${msg}`); passed++ }
  function fail(msg) { console.log(`  [FAIL] ${msg}`); failed++ }

  const REGIONALES = [
    // [nombre, tipoRegional]
    ['Cochabamba',  'VALLES'],
    ['Tarija',      'VALLES'],
    ['Chuquisaca',  'VALLES'],
    ['Santa Cruz',  'ORIENTE'],
    ['Beni',        'ORIENTE'],
    ['Pando',       'ORIENTE'],
    ['La Paz',      'OCCIDENTE'],
    ['Oruro',       'OCCIDENTE'],
    ['Potosí',      'OCCIDENTE'],
  ]

  try {
    console.log('\n=== LOGIN ===')
    await login(page)
    ok('Login exitoso')

    console.log('\n=== NAVEGANDO A CONFIGURACIÓN ===')
    await page.goto(`${BASE}/config`)
    await page.waitForSelector('text=Configuración del Sistema', { timeout: 8000 })
    ok('Página de configuración cargada')

    // Verificar que Tipos de Regional tiene VALLES, ORIENTE, OCCIDENTE
    console.log('\n=== VERIFICANDO TIPOS DE REGIONAL ===')
    await page.locator('text=Tipos de Regional').first().click()
    await page.waitForTimeout(800)
    await shot(page, '01_tipos_regional')

    const tipoRows = await page.locator('table tbody tr').count()
    console.log(`  Tipos de Regional en tabla: ${tipoRows}`)
    const tableText = await page.locator('table').first().innerText().catch(() => '')
    const hasValles    = tableText.includes('VALLES')
    const hasOriente   = tableText.includes('ORIENTE')
    const hasOccidente = tableText.includes('OCCIDENTE')
    hasValles    ? ok('VALLES presente')    : fail('VALLES NO encontrado')
    hasOriente   ? ok('ORIENTE presente')   : fail('ORIENTE NO encontrado')
    hasOccidente ? ok('OCCIDENTE presente') : fail('OCCIDENTE NO encontrado')

    // Si falta alguno, crearlos
    if (!hasValles) {
      await page.click('button:has-text("Nuevo")')
      await page.waitForSelector('[role="dialog"]')
      await page.fill('[role="dialog"] input', 'VALLES')
      await page.click('[role="dialog"] button:has-text("Crear")')
      await page.waitForTimeout(600)
      ok('VALLES creado')
    }
    if (!hasOriente) {
      await page.click('button:has-text("Nuevo")')
      await page.waitForSelector('[role="dialog"]')
      await page.fill('[role="dialog"] input', 'ORIENTE')
      await page.click('[role="dialog"] button:has-text("Crear")')
      await page.waitForTimeout(600)
      ok('ORIENTE creado')
    }
    if (!hasOccidente) {
      await page.click('button:has-text("Nuevo")')
      await page.waitForSelector('[role="dialog"]')
      await page.fill('[role="dialog"] input', 'OCCIDENTE')
      await page.click('[role="dialog"] button:has-text("Crear")')
      await page.waitForTimeout(600)
      ok('OCCIDENTE creado')
    }

    // Ir a Regionales
    console.log('\n=== CREANDO 9 REGIONALES ===')
    await page.locator('text=Regionales').first().click()
    await page.waitForTimeout(800)
    await shot(page, '02_regionales_lista_inicial')

    // Verificar que el FK select de Tipo de Regional está en el diálogo
    await page.click('button:has-text("Nuevo")')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.waitForTimeout(500)
    await shot(page, '03_dialogo_nueva_regional')

    const hasTipoRegField = await page.locator('[role="dialog"] label:has-text("Tipo de Regional")').count() > 0
    hasTipoRegField ? ok('Campo Tipo de Regional en diálogo') : fail('Campo Tipo de Regional NO encontrado')

    // Cerrar diálogo vacío
    await page.click('[role="dialog"] button:has-text("Cancelar")')
    await page.waitForTimeout(300)

    // Crear cada regional
    for (const [nombre, tipo] of REGIONALES) {
      console.log(`  Creando: ${nombre} (${tipo})`)
      try {
        await page.click('button:has-text("Nuevo")')
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
        await page.waitForTimeout(400)

        // Llenar nombre
        await page.fill('[role="dialog"] input[name="nombre"], [role="dialog"] input:first-of-type', nombre)
        await page.waitForTimeout(200)

        // Seleccionar tipo_regional
        await selectFkField(page, 'Tipo de Regional', tipo)

        // Guardar
        await page.click('[role="dialog"] button:has-text("Crear")')
        await page.waitForTimeout(1000)

        const dialogOpen = await page.locator('[role="dialog"]').count()
        if (dialogOpen === 0) {
          ok(`Regional "${nombre}" (${tipo}) creada`)
        } else {
          // Puede ser error de duplicado (ya existía)
          const content = await page.locator('[role="dialog"]').innerText()
          if (content.includes('ya existe') || content.includes('unique') || content.includes('duplicad')) {
            await page.click('[role="dialog"] button:has-text("Cancelar")')
            ok(`Regional "${nombre}" ya existía — omitida`)
          } else {
            await page.click('[role="dialog"] button:has-text("Cancelar")')
            fail(`Regional "${nombre}" no se pudo crear: ${content.slice(0, 100)}`)
          }
        }
      } catch (e) {
        // Cerrar diálogo si quedó abierto
        await page.locator('[role="dialog"] button:has-text("Cancelar")').click({ force: true }).catch(() => {})
        fail(`Error creando "${nombre}": ${e.message.slice(0, 80)}`)
      }
    }

    await shot(page, '04_regionales_lista_final')

    // Verificar que las 9 regionales aparecen en la tabla
    await page.waitForTimeout(500)
    const tableFinal = await page.locator('table').first().innerText().catch(() => '')
    let encontradas = 0
    for (const [nombre] of REGIONALES) {
      if (tableFinal.includes(nombre)) {
        encontradas++
      } else {
        console.log(`  [WARN] "${nombre}" no visible en tabla`)
      }
    }
    console.log(`  Regionales encontradas en tabla: ${encontradas}/9`)
    encontradas >= 9 ? ok('Las 9 regionales están en la tabla') : fail(`Solo ${encontradas}/9 regionales visibles`)

    // Verificar que la columna Tipo de Regional muestra el nombre (no el ID)
    const showsValles = tableFinal.includes('VALLES')
    showsValles ? ok('Columna Tipo de Regional muestra nombre (VALLES)') : fail('Columna Tipo de Regional NO muestra nombre')

    // Errores JS
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
