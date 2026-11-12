// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
})
