// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { m } from '#/paraglide/messages'

import { HydratedFieldset } from './hydrated-fieldset'

const hydration = vi.hoisted(() => ({ hydrated: true }))

vi.mock('@tanstack/react-router', () => ({
  useHydrated: () => hydration.hydrated,
}))

beforeEach(() => {
  hydration.hydrated = true
})

function renderField() {
  render(
    <HydratedFieldset>
      <input aria-label={m.kit_save()} />
    </HydratedFieldset>,
  )

  return screen.getByRole('textbox', { name: m.kit_save() })
}

describe('HydratedFieldset', () => {
  it('locks the fields until the page hydrates', () => {
    hydration.hydrated = false

    // `:disabled` e não a propriedade: quem trava é o `<fieldset>`, e a propriedade do
    // `<input>` só reflete o atributo dele.
    expect(renderField().matches(':disabled')).toBe(true)
  })

  it('frees the fields once hydrated', () => {
    expect(renderField().matches(':disabled')).toBe(false)
  })
})
