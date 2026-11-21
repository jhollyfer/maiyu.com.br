// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'

import { MetricCardSkeleton } from '#/components/common/card-skeleton/card-skeleton'
import { m } from '#/paraglide/messages'

import {
  StatCard,
  StatCardContent,
  StatCardDelta,
  StatCardLabel,
  StatCardValue,
} from './stat-card'

describe('StatCard', () => {
  it('draws the label and the number, and nothing else without a delta part', () => {
    const { container } = render(
      <StatCard>
        <StatCardLabel>Pedidos</StatCardLabel>
        <StatCardContent>
          <StatCardValue>1.280</StatCardValue>
        </StatCardContent>
      </StatCard>,
    )

    expect(container.querySelector('[data-slot="stat-card"]')).not.toBeNull()
    expect(screen.getByText('Pedidos')).not.toBeNull()
    expect(screen.getByText('1.280')).not.toBeNull()
    expect(container.querySelector('[data-slot="stat-card-delta"]')).toBeNull()
  })

  it('has the same two-block shape as the skeleton that stands for it while loading', () => {
    const { container: card } = render(
      <StatCard>
        <StatCardLabel>Pedidos</StatCardLabel>
        <StatCardContent>
          <StatCardValue>1</StatCardValue>
        </StatCardContent>
      </StatCard>,
    )
    const { container: skeleton } = render(<MetricCardSkeleton />)

    const blocks = (root: HTMLElement): number =>
      root.firstElementChild?.children.length ?? 0

    expect(blocks(card)).toBe(2)
    expect(blocks(skeleton)).toBe(2)
  })

  it('has a Card with no icon box or accent', () => {
    const { container } = render(
      <StatCard>
        <StatCardLabel>Pedidos</StatCardLabel>
      </StatCard>,
    )

    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('StatCardDelta', () => {
  it('a rise is signed text, an arrow and the word, and is good by default', () => {
    const { container } = render(<StatCardDelta value={12.5} />)
    const delta = container.querySelector('[data-slot="stat-card-delta"]')

    expect(delta?.getAttribute('data-direction')).toBe('up')
    expect(delta?.textContent).toContain(m.kit_stat_card_up())
    expect(delta?.textContent).toMatch(/\+12[.,]5\s?%/)
    expect(delta?.className).toContain('text-success-foreground')
  })

  it('a fall is bad by default and good when a lower number is the good news', () => {
    const { container: bad } = render(<StatCardDelta value={-3} />)
    const { container: good } = render(
      <StatCardDelta value={-3} goodWhen="down" />,
    )

    expect(
      bad.querySelector('[data-slot="stat-card-delta"]')?.className,
    ).toContain('text-destructive')
    expect(
      good.querySelector('[data-slot="stat-card-delta"]')?.className,
    ).toContain('text-success-foreground')
    expect(bad.textContent).toContain(m.kit_stat_card_down())
  })

  it('zero is "no change", neutral and with no sign', () => {
    const { container } = render(<StatCardDelta value={0} />)
    const delta = container.querySelector('[data-slot="stat-card-delta"]')

    expect(delta?.getAttribute('data-direction')).toBe('flat')
    expect(delta?.textContent).toContain(m.kit_stat_card_flat())
    expect(delta?.textContent).not.toMatch(/[+-]/)
    expect(delta?.className).toContain('text-muted-foreground')
  })

  it('has no axe violation inside a card', async () => {
    const { container } = render(
      <StatCard>
        <StatCardLabel>Pedidos</StatCardLabel>
        <StatCardContent>
          <StatCardValue>1.280</StatCardValue>
          <StatCardDelta value={-4} goodWhen="down" />
        </StatCardContent>
      </StatCard>,
    )

    expect((await axe.run(container)).violations).toEqual([])
  })
})
