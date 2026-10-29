import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Button } from './Button'
import { Chip } from './Chip'
import { IconButton } from './IconButton'
import { Sheet } from './Sheet'
import { Stepper } from './Stepper'

function WeightStepper({
  initial = 60,
  onValue,
}: {
  initial?: number
  onValue?: (v: number) => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <Stepper
      label="Peso"
      value={value}
      onChange={(v) => {
        setValue(v)
        onValue?.(v)
      }}
      step={2.5}
      decimals={1}
      min={0}
      max={500}
      unit="kg"
    />
  )
}

describe('Stepper', () => {
  it('suma y resta el paso', async () => {
    const user = userEvent.setup()
    render(<WeightStepper />)
    await user.click(screen.getByRole('button', { name: 'Sumar 2,5 kg' }))
    expect(screen.getByRole('textbox', { name: 'Peso (kg)' })).toHaveValue('62,5')
    await user.click(screen.getByRole('button', { name: 'Restar 2,5 kg' }))
    await user.click(screen.getByRole('button', { name: 'Restar 2,5 kg' }))
    expect(screen.getByRole('textbox', { name: 'Peso (kg)' })).toHaveValue('57,5')
  })

  it('acepta coma decimal y redondea a un decimal', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    render(<WeightStepper onValue={onValue} />)
    const input = screen.getByRole('textbox', { name: 'Peso (kg)' })
    await user.clear(input)
    await user.type(input, '61,25{Enter}')
    expect(onValue).toHaveBeenLastCalledWith(61.3)
    expect(input).toHaveValue('61,3')
  })

  it('no baja del mínimo', async () => {
    render(<WeightStepper initial={0} />)
    expect(screen.getByRole('button', { name: 'Restar 2,5 kg' })).toBeDisabled()
  })
})

describe('Chip', () => {
  it('la valoración siempre lleva texto', () => {
    render(<Chip feel="puedo_mas" />)
    expect(screen.getByText('Puedo más')).toBeInTheDocument()
  })

  it('como botón expone su estado', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Chip feel="bien" selected onClick={onClick} />)
    const chip = screen.getByRole('button', { name: 'Bien' })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await user.click(chip)
    expect(onClick).toHaveBeenCalled()
  })
})

describe('Button e IconButton', () => {
  it('Button es type=button por defecto', () => {
    render(<Button variant="primary">Serie hecha</Button>)
    expect(screen.getByRole('button', { name: 'Serie hecha' })).toHaveAttribute('type', 'button')
  })

  it('IconButton tiene nombre accesible', () => {
    render(<IconButton icon="close" label="Cerrar" />)
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })
})

describe('Sheet', () => {
  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir</Button>
        <Sheet open={open} onClose={() => setOpen(false)} title="Valorar serie">
          contenido
        </Sheet>
      </>
    )
  }

  it('abre y cierra con el botón Cerrar', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('dialog', { name: 'Valorar serie' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
