// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { pendingApps } from '#/lib/pending-apps'
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

    const slots = [...container.querySelectorAll('[data-slot]')].map(
      (element) => element.getAttribute('data-slot'),
    )
    const apps = slots.filter((slot) => slot === 'home-app')

    expect(apps).toHaveLength(projects.length + pendingApps.length)
    expect(slots.filter((slot) => slot !== 'home-app')).toEqual([
      'home-apps',
      'home-about',
      'home-contact',
    ])
  })

  it('shows the owner placeholder, never an invented sentence, for an app without data', () => {
    const { container } = render(<Home />)

    expect(container.textContent).toContain('[dado do dono]')
  })
})
