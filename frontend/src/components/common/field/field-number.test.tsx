// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { Resolver, ResolverResult } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { AppField } from '#/integrations/react-hook-form/app-field'

import { FieldNumber } from './field-number'

type Values = { quantity: number | null; name: string }

const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.quantity !== null && values.quantity > 0)
    return { values, errors: {} }

  return {
    values: {},
    errors: { quantity: { type: 'invalid', message: 'Quantidade inválida' } },
  }
}

function Form({
  onValid,
}: {
  readonly onValid: (values: Values) => void
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { quantity: null, name: '' },
    resolver,
    shouldFocusError: true,
  })

  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit(onValid)(event)
      }}
    >
      <input aria-label="Nome" {...form.register('name')} />
      <AppField name="quantity" control={form.control}>
        <FieldNumber label="Quantidade" locale="pt-BR" />
      </AppField>
      <button type="submit">Enviar</button>
    </form>
  )
}

describe('FieldNumber', () => {
  it('guarda número, não texto', async () => {
    const onValid = vi.fn()
    render(<Form onValid={onValid} />)

    fireEvent.change(screen.getByLabelText('Quantidade'), {
      target: { value: '12' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalled()
    })
    expect(onValid.mock.calls[0]?.[0]).toMatchObject({ quantity: 12 })
  })

  it('o submit inválido foca o input e liga o erro: o ref do Controller chega ao input', async () => {
    const onValid = vi.fn()
    render(<Form onValid={onValid} />)
    const input = screen.getByLabelText('Quantidade')

    screen.getByLabelText('Nome').focus()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(document.activeElement).toBe(input)
    })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('quantity-error')
    expect(onValid).not.toHaveBeenCalled()
  })
})
