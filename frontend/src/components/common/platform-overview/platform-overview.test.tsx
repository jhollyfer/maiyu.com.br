// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PlatformOverview } from '#/components/common/platform-overview/platform-overview'

describe('PlatformOverview', () => {
  it('shows the count per city and the members per tenant with its city', () => {
    render(
      <PlatformOverview
        overview={{
          cities: [
            { id: 'c1', name: 'Tabatinga', slug: 'tabatinga', tenants: 2 },
          ],
          tenants: [
            {
              id: 't1',
              name: 'Escola Estadual',
              slug: 'escola',
              cityId: 'c1',
              parentId: null,
              members: 7,
            },
          ],
        }}
      />,
    )

    const city = screen
      .getAllByRole('row')
      .find((row) => row.textContent.includes('Escola Estadual'))
    expect(city?.textContent).toContain('Tabatinga')
    expect(city?.textContent).toContain('7')
  })
})
