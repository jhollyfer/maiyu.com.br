// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { m } from '#/paraglide/messages'

import { DetailRowsSkeleton, DetailSkeleton } from './page-shell-skeleton'

describe('DetailSkeleton', () => {
  it('draws the requested number of field blocks, one column on the phone', () => {
    const { container } = render(<DetailSkeleton fields={5} />)
    const grid = container.querySelector('.grid')

    expect(grid?.children).toHaveLength(5)
    expect(grid?.className).toContain('md:grid-cols-2')
  })

  it('is busy and announces the wait in the locale', () => {
    const { container } = render(<DetailSkeleton />)

    expect(
      container
        .querySelector('[data-slot="detail-skeleton"]')
        ?.getAttribute('aria-busy'),
    ).toBe('true')
    expect(screen.getByRole('status').textContent).toBe(m.kit_loading())
  })
})

describe('DetailRowsSkeleton', () => {
  it('draws label/value rows that stack on the phone', () => {
    const { container } = render(<DetailRowsSkeleton fields={3} />)
    const list = container.querySelector('dl[data-slot="description-list"]')
    const rows = container.querySelectorAll('[data-slot="description-item"]')

    expect(list?.getAttribute('data-layout')).toBe('rows')
    expect(rows).toHaveLength(3)
    expect(rows[0]?.className).toContain(
      'sm:grid-cols-[var(--description-label-width)',
    )
  })
})
