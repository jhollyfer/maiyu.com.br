import { Link, useMatchRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark/brand-mark'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar'
import { homeOf } from '#/lib/areas'
import type { PanelMenuItem } from '#/lib/panel-menu'
import { m } from '#/paraglide/messages'

import { usePanelShellContext } from './panel-shell-context'

/**
 * O item ativo é o caminho mais longo que casa, não todo prefixo: `/painel` é prefixo de todos os
 * outros itens, e um `fuzzy` simples acenderia a visão geral em toda tela.
 */
function useActiveTo(items: ReadonlyArray<PanelMenuItem>): string | undefined {
  const matchRoute = useMatchRoute()
  let active: string | undefined

  for (const item of items) {
    if (!matchRoute({ to: item.to, fuzzy: true })) continue
    if (active && active.length >= item.to.length) continue

    active = item.to
  }

  return active
}

/**
 * A sidebar do painel: a marca (que leva à casa da conta), os grupos do menu filtrados pela conta e o
 * contador de cada item. Recolhe para os ícones; no celular é a gaveta do `ui/sidebar`.
 *
 * `role="navigation"` no contêiner e não num `<nav>` interno: a marca fica no cabeçalho e o resto
 * dentro da mesma região, e o axe quer toda peça da sidebar dentro de um marco.
 */
export function PanelShellSidebar(): React.JSX.Element {
  const { account, menu, badges } = usePanelShellContext('PanelShellSidebar')
  const { setOpenMobile } = useSidebar()
  const active = useActiveTo(menu.flatMap((group) => group.items))

  return (
    <Sidebar
      data-slot="panel-shell-sidebar"
      collapsible="icon"
      role="navigation"
      aria-label={m.kit_panel_navigation()}
    >
      <SidebarHeader className="h-14 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link {...homeOf(account)} />}
              onClick={() => setOpenMobile(false)}
            >
              <BrandMark />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menu.map((group) => (
          <SidebarGroup key={group.label}>
            {/* Escondido de vez na sidebar recolhida: a peça só o apaga (`opacity-0`) e o puxa para
                cima com `-mt-8`, o que estaciona o rótulo invisível sobre o último item do grupo
                anterior e engole os cliques dele. */}
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={active === item.to}
                    tooltip={item.label}
                    render={<Link to={item.to} />}
                    // A gaveta é superfície de celular: linha de 44 px lá, e o 32 px denso é o da
                    // sidebar de desktop.
                    className="max-md:h-11 max-md:text-base pointer-coarse:group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center"
                    onClick={() => setOpenMobile(false)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {Boolean(badges[item.to]) && (
                    <SidebarMenuBadge>{badges[item.to]}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
