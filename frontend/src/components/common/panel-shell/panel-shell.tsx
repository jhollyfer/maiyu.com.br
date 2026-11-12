import { QueryErrorResetBoundary } from '@tanstack/react-query'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { MaiyuCredit } from '#/components/common/maiyu-credit/maiyu-credit'
import { NotFoundPageServerError } from '#/components/common/route-status/not-found-page-server-error'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { cn } from '#/lib/cn'
import { PanelMenu } from '#/lib/panel-menu'
import type { PanelMenuGroup } from '#/lib/panel-menu'
import { m } from '#/paraglide/messages'
import type { AccountProfileShowResponse } from '@maiyu/shared'

import { PanelShellContext } from './panel-shell-context'

/** O alvo do link de pular e o `id` do `<main>` que o `SidebarInset` desenha. */
const MAIN_ID = 'main-content'

type PanelShellProps = Readonly<{
  /** A conta da sessão: o `context.account` do `_private`. */
  account: AccountProfileShowResponse
  /** O `PANEL_MENU` do projeto (`lib/panel.ts`); o filtro por conta é daqui. */
  menu: ReadonlyArray<PanelMenuGroup>
  /** Contador por item, pelo `to`: a consulta é do projeto, o número chega por aqui. */
  badges?: Readonly<Partial<Record<string, number>>>
  /** `PanelShellSidebar` e `PanelShellInset`, na ordem em que aparecem. */
  children: React.ReactNode
}>

/**
 * A casca do painel autenticado (DECISIONS.md #491): a sidebar, o cabeçalho com a trilha, o menu de
 * conta e a área do conteúdo, a mesma em todo projeto (só o tema muda). Compound: o layout do
 * `_private` monta `PanelShellSidebar` e `PanelShellInset` com `PanelShellHeader` e
 * `PanelShellContent` dentro, e o menu e a conta vêm por contexto.
 *
 * Só depende da API pública do `ui/sidebar` do registry do shadcn (`SidebarProvider`, `Sidebar`,
 * `SidebarMenuButton`, `SidebarInset`, `SidebarTrigger`, `useSidebar`), na versão do `shadcn` de
 * `kit.deps.json` (_doc-lib/shadcn.md#sidebar, https://ui.shadcn.com/docs/components/base/sidebar).
 * O projeto não edita o `ui/sidebar` além das linhas `// casa:`; um `ui/sidebar` com outra API
 * quebra o `tsc` do kit, que é onde o desvio aparece.
 *
 * O link de pular vem antes de tudo: sr-only até receber foco, e não `display: none`, que o tiraria
 * da ordem de tabulação e de quem ele serve.
 */
export function PanelShell({
  account,
  menu,
  badges = {},
  children,
}: PanelShellProps): React.JSX.Element {
  // Sem `useMemo`: o React Compiler memoiza o objeto pelo que ele lê.
  const value = { account, menu: PanelMenu.visible(menu, account), badges }

  return (
    // `h-svh`, não `min-h-svh`: uma altura que cresce não limita ninguém, e a `PageShell` das telas
    // nunca conseguiria fixar o rodapé. A altura fixa dá o teto, e o que rola é a área de cada tela.
    <SidebarProvider data-slot="panel-shell" className="h-svh overflow-hidden">
      <PanelShellContext value={value}>
        <a
          href={'#'.concat(MAIN_ID)}
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
        >
          {m.kit_panel_skip_to_content()}
        </a>
        {children}
      </PanelShellContext>
    </SidebarProvider>
  )
}

/**
 * O `<main>` ao lado da sidebar. `min-w-0` é o par horizontal de `min-h-0`: um item flex não encolhe
 * abaixo do conteúdo, e uma tabela larga empurrava a página para fora da tela, onde o `overflow-hidden`
 * do provedor a cortava em vez de deixá-la rolar.
 */
export function PanelShellInset({
  className,
  ...props
}: React.ComponentProps<typeof SidebarInset>): React.JSX.Element {
  return (
    <SidebarInset
      data-slot="panel-shell-inset"
      id={MAIN_ID}
      tabIndex={-1}
      className={cn('min-h-0 min-w-0', className)}
      {...props}
    />
  )
}

/**
 * A área que rola, com o crédito da Maiyu no fim (`frontend.md` §8). Um erro de query que escapa de
 * uma tela cai aqui e não no limite do router: o painel continua de pé, e "Tentar de novo" limpa o
 * erro guardado no cache do Query antes de remontar, senão o limite mostraria o antigo.
 */
export function PanelShellContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="panel-shell-content"
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto p-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] lg:p-6',
        className,
      )}
      {...props}
    >
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ resetErrorBoundary }) => (
              <NotFoundPageServerError onRetry={resetErrorBoundary} />
            )}
          >
            {children}
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
      <MaiyuCredit className="mt-auto justify-center pt-4 text-sm text-muted-foreground" />
    </div>
  )
}
