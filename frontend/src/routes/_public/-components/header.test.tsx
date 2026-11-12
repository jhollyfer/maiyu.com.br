// @vitest-environment jsdom
import type * as Router from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '#/components/common/theme/theme-provider'
import { SITE_TITLE } from '#/lib/site'
import { m } from '#/paraglide/messages'

import { Header } from './header'

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  // The theme provider injects its script through it, which needs a router.
  ScriptOnce: () => null,
  Link: ({
    to,
    children,
    ...props
  }: Readonly<{ to: string; children: React.ReactNode }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

// jsdom has no `matchMedia`, which the `system` theme reads to resolve light or dark.
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  cleanup()
})

describe('Header', () => {
  it('when the phone menu opens, the panel has a title and a description', () => {
    // O leitor de tela anuncia os dois ao abrir o Sheet; sem eles o painel
    // abre mudo.
    render(
      <ThemeProvider theme="system">
        <Header />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: m.a11y_open_menu() }))

    const panel = screen.getByRole('dialog')

    expect(panel.getAttribute('aria-labelledby')).not.toBeNull()
    expect(panel.getAttribute('aria-describedby')).not.toBeNull()
    expect(screen.getByRole('dialog', { name: SITE_TITLE })).toBeTruthy()
    expect(screen.getByText(m.a11y_main_nav(), { selector: 'p' })).toBeTruthy()
  })
})
