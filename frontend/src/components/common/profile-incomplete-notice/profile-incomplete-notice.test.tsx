// @vitest-environment jsdom

import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithRouter } from '#/lib/render-with-router'
import { m } from '#/paraglide/messages'

import { ProfileIncompleteNotice } from './profile-incomplete-notice'

function mount(element: React.JSX.Element): void {
  renderWithRouter(
    [
      { path: '/painel', component: () => element },
      { path: '/profile', component: () => <p>perfil</p> },
    ],
    '/painel',
  )
}

describe('ProfileIncompleteNotice', () => {
  it('sem pendência, não mostra nada', async () => {
    mount(
      <>
        <ProfileIncompleteNotice missing={[]} />
        <p>painel</p>
      </>,
    )

    await screen.findByText('painel')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('com pendência, avisa o que falta e leva ao perfil', async () => {
    mount(
      <ProfileIncompleteNotice
        missing={['pixKey', 'document']}
        labels={{ pixKey: 'a chave Pix', document: 'o documento' }}
      />,
    )

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain(m.kit_profile_incomplete_title())
    expect(alert.textContent).toContain('a chave Pix, o documento')
    expect(
      screen
        .getByRole('link', { name: m.kit_profile_incomplete_action() })
        .getAttribute('href'),
    ).toBe('/profile')
  })
})
