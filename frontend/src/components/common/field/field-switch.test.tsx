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

import { FieldCheckbox } from './field-checkbox'
import { FieldSwitch } from './field-switch'

type Values = { notify: boolean; terms: boolean; name: string }

const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.terms) return { values, errors: {} }

  return {
    values: {},
    errors: { terms: { type: 'invalid', message: 'Aceite os termos' } },
  }
}

function Form({
  onValid,
}: {
  readonly onValid: (values: Values) => void
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { notify: false, terms: false, name: '' },
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
      <AppField name="notify" control={form.control}>
        <FieldSwitch label="Receber avisos" />
      </AppField>
      <AppField name="terms" control={form.control}>
        <FieldCheckbox label="Aceito os termos" required />
      </AppField>
      <button type="submit">Enviar</button>
    </form>
  )
}

afterEach(cleanup)

// The checkbox shares this file: same binding, only the control changes.
describe('FieldSwitch e FieldCheckbox', () => {
  it('o rótulo nomeia o controle focável e o clique grava o booleano', async () => {
    const onValid = vi.fn()
    render(<Form onValid={onValid} />)

    fireEvent.click(screen.getByRole('switch', { name: 'Receber avisos' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Aceito os termos/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalled()
    })
    expect(onValid.mock.calls[0]?.[0]).toMatchObject({
      notify: true,
      terms: true,
    })
  })

  it('o submit inválido foca o checkbox e liga o erro: o ref do Controller chega ao botão', async () => {
    const onValid = vi.fn()
    render(<Form onValid={onValid} />)
    const checkbox = screen.getByRole('checkbox', { name: /Aceito os termos/ })

    screen.getByLabelText('Nome').focus()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(document.activeElement).toBe(checkbox)
    })
    expect(checkbox.getAttribute('aria-invalid')).toBe('true')
    expect(checkbox.getAttribute('aria-describedby')).toBe('terms-error')
    expect(onValid).not.toHaveBeenCalled()
  })
})
