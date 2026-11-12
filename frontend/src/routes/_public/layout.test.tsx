// @vitest-environment jsdom
import type * as Router from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { m } from '#/paraglide/messages'

import { Route } from './layout'

// O layout compõe cabeçalho, rodapé e a saída do router; só a casca interessa
// aqui, então as três peças viram marcadores.
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  Outlet: () => <p>pagina</p>,
}))
vi.mock('./-components/header', () => ({ Header: () => <header /> }))
vi.mock('./-components/footer', () => ({ Footer: () => <footer /> }))

afterEach(cleanup)

describe('the public layout', () => {
  it('when rendered, the skip link points at a focusable main and shows on focus', () => {
    const Layout = Route.options.component
    if (!Layout) throw new Error('the layout has no component')

    render(<Layout />)

    const skip = screen.getByRole('link', { name: m.a11y_skip_to_content() })
    const main = screen.getByRole('main')

    expect(skip.getAttribute('href')).toBe('#'.concat(main.id))
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(skip.classList.contains('focus:not-sr-only')).toBe(true)
  })
})
