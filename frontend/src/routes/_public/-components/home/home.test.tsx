// @vitest-environment jsdom
import type * as Router from '@tanstack/react-router'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Home } from './home'

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  Link: ({
    to,
    children,
    ...props
  }: Readonly<{ to: string; children: React.ReactNode }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

afterEach(cleanup)

/**
 * The order of the home's sections, which is the page's argument and not a detail.
 *
 * It renders the home and reads the order in which the sections appear on screen (each
 * one carries its `data-slot`), instead of reading the text of `home.tsx`: a component
 * that stops rendering or changes place breaks here, and an unused import
 * does not. And it does not freeze the whole list: it pins only the relations that the page
 * defends, so that a new section does not fail for existing.
 */
function renderedSections(): Array<string | undefined> {
  const { container } = render(<Home />)

  return Array.from(
    container.querySelectorAll<HTMLElement>('section[data-slot]'),
    ({ dataset }) => dataset.slot,
  )
}

describe('Home', () => {
  it('when rendered, it shows every section', () => {
    // Guard of the guards: if the reading stops finding a section, the order tests
    // below would compare `-1` with `-1` and stay green.
    expect(renderedSections().length).toBeGreaterThanOrEqual(7)
  })

  it('when rendered, it opens with the hero and closes with the invitation', () => {
    const order = renderedSections()

    expect(order.at(0)).toBe('home-hero')
    expect(order.at(-1)).toBe('home-closing-cta')
  })

  it('when rendered, it shows the live work right after the hero', () => {
    // The proof before the thesis: whoever arrives wants to see that Maiyu delivers, and only
    // afterwards cares about what it thinks.
    expect(renderedSections().indexOf('home-work')).toBe(1)
  })

  it('when rendered, it says where Maiyu comes from right after the proof', () => {
    // The differentiator (Indigenous, from the triple border) comes before the thesis: it is
    // what sets Maiyu apart from any other software house, and whoever reads fast
    // needs to find it on the second scroll.
    expect(renderedSections().indexOf('home-roots')).toBe(2)
  })

  it('when rendered, it says who Maiyu builds for right after what it does', () => {
    const order = renderedSections()

    expect(order.indexOf('home-audience')).toBe(
      order.indexOf('home-capabilities') + 1,
    )
  })
})
