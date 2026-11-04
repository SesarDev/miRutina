import { expect, test, type Page } from '@playwright/test'

/** Weight and reps typed with the numeric keyboard, then «Serie hecha» and a feel. */
async function logSet(page: Page, weight: string, reps: string, feel: string) {
  await page.getByRole('textbox', { name: 'Peso en kilos' }).fill(weight)
  await page.getByRole('textbox', { name: 'Repeticiones' }).fill(reps)
  await page.getByRole('textbox', { name: 'Repeticiones' }).blur()
  await page.getByRole('button', { name: 'Serie hecha' }).click()
  await page.getByRole('button', { name: feel, exact: true }).click()
}

const doneRows = (page: Page) => page.getByRole('button', { name: /^Serie \d+: .*, hecha/ })

test('registrar una sesión, recargar a mitad, continuar y terminar', async ({ page }) => {
  // A routine with one exercise, made through the editor like the user does.
  await page.goto('/rutinas')
  await page.getByRole('button', { name: 'Nueva rutina' }).first().click()
  await page.getByLabel('Nombre de la rutina').fill('Empuje')
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByLabel('Buscar ejercicio para añadir').fill('press de banca con barra')
  await page.getByRole('button', { name: 'Añadir Press de banca con barra', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText('1 ejercicio')).toBeVisible()

  // Start it from Hoy.
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrenar algo hoy' }).click()
  await page.getByRole('button', { name: /^Empuje/ }).click()
  await expect(page).toHaveURL(/\/sesion\//)
  await expect(page.getByText('Primera vez con este ejercicio')).toBeVisible()

  await logSet(page, '60', '10', 'Bien')
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible()
  await logSet(page, '60', '9', 'Puedo más')
  await expect(doneRows(page)).toHaveCount(2)
  // The feel is on screen, so it is stored (the write takes a few ms).
  await expect(
    page.getByRole('button', { name: /^Serie 2: 60 kilos por 9 repeticiones, hecha, Puedo más/ }),
  ).toBeVisible()

  // Closing the app mid-session loses nothing.
  await page.reload()
  await expect(doneRows(page)).toHaveCount(2)
  await expect(
    page.getByRole('button', { name: /^Serie 2: 60 kilos por 9 repeticiones, hecha, Puedo más/ }),
  ).toBeVisible()
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible()
  await page.goto('/')
  await page.getByRole('link', { name: 'Continuar entreno' }).click()

  await logSet(page, '60', '8', 'Voy justo')
  await expect(doneRows(page)).toHaveCount(3)

  await page.getByRole('button', { name: 'Terminar' }).click()
  await page.getByRole('button', { name: 'Terminar entreno' }).click()
  await expect(page.getByText('Entreno terminado.')).toBeVisible()
  const series = page.locator('dl div', { hasText: 'Series' })
  await expect(series.locator('dd')).toHaveText('3')
  await expect(page.locator('dl div', { hasText: 'Volumen' }).locator('dd')).toHaveText('1620 kg')

  // Next time: the last session is shown and the rows come pre-filled with it.
  await page.getByRole('link', { name: 'Ir a Hoy' }).click()
  await page.getByRole('button', { name: 'Entrenar algo hoy' }).click()
  await page.getByRole('button', { name: /^Empuje/ }).click()
  await expect(page.getByText('Última vez (hoy): 60 kg × 10, 9, 8 · Voy justo')).toBeAttached()
  await expect(page.getByRole('textbox', { name: 'Peso en kilos' })).toHaveValue('60')
  await expect(page.getByRole('textbox', { name: 'Repeticiones' })).toHaveValue('10')
})

test('un doble toque marca una sola serie y una serie sin reps no se puede marcar', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrenar algo hoy' }).click()
  await page.getByRole('button', { name: /^Sesión libre/ }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByLabel('Buscar ejercicio para añadir').fill('press de banca con barra')
  await page.getByRole('button', { name: 'Añadir Press de banca con barra', exact: true }).click()

  // First time, no history: nothing to mark until there are reps.
  await expect(page.getByRole('button', { name: 'Indica las repeticiones' })).toBeDisabled()
  // Sets 2 and 1 both ready, so a second tap would have something to mark.
  for (const set of [2, 1]) {
    await page.getByRole('button', { name: new RegExp(`^Serie ${set}:`) }).click()
    await page.getByRole('textbox', { name: 'Repeticiones' }).fill('10')
    await page.getByRole('textbox', { name: 'Repeticiones' }).blur()
  }

  // Two taps 350 ms apart: the second lands on the same spot, now showing set 2.
  const done = await page.getByRole('button', { name: 'Serie hecha' }).boundingBox()
  await page.mouse.click(done!.x + done!.width / 2, done!.y + done!.height / 2)
  await page.waitForTimeout(350)
  await page.mouse.click(done!.x + done!.width / 2, done!.y + done!.height / 2)
  await expect(doneRows(page)).toHaveCount(1)
})

test('un récord aparece en el resumen de la sesión y en la ficha del ejercicio', async ({
  page,
}) => {
  const freeSession = async (weight: string) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Entrenar algo hoy' }).click()
    await page.getByRole('button', { name: /^Sesión libre/ }).click()
    await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
    await page.getByLabel('Buscar ejercicio para añadir').fill('press de banca con barra')
    await page.getByRole('button', { name: 'Añadir Press de banca con barra', exact: true }).click()
    await page.getByRole('button', { name: /^Serie 1:/ }).click()
    await logSet(page, weight, '10', 'Bien')
    await page.getByRole('button', { name: 'Terminar' }).click()
    await page.getByRole('button', { name: 'Terminar entreno' }).click()
    await expect(page.getByText('Entreno terminado.')).toBeVisible()
  }

  await freeSession('60')
  await expect(page.getByText(/récords? nuevos?/i)).toHaveCount(0)

  await freeSession('62,5')
  await expect(page.getByRole('heading', { name: '3 récords nuevos' })).toBeVisible()
  // The main record wears the armband with its figure; the others are listed underneath.
  await expect(page.getByText('antes 60 kg')).toBeVisible()
  await expect(page.getByText('Mejor 1RM estimado: 83,3 kg (antes 80 kg)')).toBeVisible()

  await page.goto('/ejercicio/0025?tab=historial')
  await expect(page.getByText('Más peso: 62,5 kg (antes 60 kg)')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Récord' })).toHaveCount(1)
  await expect(page.getByRole('list', { name: 'Sesiones' }).getByText('Bien')).toHaveCount(2)
})

test('la imagen del ejercicio abre cómo se hace sin salir de la sesión', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrenar algo hoy' }).click()
  await page.getByRole('button', { name: /^Sesión libre/ }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByLabel('Buscar ejercicio para añadir').fill('press de banca con barra')
  await page.getByRole('button', { name: 'Añadir Press de banca con barra', exact: true }).click()

  await page.getByRole('button', { name: 'Ver cómo se hace: Press de banca con barra' }).click()
  const sheet = page.getByRole('dialog', { name: 'Press de banca con barra' })
  await expect(sheet.getByRole('heading', { name: 'Pasos' })).toBeVisible()
  await expect(sheet.locator('img[src$=".gif"]')).toBeVisible()
  await expect(sheet.getByText('© Gym visual — gymvisual.com')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  // Still in the session, nothing changed.
  await expect(page.getByRole('button', { name: 'Indica las repeticiones' })).toBeVisible()
})
