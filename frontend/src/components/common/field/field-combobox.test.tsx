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

import { FieldCombobox } from './field-combobox'

type Values = { status: string; name: string }

const OPTIONS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
]

const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.status) return { values, errors: {} }

  return {
    values: {},
    errors: { status: { type: 'required', message: 'Escolha a situação' } },
  }
}

function Form({
  onValid = vi.fn(),
  status = '',
  required,
}: {
  readonly onValid?: (values: Values) => void
  readonly status?: string
  readonly required?: boolean
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { status, name: '' },
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
      <AppField name="status" control={form.control}>
        <FieldCombobox label="Situação" options={OPTIONS} required={required} />
      </AppField>
      <button type="submit">Enviar</button>
    </form>
  )
}

afterEach(cleanup)

describe('FieldCombobox', () => {
  it('when an option is picked, the form submits its value, not its label', async () => {
    const onValid = vi.fn()
    render(<Form onValid={onValid} />)

    fireEvent.keyDown(screen.getByLabelText(/Situação/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: 'Publicado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalled()
    })
    expect(onValid.mock.calls[0]?.[0]).toMatchObject({ status: 'published' })
  })

  it('when the submit is invalid, it focuses the input and shows the error', async () => {
    render(<Form />)
    const input = screen.getByLabelText(/Situação/)

    screen.getByLabelText('Nome').focus()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(document.activeElement).toBe(input)
    })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Escolha a situação')).toBeTruthy()
  })

  it('when the field is optional, it offers the clear button', () => {
    const { container } = render(<Form status="draft" />)

    expect(
      container.querySelector('[data-slot="combobox-clear"]'),
    ).not.toBeNull()
  })

  it('when the field is required, it has no clear button and says it is required', () => {
    const { container } = render(<Form status="draft" required />)

    expect(container.querySelector('[data-slot="combobox-clear"]')).toBeNull()
    expect(
      screen.getByLabelText(/Situação/).getAttribute('aria-required'),
    ).toBe('true')
  })
})
