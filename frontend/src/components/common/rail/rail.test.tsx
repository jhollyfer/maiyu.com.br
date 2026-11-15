// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Rail } from '#/components/common/rail/rail'

describe('Rail', () => {
  it('is a named list with its items, so a screen reader reads a list and not a bare scroll area', () => {
    render(
      <Rail label="Marcos da história">
        <li>Um</li>
        <li>Dois</li>
        <li>Três</li>
      </Rail>,
    )

    const list = screen.getByRole('list', { name: 'Marcos da história' })

    expect(list.tagName).toBe('UL')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('takes the keyboard focus, so the scroll is reachable without a pointer (axe scrollable-region-focusable)', () => {
    render(
      <Rail label="Vantagens">
        <li>Um</li>
      </Rail>,
    )

    const list = screen.getByRole('list', { name: 'Vantagens' })

    expect(list.getAttribute('tabindex')).toBe('0')
    list.focus()
    expect(document.activeElement).toBe(list)
  })

  it('keeps the list role: no region wraps it, which would hide the items from the reader', () => {
    render(
      <Rail label="Vantagens">
        <li>Um</li>
      </Rail>,
    )

    expect(screen.queryByRole('region')).toBeNull()
    expect(screen.getByRole('list').getAttribute('role')).toBeNull()
  })

  it('an ordered rail is an ol, for steps in time', () => {
    render(
      <Rail label="Etapas" list="ordered">
        <li>Um</li>
      </Rail>,
    )

    expect(screen.getByRole('list', { name: 'Etapas' }).tagName).toBe('OL')
  })

  it('carries the rail utility and the theme focus ring, and the caller adds layout to it', () => {
    render(
      <Rail label="Etapas" className="md:grid md:grid-cols-5">
        <li>Um</li>
      </Rail>,
    )

    const list = screen.getByRole('list', { name: 'Etapas' })

    expect(list.className).toContain('rail')
    expect(list.className).toContain('focus-ring')
    expect(list.className).toContain('md:grid')
  })
})
