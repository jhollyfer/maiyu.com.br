import type { Icon } from '@phosphor-icons/react'
import type { LinkProps } from '@tanstack/react-router'

import { AreaCapability } from '#/lib/area-capability'
import type { AreaAccount, AreaRule } from '#/lib/area-capability'

/**
 * Um item do menu lateral, como dado: o destino é uma rota da árvore gerada (`to` checado pelo
 * tsc), o rótulo é um getter de mensagem (lido no render, na língua da URL) e `area` é a regra de
 * `AREAS` que mostra o item. Item sem `area` aparece para toda conta da sessão.
 */
export type PanelMenuItem = {
  readonly to: NonNullable<LinkProps['to']>
  readonly label: string
  readonly icon: Icon
  readonly area?: AreaRule
}

export type PanelMenuGroup = {
  readonly label: string
  readonly items: ReadonlyArray<PanelMenuItem>
}

/**
 * O menu que a conta vê. O menu e a guarda de área leem a mesma tabela (`AreaCapability.allows`):
 * link nunca leva a uma tela que devolveria quem clicou. Grupo que ficou sem item some.
 *
 * O menu em si é o `PANEL_MENU` de `lib/panel.ts`, do projeto (DECISIONS.md #491).
 */
export class PanelMenu {
  static visible(
    menu: ReadonlyArray<PanelMenuGroup>,
    account: AreaAccount,
  ): ReadonlyArray<PanelMenuGroup> {
    return menu
      .map((group) => ({
        label: group.label,
        items: group.items.filter(
          (item) => !item.area || AreaCapability.allows(account, item.area),
        ),
      }))
      .filter((group) => group.items.length > 0)
  }
}
