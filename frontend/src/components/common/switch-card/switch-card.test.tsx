// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import {
  SwitchCard,
  SwitchCardDescription,
  SwitchCardTitle,
} from './switch-card'

describe('SwitchCard', () => {
  it('the switch is named by the card and a click on the title toggles it', () => {
    const onCheckedChange = vi.fn()
    render(
      <SwitchCard checked={false} onCheckedChange={onCheckedChange}>
        <SwitchCardTitle>Avisos por e-mail</SwitchCardTitle>
        <SwitchCardDescription>Um resumo por semana.</SwitchCardDescription>
      </SwitchCard>,
    )

    const control = screen.getByRole('switch', { name: 'Avisos por e-mail' })

    expect(control.tagName).toBe('BUTTON')
    expect(control.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(screen.getByText('Avisos por e-mail'))

    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true)
  })

  it('without a description part there is no description element', () => {
    const { container } = render(
      <SwitchCard>
        <SwitchCardTitle>Modo escuro</SwitchCardTitle>
      </SwitchCard>,
    )

    expect(
      container.querySelector('[data-slot="switch-card-description"]'),
    ).toBeNull()
    expect(screen.getByRole('switch').hasAttribute('aria-describedby')).toBe(
      false,
    )
    expect(container.querySelector('[data-slot="switch-card"]')).not.toBeNull()
  })

  it('takes the given id and passes disabled to the switch', () => {
    render(
      <SwitchCard id="notify" disabled>
        <SwitchCardTitle>Avisos</SwitchCardTitle>
      </SwitchCard>,
    )

    const control = screen.getByRole('switch', { name: 'Avisos' })

    expect(control.id).toBe('notify')
    expect(control.hasAttribute('disabled')).toBe(true)
  })

  it('is named by the title and described by the description, by id', () => {
    render(
      <SwitchCard>
        <SwitchCardTitle>Avisos</SwitchCardTitle>
        <SwitchCardDescription>Um resumo por semana.</SwitchCardDescription>
      </SwitchCard>,
    )

    const control = screen.getByRole('switch', {
      name: 'Avisos',
      description: 'Um resumo por semana.',
    })

    expect(control.getAttribute('aria-describedby')).toBe(
      screen.getByText('Um resumo por semana.').id,
    )
  })

  it('on the server the description is not linked yet, and hydrating it adds the link with no warning', () => {
    const tree = (
      <SwitchCard id="s">
        <SwitchCardTitle>Avisos</SwitchCardTitle>
        <SwitchCardDescription>Resumo.</SwitchCardDescription>
      </SwitchCard>
    )
    const html = renderToString(tree)
    expect(html).not.toContain('aria-describedby')

    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const host = document.createElement('div')
    host.append(
      ...new DOMParser().parseFromString(html, 'text/html').body.childNodes,
    )
    document.body.append(host)
    hydrateRoot(host, tree)

    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('has no axe violation without a description either', async () => {
    const { container } = render(
      <SwitchCard>
        <SwitchCardTitle>Modo escuro</SwitchCardTitle>
      </SwitchCard>,
    )

    const { violations, incomplete } = await axe.run(container)

    expect(violations).toEqual([])
    expect(incomplete.filter((rule) => rule.id.startsWith('aria'))).toEqual([])
  })

  it('has no axe violation', async () => {
    const { container } = render(
      <SwitchCard defaultChecked>
        <SwitchCardTitle>Avisos por e-mail</SwitchCardTitle>
        <SwitchCardDescription>Um resumo por semana.</SwitchCardDescription>
      </SwitchCard>,
    )

    const { violations, incomplete } = await axe.run(container)

    expect(violations).toEqual([])
    expect(incomplete.filter((rule) => rule.id.startsWith('aria'))).toEqual([])
  })
})
