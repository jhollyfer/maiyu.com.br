// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { AppField } from '#/integrations/react-hook-form/app-field'

import { FieldPassword } from './field-password'

type Values = { current: string; next: string }

function Form(): React.JSX.Element {
  const form = useForm<Values>({ defaultValues: { current: '', next: '' } })
  return (
    <>
      <AppField name="current" control={form.control}>
        <FieldPassword label="Senha atual" autoComplete="current-password" />
      </AppField>
      <AppField name="next" control={form.control}>
        <FieldPassword label="Nova senha" autoComplete="new-password" />
      </AppField>
    </>
  )
}

describe('FieldPassword', () => {
  it('tells the password manager which password each field holds', () => {
    render(<Form />)

    expect(
      screen.getByLabelText(/Senha atual/).getAttribute('autocomplete'),
    ).toBe('current-password')
    expect(
      screen.getByLabelText(/Nova senha/).getAttribute('autocomplete'),
    ).toBe('new-password')
  })
})
