// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vitest'

import { AppField } from '#/integrations/react-hook-form/app-field'

import type { FieldSelectItem } from './field-select'
import { FieldSelect } from './field-select'

type Values = { status: string }

const items: ReadonlyArray<FieldSelectItem> = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
]

function Form({
  status,
  required,
}: {
  readonly status: string
  readonly required?: boolean
}): React.JSX.Element {
  const form = useForm<Values>({ defaultValues: { status } })
  return (
    <AppField name="status" control={form.control}>
      <FieldSelect
        slot="field-status"
        label="Situação"
        placeholder="Escolha"
        items={items}
        required={required}
      />
    </AppField>
  )
}

afterEach(cleanup)

describe('FieldSelect', () => {
  it('prints the item label in the trigger, not the raw value', () => {
    render(<Form status="INACTIVE" />)

    const trigger = document.getElementById('status')
    expect(trigger?.textContent).toContain('Inativo')
    expect(trigger?.textContent).not.toContain('INACTIVE')
  })

  it('marks the trigger and the label when required', () => {
    render(<Form status="" required />)

    expect(
      document.getElementById('status')?.getAttribute('aria-required'),
    ).toBe('true')
    expect(
      document.querySelector('[data-slot="field-required-mark"]'),
    ).not.toBeNull()
    expect(screen.getByText('Escolha')).toBeDefined()
  })

  it('leaves the mark and aria-required out when optional', () => {
    render(<Form status="" />)

    expect(
      document.getElementById('status')?.hasAttribute('aria-required'),
    ).toBe(false)
    expect(
      document.querySelector('[data-slot="field-required-mark"]'),
    ).toBeNull()
  })
})
