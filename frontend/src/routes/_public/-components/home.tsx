import type * as React from 'react'

import { Audience } from './audience'
import { Capabilities } from './capabilities'
import { ClosingCta } from './closing-cta'
import { Hero } from './hero'
import { NavyBand } from './navy-band'
import { Process } from './process'
import { Roots } from './roots'
import { Vision } from './vision'
import { Work } from './work'

/**
 * A home, montada.
 *
 * Só composição, como no academy: a ordem aqui é a ordem na tela. Primeiro o
 * que a Maiyu é (hero) e a prova de que entrega (projetos no ar); logo depois
 * de onde ela vem (indígena, da tríplice fronteira), que é o diferencial; então
 * a tese (a visão), o método (como trabalhamos), o que ela faz (serviços) e
 * para quem (os públicos); por fim quem faz (o time e o diário, na faixa navy)
 * e o convite.
 *
 * Nenhuma seção lê API: o conteúdo mora em `lib/`, e por isso não há
 * `useQuery` nem guarda de dado ausente aqui.
 */
export function Home(): React.JSX.Element {
  return (
    <>
      <Hero />
      <Work />
      <Roots />
      <Vision />
      <Process />
      <Capabilities />
      <Audience />
      <NavyBand />
      <ClosingCta />
    </>
  )
}
