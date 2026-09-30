import { createFileRoute } from '@tanstack/react-router'

import { NotFoundPage } from '#/components/common/not-found-page'
import { SITE_TITLE } from '#/lib/site'
import { m } from '#/paraglide/messages'

/**
 * O endereço público que não existe.
 *
 * O `defaultNotFoundComponent` do `router.tsx` desenha a mesma tela, e desenha
 * **fora** de qualquer casca: um endereço que não casa com rota nenhuma nunca
 * chega ao `_public`, e quem erra o endereço ficaria sem menu e sem rodapé.
 * Esta rota-curinga traz a tela para dentro da casca.
 *
 * **Sem arquivo `.lazy`, e é decisão**, como no academy: dividi-la custaria
 * uma ida ao servidor para carregar seis linhas.
 *
 * `noindex` porque o endereço não existe: sem ele o buscador guardaria a URL
 * errada com uma resposta de sucesso.
 */
export const Route = createFileRoute('/_public/$')({
  head: () => ({
    meta: [
      { title: `${m.notFound_title()} · ${SITE_TITLE}` },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: () => <NotFoundPage className="min-h-[80dvh]" />,
})
