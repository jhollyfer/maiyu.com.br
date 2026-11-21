// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ActivitySkeleton,
  ChartSkeleton,
  MetricCardSkeleton,
} from './card-skeleton'

describe('card skeletons', () => {
  it('draws a metric, a chart and an activity card, each with its slot', () => {
    const { container } = render(
      <>
        <MetricCardSkeleton />
        <ChartSkeleton />
        <ActivitySkeleton />
      </>,
    )

    expect(
      container.querySelector('[data-slot="metric-card-skeleton"]'),
    ).toBeTruthy()
    expect(container.querySelector('[data-slot="chart-skeleton"]')).toBeTruthy()
    expect(
      container.querySelector('[data-slot="activity-skeleton"]'),
    ).toBeTruthy()
  })

  it('draws the requested number of activity rows', () => {
    const { container } = render(<ActivitySkeleton rows={3} />)

    expect(container.querySelectorAll('.rounded-full')).toHaveLength(3)
  })
})
