import type * as React from 'react'

import { Capabilities } from './capabilities'
import { ClosingCta } from './closing-cta'
import { Hero } from './hero'
import { NavyBand } from './navy-band'
import { Process } from './process'
import { Vision } from './vision'
import { Work } from './work'

/**
 * A home, montada.
 *
 * Só composição, como no academy: a ordem aqui é a ordem na tela. Primeiro o
 * que a Maiyu é (hero) e a prova de que entrega (projetos no ar); depois a
 * tese (a visão), o método (como trabalhamos) e o que ela faz (serviços); por
 * fim quem faz (o time e o diário, na faixa navy) e o convite.
 *
 * Nenhuma seção lê API: o conteúdo mora em `lib/`, e por isso não há
 * `useQuery` nem guarda de dado ausente aqui.
 */
export function Home(): React.JSX.Element {
  return (
    <>
      <Hero />
      <Work />
      <Vision />
      <Process />
      <Capabilities />
      <NavyBand />
      <ClosingCta />
    </>
  )
}
