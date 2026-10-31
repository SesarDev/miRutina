import { expect, test } from '@playwright/test'

test('registrar peso y medidas, editar el registro del día y borrar con deshacer', async ({
  page,
}) => {
  await page.goto('/cuerpo')
  await page.getByRole('button', { name: 'Registrar peso o medidas' }).click()
  await page.getByLabel('Peso (kg)').fill('80,4')
  await page.getByLabel('Cintura (cm)').fill('86')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page.getByRole('img', { name: /^Peso corporal: 1 registro/ })).toBeVisible()
  const table = page.getByRole('table')
  await expect(table.getByRole('cell', { name: '80,4' })).toBeVisible()
  await expect(table.getByRole('cell', { name: '86' })).toBeVisible()

  // «Registrar» again the same day edits today's record instead of adding another one.
  await page.getByRole('button', { name: 'Registrar', exact: true }).click()
  await expect(page.getByLabel('Peso (kg)')).toHaveValue('80,4')
  await page.getByLabel('Peso (kg)').fill('80')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table.getByRole('cell', { name: '80', exact: true })).toBeVisible()

  // Invalid values are explained, not saved.
  await page.getByRole('button', { name: /^Editar el registro del/ }).click()
  await page.getByLabel('Brazo (cm)').fill('500')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Entre 10 y 100 cm')).toBeVisible()

  await page.getByRole('button', { name: 'Borrar registro' }).click()
  await expect(page.getByText('Sin registros de peso ni medidas')).toBeVisible()
  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(table.getByRole('cell', { name: '80', exact: true })).toBeVisible()
})
