import { expect, test } from '@playwright/test'

test('exportar los datos y volver a importarlos sin duplicados', async ({ page }) => {
  await page.goto('/cuerpo')
  await page.getByRole('button', { name: 'Registrar peso o medidas' }).click()
  await page.getByLabel('Peso (kg)').fill('80,4')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await page.goto('/ajustes')
  await expect(page.getByText('Aún no has hecho ninguna copia.')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar datos' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^mirutina-\d{4}-\d{2}-\d{2}\.json$/)
  const path = await file.path()
  await expect(page.getByText(/^Última copia: /)).toBeVisible()

  // Importing the same copy: everything is already there.
  await page.locator('input[type="file"]').setInputFiles(path)
  await expect(page.getByText('Ya tienes todo lo que hay en esta copia.')).toBeVisible()
  await expect(page.getByText('Peso y medidas', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Entendido' }).click()

  // A file that is not a copy is explained, not imported.
  await page.locator('input[type="file"]').setInputFiles({
    name: 'otra.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hola": 1}'),
  })
  await expect(page.getByRole('alert')).toHaveText('El archivo no es una copia de miRutina.')

  await page.goto('/cuerpo')
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2)
})
