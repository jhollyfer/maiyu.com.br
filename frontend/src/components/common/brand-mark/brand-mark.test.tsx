// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { BrandMark } from '#/components/common/brand-mark/brand-mark'
import { m } from '#/paraglide/messages'

afterEach(cleanup)

describe('BrandMark', () => {
  it('shows the brand name in the current language', () => {
    render(<BrandMark />)

    expect(screen.getByText(m.brand_name())).toBeTruthy()
  })

  it('when the logo is decorative, the name beside it already describes it', () => {
    const { container } = render(<BrandMark />)

    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })

  it('accepts class and attributes of the span', () => {
    const { container } = render(<BrandMark className="extra" id="marca" />)
    const root = container.querySelector('[data-slot="brand-mark"]')

    expect(root?.id).toBe('marca')
    expect(root?.className).toContain('extra')
  })
})
