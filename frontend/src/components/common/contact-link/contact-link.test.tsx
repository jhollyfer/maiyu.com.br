// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buttonVariants } from '#/components/ui/button'

import { ContactLink } from './contact-link'

describe('ContactLink', () => {
  it('e-mail: link mailto com o endereço como texto', () => {
    render(<ContactLink kind="email" value="oi@loja.com" />)

    const link = screen.getByRole('link', { name: 'oi@loja.com' })
    expect(link.getAttribute('href')).toBe('mailto:oi@loja.com')
  })

  it('telefone: tel sem máscara e o texto formatado como veio', () => {
    render(<ContactLink kind="phone" value="+55 (97) 99999-9999" />)

    const link = screen.getByRole('link', { name: '+55 (97) 99999-9999' })
    expect(link.getAttribute('href')).toBe('tel:+5597999999999')
  })

  it('children trocam o texto, o ícone é decorativo e variant/size seguem o buttonVariants', () => {
    const { container } = render(
      <ContactLink kind="phone" value="97999999999" variant="outline" size="sm">
        Ligar
      </ContactLink>,
    )

    const link = screen.getByRole('link', { name: 'Ligar' })
    expect(link.className).toBe(
      buttonVariants({ variant: 'outline', size: 'sm' }),
    )
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    )
  })
})
