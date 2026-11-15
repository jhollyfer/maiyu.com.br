import * as React from 'react'

import type { PanelMenuGroup } from '#/lib/panel-menu'
import type { AccountProfileShowResponse } from '@maiyu/shared'

/**
 * O que o painel inteiro compartilha, e só isso: a conta da sessão, o menu que ela vê e os
 * contadores dos itens. Nascem em cima, no `PanelShell`, e são lidos três níveis abaixo (a sidebar, o
 * menu de conta): passar por prop repetiria os três em cada parte.
 */
export type PanelShellContextValue = {
  readonly account: AccountProfileShowResponse
  /** O menu já filtrado pela conta (`PanelMenu.visible`): a sidebar só o desenha. */
  readonly menu: ReadonlyArray<PanelMenuGroup>
  /** Contador por item, pelo `to` dele: o número que quem opera abre o painel para achar. */
  readonly badges: Readonly<Partial<Record<string, number>>>
}

export const PanelShellContext =
  React.createContext<PanelShellContextValue | null>(null)

/** O contrato do painel, para quem está dentro do `PanelShell`. */
export function usePanelShellContext(consumer: string): PanelShellContextValue {
  const context = React.use(PanelShellContext)

  if (!context)
    throw new Error(`<${consumer}> must be rendered inside <PanelShell>`)

  return context
}
