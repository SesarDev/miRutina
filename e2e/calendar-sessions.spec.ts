import { expect, test } from '@playwright/test'

test('desde el calendario: ver la sesión del día, corregir una serie y borrarla', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrenar algo hoy' }).click()
  await page.getByRole('button', { name: /^Sesión libre/ }).click()
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByLabel('Buscar ejercicio para añadir').fill('press de banca con barra')
  await page.getByRole('button', { name: 'Añadir Press de banca con barra', exact: true }).click()
  await page.getByRole('button', { name: /^Serie 1:/ }).click()
  await page.getByRole('textbox', { name: 'Peso en kilos' }).fill('60')
  await page.getByRole('textbox', { name: 'Repeticiones' }).fill('10')
  await page.getByRole('textbox', { name: 'Repeticiones' }).blur()
  await page.getByRole('button', { name: 'Serie hecha' }).click()
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page.getByRole('button', { name: 'Terminar entreno' }).click()
  await expect(page.locator('dl div', { hasText: 'Volumen' }).locator('dd')).toHaveText('600 kg')

  // The day sheet lists the session.
  await page.goto('/calendario?vista=semana')
  await page.locator('[data-today] button[aria-label$="Abrir el día"]').click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText('Sesión libre')).toBeVisible()
  await expect(sheet.getByText(/Hecha · 1 ejercicio · 1 serie · 600 kg/)).toBeVisible()

  // Correct the set: 62,5 instead of 60.
  await sheet.getByRole('link', { name: 'Corregir series' }).click()
  await expect(page.getByText(/^Editando · /)).toBeVisible()
  await page.getByRole('button', { name: /^Serie 1:/ }).click()
  await page.getByRole('textbox', { name: 'Peso en kilos' }).fill('62,5')
  await page.getByRole('textbox', { name: 'Peso en kilos' }).blur()
  await page.getByRole('button', { name: 'Hecho' }).click()
  await expect(page.locator('dl div', { hasText: 'Volumen' }).locator('dd')).toHaveText('625 kg')

  // Delete it from the calendar, with undo available.
  await page.goto('/calendario?vista=semana')
  await page.locator('[data-today] button[aria-label$="Abrir el día"]').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar' }).click()
  await expect(page.getByText('Sesión «Sesión libre» borrada')).toBeVisible()
  await expect(page.getByRole('dialog').getByText('Sesión libre')).toHaveCount(0)
})
