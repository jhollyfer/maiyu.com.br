// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CitySwitcher } from '#/components/common/city-switcher/city-switcher'
import { m } from '#/paraglide/messages'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate }),
  useLocation: () => '/tabatinga/agenda',
}))

afterEach(() => {
  vi.clearAllMocks()
})

const CITIES = [
  { slug: 'benjamin-constant', name: 'Benjamin Constant' },
  { slug: 'tabatinga', name: 'Tabatinga' },
]

describe('CitySwitcher', () => {
  it('shows the city of the URL as the current one', () => {
    render(<CitySwitcher cities={CITIES} />)

    const select = screen.getByRole('combobox', {
      name: m.kit_city_switcher_label(),
    })
    expect(select).toHaveProperty('value', 'tabatinga')
  })

  it('goes to the same page in the chosen city', () => {
    render(<CitySwitcher cities={CITIES} />)

    fireEvent.change(
      screen.getByRole('combobox', { name: m.kit_city_switcher_label() }),
      { target: { value: 'benjamin-constant' } },
    )

    expect(navigate).toHaveBeenCalledWith({
      href: '/benjamin-constant/agenda',
    })
  })
})
