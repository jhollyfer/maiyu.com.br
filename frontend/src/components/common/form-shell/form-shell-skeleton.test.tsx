// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { m } from '#/paraglide/messages'

import { FormShellSkeleton } from './form-shell-skeleton'

describe('FormShellSkeleton', () => {
  it('draws the requested number of fields and marks itself busy', () => {
    const { container } = render(<FormShellSkeleton fields={3} />)

    expect(
      container.querySelectorAll('[data-slot="form-shell-skeleton-field"]'),
    ).toHaveLength(3)
    expect(
      container
        .querySelector('[data-slot="form-shell-skeleton"]')
        ?.getAttribute('aria-busy'),
    ).toBe('true')
  })

  it('announces the wait in the locale and hides the drawing from the reader', () => {
    const { container } = render(<FormShellSkeleton />)

    expect(screen.getByRole('status').textContent).toBe(m.kit_loading())
    expect(
      container
        .querySelector('[data-slot="form-shell-skeleton-field"]')
        ?.closest('[aria-hidden="true"]'),
    ).toBeTruthy()
  })
})
