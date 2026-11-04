import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/head'
import { m } from '#/paraglide/messages'

/**
 * A home. Sem `loader`: nenhuma seção lê API, e o conteúdo mora em `lib/`.
 *
 * O título leva o que a empresa faz e onde, e não "Início": quem busca
 * "software sob demanda" ou "Benjamin Constant" cai aqui, e a marca já vem
 * no fim do título.
 */
export const Route = createFileRoute('/_public/')({
  head: () =>
    pageHead({
      path: '/',
      title: m.meta_homeTitle(),
      description: m.meta_description(),
    }),
})
