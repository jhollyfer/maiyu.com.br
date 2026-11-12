// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LocaleSwitcher } from '#/components/common/locale-switcher/locale-switcher'
import { m } from '#/paraglide/messages'
import type * as Runtime from '#/paraglide/runtime'
import { setLocale } from '#/paraglide/runtime'

vi.mock('#/paraglide/runtime', async (importOriginal) => ({
  ...(await importOriginal<typeof Runtime>()),
  setLocale: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('LocaleSwitcher', () => {
  it('when rendered, it offers the three languages by their own names', () => {
    render(<LocaleSwitcher />)

    const select = screen.getByRole('combobox', {
      name: m.kit_locale_switcher_label(),
    })
    expect(select).toBeTruthy()
    expect(
      screen.getByRole('option', { name: 'Português (Brasil)' }),
    ).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Español' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'English' })).toBeTruthy()
  })

  it('when another language is chosen, it switches the locale', () => {
    render(<LocaleSwitcher />)

    fireEvent.change(
      screen.getByRole('combobox', { name: m.kit_locale_switcher_label() }),
      { target: { value: 'es' } },
    )

    expect(setLocale).toHaveBeenCalledWith('es')
  })

  it('when compact, the select keeps its name and the visible text is the short code', () => {
    const { container } = render(<LocaleSwitcher compact />)

    expect(
      screen.getByRole('combobox', { name: m.kit_locale_switcher_label() }),
    ).toBeTruthy()
    expect(container.querySelector('span[aria-hidden]')?.textContent).toBe('PT')
  })

  it('when not compact, there is no short code beside the select', () => {
    const { container } = render(<LocaleSwitcher />)

    expect(container.textContent).not.toContain('PT')
  })
})
