import { expect, test } from '@playwright/test'

test('cancelar un entreno empezado por error, deshacer y cambiar de rutina', async ({ page }) => {
  await page.goto('/rutinas')
  await page.getByRole('button', { name: 'Nueva rutina' }).first().click()
  await page.getByLabel('Nombre de la rutina').fill('Empuje')
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  await page.getByLabel('Buscar ejercicio para añadir').fill('press de banca con barra')
  await page.getByRole('button', { name: 'Añadir Press de banca con barra', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText('1 ejercicio')).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'Entrenar algo hoy' }).click()
  await page.getByRole('button', { name: /^Empuje/ }).click()
  await expect(page).toHaveURL(/\/sesion\//)
  const firstUrl = page.url()
  await page.getByRole('button', { name: /^Serie 1:/ }).click()
  await page.getByRole('textbox', { name: 'Peso en kilos' }).fill('60')
  await page.getByRole('textbox', { name: 'Repeticiones' }).fill('10')
  await page.getByRole('textbox', { name: 'Repeticiones' }).blur()
  await page.getByRole('button', { name: 'Serie hecha' }).click()

  // Cancel: the confirmation says what is lost.
  await page.getByRole('button', { name: 'Opciones del entreno' }).click()
  await page.getByRole('button', { name: 'Cancelar entreno' }).click()
  await expect(
    page.getByText('Se borrará la serie que has marcado.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sí, cancelar entreno' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Continuar entreno' })).toHaveCount(0)

  // Undo brings it back, with its marked set.
  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(page).toHaveURL(firstUrl)
  await expect(page.getByRole('button', { name: /^Serie 1: .*, hecha/ })).toBeVisible()

  // Change to another routine: a free session replaces it.
  await page.getByRole('button', { name: 'Opciones del entreno' }).click()
  await page.getByRole('button', { name: 'Cambiar de rutina' }).click()
  await page.getByRole('button', { name: /^Sesión libre/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sesión libre' })).toBeVisible()
  await expect(page).not.toHaveURL(firstUrl)
})
