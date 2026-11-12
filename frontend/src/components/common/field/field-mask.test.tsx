// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { Resolver, ResolverResult } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppField } from '#/integrations/react-hook-form/app-field'

import { FieldMask } from './field-mask'

type Values = { document: string; name: string }

/** CPF com 11 dígitos crus; o resto é o erro de campo que o validator daria. */
const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.document.length === 11) return { values, errors: {} }

  return {
    values: {},
    errors: { document: { type: 'invalid', message: 'CPF inválido' } },
  }
}

function Form({
  onValid,
}: {
  readonly onValid: (values: Values) => void
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { document: '', name: '' },
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
      <AppField name="document" control={form.control}>
        <FieldMask label="CPF" mask="cpf" placeholder="000.000.000-00" />
      </AppField>
      <button type="submit">Enviar</button>
    </form>
  )
}

afterEach(cleanup)

describe('FieldMask', () => {
  it('o submit inválido foca o campo mascarado: o ref do Controller chega ao input', async () => {
    const onValid = vi.fn()
    render(<Form onValid={onValid} />)
    const input = screen.getByLabelText('CPF')

    fireEvent.input(input, { target: { value: '123' } })
    // O foco vai para longe do campo mascarado depois de digitar (o Inputmask
    // posiciona o cursor e focaria o campo sozinho), para o teste provar que quem
    // focou foi o `handleSubmit`, pelo `ref` que o `Controller` recebeu.
    screen.getByLabelText('Nome').focus()
    expect(document.activeElement).not.toBe(input)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(document.activeElement).toBe(input)
    })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(onValid).not.toHaveBeenCalled()
  })

  it('guarda o valor cru, sem a pontuação da máscara', async () => {
    const onValid = vi.fn()
    render(<Form onValid={onValid} />)
    const input = screen.getByLabelText('CPF')

    fireEvent.input(input, { target: { value: '12345678909' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalled()
    })
    expect(onValid.mock.calls[0]?.[0]).toMatchObject({
      document: '12345678909',
    })
  })

  it('pede o teclado do alias', () => {
    render(<Form onValid={vi.fn()} />)

    expect(screen.getByLabelText('CPF').getAttribute('inputmode')).toBe(
      'numeric',
    )
  })
})
