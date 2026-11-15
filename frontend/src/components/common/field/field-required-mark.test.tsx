// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { m } from '#/paraglide/messages'

import { FieldRequiredMark } from './field-required-mark'

describe('FieldRequiredMark', () => {
  it('hides the asterisk from the screen reader and says the word instead', () => {
    render(
      <label htmlFor="name">
        Nome
        <FieldRequiredMark />
      </label>,
    )

    const mark = document.querySelector('[data-slot="field-required-mark"]')
    expect(mark?.querySelector('[aria-hidden="true"]')?.textContent).toBe('*')
    expect(
      screen.getByText(m.kit_field_required(), { exact: false }).className,
    ).toContain('sr-only')
  })

  it('keeps the caller class next to the destructive token', () => {
    render(<FieldRequiredMark className="ml-1" />)

    const mark = document.querySelector('[data-slot="field-required-mark"]')
    expect(mark?.className).toContain('text-destructive')
    expect(mark?.className).toContain('ml-1')
  })
})
