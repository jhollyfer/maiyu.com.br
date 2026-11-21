// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BrandMark,
  BrandMarkName,
  BrandMarkSymbol,
} from '#/components/common/brand-mark/brand-mark'
import { m } from '#/paraglide/messages'

// `lib/brand.ts` is the project's file: the test fixes its own mark so it passes in any project,
// with or without `BRAND.logo`, and the logo case sets it here.
const brand = vi.hoisted((): { logo: string | undefined } => ({
  logo: undefined,
}))

vi.mock('#/lib/brand', async () => {
  const { SealCheckIcon } = await import('@phosphor-icons/react')
  return { BRAND: Object.assign(brand, { icon: SealCheckIcon }) }
})

afterEach(() => {
  cleanup()
  brand.logo = undefined
})

describe('BrandMark', () => {
  it('without children draws the symbol and the name in the current language', () => {
    const { container } = render(<BrandMark />)

    expect(screen.getByText(m.brand_name())).toBeTruthy()
    expect(
      container.querySelector('[data-slot="brand-mark-symbol"] svg'),
    ).not.toBeNull()
  })

  it('the symbol is a bg-primary disc and the colors are theme tokens', () => {
    const { container } = render(<BrandMark />)
    const symbol = container.querySelector('[data-slot="brand-mark-symbol"]')

    expect(symbol?.className).toContain('bg-primary')
    expect(symbol?.querySelector('svg')?.getAttribute('class')).toContain(
      'text-primary-foreground',
    )
    expect(
      container.querySelector('[data-slot="brand-mark-name"]')?.className,
    ).toContain('text-foreground')
  })

  it('with the project logo, the logo replaces the disc and the symbol', () => {
    brand.logo = '/logo.svg'
    const { container } = render(<BrandMark />)
    const symbol = container.querySelector('[data-slot="brand-mark-symbol"]')

    expect(symbol?.querySelector('img')).not.toBeNull()
    expect(symbol?.querySelector('svg')).toBeNull()
    expect(symbol?.className).not.toContain('bg-primary')
    expect(screen.getByText(m.brand_name())).toBeTruthy()
  })

  it('the symbol beside the name is decorative', () => {
    const { container } = render(<BrandMark />)

    expect(
      container
        .querySelector('[data-slot="brand-mark-symbol"]')
        ?.getAttribute('aria-hidden'),
    ).toBe('true')
  })

  it('the symbol alone, with a label, is an image with that name', () => {
    render(
      <BrandMark>
        <BrandMarkSymbol label="Projeto" />
      </BrandMark>,
    )

    expect(screen.getByRole('img', { name: 'Projeto' })).toBeTruthy()
    expect(screen.queryByText(m.brand_name())).toBeNull()
  })

  it('the name part alone composes with the root', () => {
    render(
      <BrandMark>
        <BrandMarkName />
      </BrandMark>,
    )

    expect(screen.getByText(m.brand_name())).toBeTruthy()
  })

  it('the size is a variant: md by default, sm and lg on request', () => {
    const { container, rerender } = render(<BrandMark />)
    const root = () => container.querySelector('[data-slot="brand-mark"]')

    expect(root()?.getAttribute('data-size')).toBe('md')
    rerender(<BrandMark size="sm" />)
    expect(root()?.getAttribute('data-size')).toBe('sm')
    rerender(<BrandMark size="lg" />)
    expect(root()?.getAttribute('data-size')).toBe('lg')
  })

  it('accepts class and attributes of the span', () => {
    const { container } = render(<BrandMark className="extra" id="marca" />)
    const root = container.querySelector('[data-slot="brand-mark"]')

    expect(root?.id).toBe('marca')
    expect(root?.className).toContain('extra')
  })

  it('has no accessibility violation, with the name and with the symbol alone', async () => {
    const { container, rerender } = render(<BrandMark />)

    expect((await axe.run(container)).violations).toEqual([])

    rerender(
      <BrandMark>
        <BrandMarkSymbol label="Projeto" />
      </BrandMark>,
    )

    expect((await axe.run(container)).violations).toEqual([])
  })
})
