import { createFileRoute, Outlet } from '@tanstack/react-router'
import type * as React from 'react'

import { AuthShell } from '#/components/common/auth-shell/auth-shell'
import { validateRedirectSearch } from '#/lib/redirect-search'
import { SessionGuard } from '#/lib/session-guard'

/**
 * O grupo das telas de sessão (entrada, e o cadastro e a recuperação que são do projeto), do kit
 * (bloco `painel`, DECISIONS.md #491). Está no layout e não em cada tela pelo mesmo motivo do
 * `_private`: tela nova nasce coberta por estar no lugar certo.
 *
 * É a guarda inversa: quem já tem sessão não vê o formulário e vai ao `?redirect=` ou a `homeOf`
 * (`SessionGuard.leaveIfSignedIn`). O `?redirect=` só aceita caminho interno (`lib/redirect-search.ts`).
 * A tela de sessão fica fora do índice (`frontend.md` §9.7).
 *
 * _doc-lib/tanstack-router.md#guide/authenticated-routes,
 * https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes.
 */
export const Route = createFileRoute('/_authentication')({
  validateSearch: validateRedirectSearch,
  beforeLoad: ({ context, search }) =>
    SessionGuard.leaveIfSignedIn({ context, search }),
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return (
    <AuthShell>
      <Outlet />
    </AuthShell>
  )
}
