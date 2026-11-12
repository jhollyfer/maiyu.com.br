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
 * A ordem das seções da home, que é o argumento da página e não um detalhe.
 *
 * Renderiza a home e lê a ordem em que as seções aparecem na tela (cada uma
 * traz o seu `data-slot`), em vez de ler o texto de `home.tsx`: um componente
 * que deixa de renderizar ou troca de lugar quebra aqui, e um import sem uso
 * não. E não congela a lista inteira: crava só as relações que a página
 * defende, para que uma seção nova não reprove por existir.
 */
function renderedSections(): Array<string> {
  const { container } = render(<Home />)

  return Array.from(container.querySelectorAll('section[data-slot]')).map(
    (section) => section.getAttribute('data-slot') ?? '',
  )
}

describe('Home', () => {
  it('when rendered, it shows every section', () => {
    // Guarda das guardas: se a leitura parar de achar seção, os testes de
    // ordem abaixo comparariam `-1` com `-1` e ficariam verdes.
    expect(renderedSections().length).toBeGreaterThanOrEqual(7)
  })

  it('when rendered, it opens with the hero and closes with the invitation', () => {
    const order = renderedSections()

    expect(order.at(0)).toBe('home-hero')
    expect(order.at(-1)).toBe('home-closing-cta')
  })

  it('when rendered, it shows the live work right after the hero', () => {
    // A prova antes da tese: quem chega quer ver que a Maiyu entrega, e só
    // depois se interessa pelo que ela pensa.
    expect(renderedSections().indexOf('home-work')).toBe(1)
  })

  it('when rendered, it says where Maiyu comes from right after the proof', () => {
    // O diferencial (indígena, da tríplice fronteira) vem antes da tese: é o
    // que separa a Maiyu de qualquer outra software house, e quem lê rápido
    // precisa encontrá-lo na segunda rolagem.
    expect(renderedSections().indexOf('home-roots')).toBe(2)
  })

  it('when rendered, it says who Maiyu builds for right after what it does', () => {
    const order = renderedSections()

    expect(order.indexOf('home-audience')).toBe(
      order.indexOf('home-capabilities') + 1,
    )
  })
})
