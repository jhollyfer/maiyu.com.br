import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/**
 * A entrada (`/sign-in`, a mesma URL em todo projeto, DECISIONS.md #491). A guarda inversa, o
 * `?redirect=` validado e o `noindex` do grupo moram no layout `_authentication`; o `pageHead` mora
 * aqui, na rota folha, uma vez por página (`frontend.md` §9.7): título, canonical e `hreflang` dos
 * três idiomas mais `x-default`.
 */
export const Route = createFileRoute('/_authentication/sign-in/')({
  head: () => pageHead({ title: m.kit_sign_in_title(), pathname: '/sign-in' }),
})
