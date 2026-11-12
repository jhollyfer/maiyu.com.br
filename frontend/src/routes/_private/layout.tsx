import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import * as React from 'react'

import {
  PanelShell,
  PanelShellContent,
  PanelShellInset,
} from '#/components/common/panel-shell/panel-shell'
import { PanelShellHeader } from '#/components/common/panel-shell/panel-shell-header'
import { PanelShellSidebar } from '#/components/common/panel-shell/panel-shell-sidebar'
import { RoutePending } from '#/components/common/route-status/route-pending'
import { Breadcrumbs } from '#/lib/breadcrumbs'
import { PANEL_MENU } from '#/lib/panel'
import { SessionGuard } from '#/lib/session-guard'
import { m } from '#/paraglide/messages'

import { useSessionExpiryRedirect } from './-use-session-expiry-redirect'

/**
 * O portão do painel, ponto de extensão do projeto (KIT.md §3.4, DECISIONS.md #491): o sync cria este
 * esqueleto se faltar e nunca o sobrescreve. Ele está no layout e não em cada tela, então rota nova
 * dentro de `_private/` nasce protegida por estar no lugar certo, como o `middleware.auth()` do grupo
 * em `backend/start/routes.ts`.
 *
 * `SessionGuard.require` põe a conta em `context.account`: toda tela descendente a lê por
 * `useRouteContext()`, sem consulta nova. Papel por área não é daqui, é do `layout.tsx` de cada área
 * (`AreaCapability.require(context.account, AREAS.<área>)`, `frontend.md` §3.4).
 *
 * O que o projeto muda: `ssr`, o `PANEL_MENU` de `lib/panel.ts`, os `badges` do menu e os `children`
 * do cabeçalho (um sino de avisos), e o provedor próprio que as telas precisarem
 * (`UploadingProvider`).
 *
 * `ssr: 'data-only'` com o cookie da sessão chegando ao SSR (API e site no mesmo domínio-pai);
 * `false` quando o cookie é de outro domínio e o servidor do site nunca o recebe (`frontend.md` §9.2,
 * DECISIONS.md #148, _doc-lib/tanstack-start.md#guide/selective-ssr,
 * https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr). O painel não tem o que
 * indexar, e o HTML do servidor não sabe a largura da tela: dado no servidor, tela no cliente.
 */
export const Route = createFileRoute('/_private')({
  ssr: 'data-only',
  pendingComponent: RoutePending,
  beforeLoad: ({ context, location }) =>
    SessionGuard.require({ context, location }),
  // Um título por tela sem `head()` em toda rota: a trilha já sabe onde se está, e uma aba chamada
  // "Painel" em todas não se distingue (`frontend.md` §1.2).
  head: ({ matches }) => {
    const title = Breadcrumbs.title(Breadcrumbs.of(matches))

    return {
      meta: [
        { title: [title, m.site_title()].filter(Boolean).join(' | ') },
        // Área restrita fora do índice (`frontend.md` §9.7).
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    }
  },
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  const { account } = Route.useRouteContext()
  const router = useRouter()

  // Sessão que vence no meio do uso: o `beforeLoad` só olha na navegação (`frontend.md` §3.2).
  // Estável entre renders: o hook assina o cache com `signIn` nas dependências, e uma função nova a
  // cada render reassinaria `QueryCache` e `MutationCache` o tempo todo.
  const signIn = React.useCallback(
    (redirect: string) =>
      router.navigate({ to: '/sign-in', search: { redirect } }),
    [router],
  )
  useSessionExpiryRedirect({ signIn })

  return (
    <PanelShell account={account} menu={PANEL_MENU}>
      <PanelShellSidebar />
      <PanelShellInset>
        <PanelShellHeader />
        <PanelShellContent>
          <Outlet />
        </PanelShellContent>
      </PanelShellInset>
    </PanelShell>
  )
}
