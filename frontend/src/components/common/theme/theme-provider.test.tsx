// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from '#/components/common/theme/theme-context'
import { ThemeProvider } from '#/components/common/theme/theme-provider'
import { THEME_COOKIE } from '#/lib/theme'

vi.mock('@tanstack/react-router', () => ({
  ScriptOnce: () => null,
}))

afterEach(() => {
  document.documentElement.className = ''
  document.cookie = `${THEME_COOKIE}=; max-age=0; path=/`
})

function Probe() {
  const { theme, setTheme } = useTheme('Probe')

  return (
    <>
      <output>{theme}</output>
      <button type="button" onClick={() => setTheme('dark')}>
        escuro
      </button>
    </>
  )
}

describe('ThemeProvider', () => {
  it('starts with the theme the loader read from the cookie', () => {
    render(
      <ThemeProvider theme="light">
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByRole('status').textContent).toBe('light')
  })

  it('when setTheme is called, saves the cookie, swaps the html class and updates the state', async () => {
    render(
      <ThemeProvider theme="light">
        <Probe />
      </ThemeProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'escuro' }))

    expect(screen.getByRole('status').textContent).toBe('dark')
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('when outside the provider, the error says which consumer is without it', () => {
    expect(() => render(<Probe />)).toThrow('Probe')
  })
})
