// @vitest-environment jsdom
import type * as Router from '@tanstack/react-router'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Career } from './career'

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
 * Careers has no application form (`docs/DECISIONS.md` #17): the
 * person sees the notice and the real channels, and no field.
 */
describe('Career', () => {
  it('when rendered, it shows the notice and no form', () => {
    const { container } = render(<Career />)

    expect(
      container.querySelector('[data-slot="channels-notice"]'),
    ).not.toBeNull()
    expect(container.querySelector('form, input, textarea, select')).toBeNull()
  })
})
