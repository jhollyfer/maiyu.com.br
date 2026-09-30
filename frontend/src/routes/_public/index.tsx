import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/head'
import { m } from '#/paraglide/messages'

/**
 * A home. Sem `loader`: nenhuma seção lê API, e o conteúdo mora em `lib/`.
 *
 * O título é só o nome do site, e não "Início · Maiyu": é a página que o
 * buscador mostra para quem procura a empresa pelo nome.
 */
export const Route = createFileRoute('/_public/')({
  head: () =>
    pageHead({ path: '/', title: null, description: m.meta_description() }),
})
