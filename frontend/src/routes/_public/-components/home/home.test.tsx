// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { projects } from '#/lib/projects'

import { Home } from './home'

afterEach(cleanup)

/**
 * The home opens with the list of apps, then who we are, then contact: that order is the
 * page's argument (`docs/DESIGN.md` §1), not a detail.
 */
describe('Home', () => {
  it('lists every app of the house, then about, then contact', () => {
    const { container } = render(<Home />)

    const slots = [...container.querySelectorAll('[data-slot^="home-"]')].map(
      (element) => element.getAttribute('data-slot'),
    )
    const apps = slots.filter((slot) => slot === 'home-app')

    expect(apps).toHaveLength(projects.length)
    expect(slots.filter((slot) => slot !== 'home-app')).toEqual([
      'home-apps',
      'home-about',
      'home-contact',
    ])
  })

  it('does not show an app whose data has not arrived, nor a placeholder', () => {
    const { container } = render(<Home />)

    expect(container.textContent).not.toContain('[dado do dono]')
    for (const name of [
      'Toru',
      'Delivery',
      'Mangangá',
      'Simple Hub',
      'LowCodeJS',
    ])
      expect(container.textContent).not.toContain(name)
  })
})
