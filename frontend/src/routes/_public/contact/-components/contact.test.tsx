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
 * Contact has no form (`docs/DECISIONS.md` #17): what the person sees is the
 * notice and the real channels, and no field that would lose the typed text.
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
