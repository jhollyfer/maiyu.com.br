import { Link, useMatches } from '@tanstack/react-router'
import * as React from 'react'

import { LocaleSwitcher } from '#/components/common/locale-switcher/locale-switcher'
import { ThemeToggle } from '#/components/common/theme/theme-toggle'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { Breadcrumbs } from '#/lib/breadcrumbs'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { PanelShellAccountMenu } from './panel-shell-account-menu'

/**
 * A trilha, lida das rotas (`Breadcrumbs.of`, `frontend.md` §1.2). O celular tem lugar só para o
 * nome da tela: os pais estão a um toque na gaveta, e uma trilha quebrada em duas linhas cresceria o
 * cabeçalho de 56 px. O link do pai tem alvo de 44 px onde o toque é o ponteiro.
 */
function Trail(): React.JSX.Element {
  const matches = useMatches()
  const crumbs = Breadcrumbs.of(matches)

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => (
          <React.Fragment key={crumb.label.concat(String(index))}>
            {index > 0 && <BreadcrumbSeparator className="max-sm:hidden" />}
            <BreadcrumbItem
              className={cn('min-w-0', {
                'max-sm:hidden': index < crumbs.length - 1,
              })}
            >
              {crumb.to && (
                <BreadcrumbLink
                  render={<Link to={crumb.to} />}
                  className="pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:items-center pointer-coarse:justify-center"
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
              {!crumb.to && (
                <BreadcrumbPage className="truncate">
                  {crumb.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * O cabeçalho do painel: abrir e fechar a sidebar, a trilha, e à direita os `children` (as ações do
 * projeto, como um sino de avisos), o idioma, o tema e o menu de conta.
 */
export function PanelShellHeader({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.JSX.Element {
  return (
    <header
      data-slot="panel-shell-header"
      className="flex h-14 shrink-0 items-center gap-2 border-b bg-background"
    >
      <div className="flex min-w-0 items-center gap-2 px-3 md:px-4">
        <SidebarTrigger aria-label={m.kit_panel_open_menu()} />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Trail />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1 px-3 md:gap-2 md:px-4">
        {children}
        <LocaleSwitcher compact />
        <ThemeToggle />
        <PanelShellAccountMenu />
      </div>
    </header>
  )
}
