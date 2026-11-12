import { createFileRoute, notFound } from '@tanstack/react-router'

import { NotFoundPage } from '#/components/common/route-status/not-found-page'
import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/** A tela do endereço que não existe, dentro da casca pública. */
function NotFound(): React.JSX.Element {
  return <NotFoundPage className="min-h-[80dvh]" />
}

/**
 * O endereço público que não existe.
 *
 * O `defaultNotFoundComponent` do `router.tsx` desenha a mesma tela, e desenha
 * **fora** de qualquer casca: um endereço que não casa com rota nenhuma nunca
 * chega ao `_public`, e quem erra o endereço ficaria sem menu e sem rodapé.
 * Esta rota-curinga traz a tela para dentro da casca.
 *
 * O `loader` lança `notFound()` em vez de desenhar a tela como `component`:
 * desenhada como página comum, a rota casava e o SSR respondia **200** para
 * qualquer endereço inventado (soft 404), e buscador, monitor e proxy liam
 * sucesso. Com o `notFound()` o roteador responde 404 e desenha o
 * `notFoundComponent` desta mesma rota, como o `blog/$slug` já fazia
 * (_doc-lib/tanstack-router.md#guide/not-found-errors).
 *
 * **Sem arquivo `.lazy`, e é decisão**, como no academy: dividi-la custaria
 * uma ida ao servidor para carregar seis linhas.
 *
 * `noindex` continua: o status já diz que o endereço não existe, e a meta
 * cobre o rastreador que ignora o status.
 */
export const Route = createFileRoute('/_public/$')({
  loader: () => {
    throw notFound()
  },
  // Título, `robots` e canonical saem do `pageHead` como em toda rota pública (`frontend.md` §9.7):
  // à mão o separador divergia (`·`) e o `robots` ficava sem o `nofollow`.
  head: ({ params }) =>
    pageHead({
      pathname: '/'.concat(params._splat ?? ''),
      title: m.kit_not_found_title(),
      noindex: true,
    }),
  notFoundComponent: NotFound,
})
