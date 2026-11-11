// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { AppField } from './app-field'
import { useFieldContext } from './app-field-context'

function NameProbe(): React.JSX.Element {
  const { field } = useFieldContext<string>('NameProbe')
  return <output aria-label={field.name}>{field.value}</output>
}

function Form(): React.JSX.Element {
  const form = useForm({ defaultValues: { title: 'Clientes' } })
  return (
    <AppField name="title" control={form.control}>
      <NameProbe />
    </AppField>
  )
}

describe('AppField', () => {
  it('hands the field binding to the field component through context', () => {
    render(<Form />)
    expect(screen.getByLabelText('title').textContent).toBe('Clientes')
  })
})
