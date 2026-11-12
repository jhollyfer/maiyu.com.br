// @vitest-environment jsdom
import type * as Router from '@tanstack/react-router'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Contact } from './contact'

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
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

afterEach(cleanup)

/**
 * Contato não tem formulário (`docs/DECISIONS.md` #17): o que a pessoa vê é o
 * aviso e os canais reais, e nenhum campo que perderia o texto digitado.
 */
describe('Contact', () => {
  it('when rendered, it shows the notice and no form', () => {
    const { container } = render(<Contact />)

    expect(
      container.querySelector('[data-slot="channels-notice"]'),
    ).not.toBeNull()
    expect(container.querySelector('form, input, textarea, select')).toBeNull()
  })
})
