// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { InputPassword } from '#/components/common/input-password/input-password'
import { m } from '#/paraglide/messages'

describe('InputPassword', () => {
  it('nasce escondida', () => {
    render(<InputPassword aria-label="Senha" />)

    expect(screen.getByLabelText('Senha').getAttribute('type')).toBe('password')
  })

  it('when the button is clicked, shows and hides, and changes its own name', async () => {
    render(<InputPassword aria-label="Senha" />)

    await userEvent.click(
      screen.getByRole('button', { name: m.kit_show_password() }),
    )

    expect(screen.getByLabelText('Senha').getAttribute('type')).toBe('text')

    await userEvent.click(
      screen.getByRole('button', { name: m.kit_hide_password() }),
    )

    expect(screen.getByLabelText('Senha').getAttribute('type')).toBe('password')
  })

  it('keeps the button out of the Tab order', () => {
    render(<InputPassword aria-label="Senha" />)

    expect(
      screen
        .getByRole('button', { name: m.kit_show_password() })
        .getAttribute('tabindex'),
    ).toBe('-1')
  })
})
