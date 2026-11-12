// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { Resolver, ResolverResult } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { AppField } from '#/integrations/react-hook-form/app-field'

import { FieldDate } from './field-date'

type Values = { startsAt: string; name: string }

const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.startsAt) return { values, errors: {} }

  return {
    values: {},
    errors: { startsAt: { type: 'required', message: 'Informe a data' } },
  }
}

function Form({
  onValid = vi.fn(),
  startsAt = '',
}: {
  readonly onValid?: (values: Values) => void
  readonly startsAt?: string
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { startsAt, name: '' },
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
      <AppField name="startsAt" control={form.control}>
        <FieldDate label="Início" />
      </AppField>
      <button type="submit">Enviar</button>
    </form>
  )
}

describe('FieldDate', () => {
  it('when the submit is invalid, it focuses the calendar trigger and shows the error', async () => {
    render(<Form />)
    const trigger = screen.getByLabelText('Início')

    screen.getByLabelText('Nome').focus()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
    expect(trigger.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Informe a data')).toBeTruthy()
  })

  it('when the form holds a wire date, the trigger shows it in the locale', () => {
    render(<Form startsAt="2026-07-31" />)

    expect(screen.getByLabelText('Início').textContent).toContain('31/07/2026')
  })

  it('when a day is picked, the form submits it as YYYY-MM-DD', async () => {
    const onValid = vi.fn()
    render(<Form onValid={onValid} startsAt="2026-07-31" />)

    fireEvent.click(screen.getByLabelText('Início'))
    fireEvent.click(await screen.findByText('15', { selector: 'button' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalled()
    })
    expect(onValid.mock.calls[0]?.[0]).toMatchObject({ startsAt: '2026-07-15' })
  })
})
