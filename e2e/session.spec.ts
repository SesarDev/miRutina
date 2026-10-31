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
