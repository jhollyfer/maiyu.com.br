import { UserCircleIcon } from '@phosphor-icons/react'

import type { PanelMenuGroup } from '#/lib/panel-menu'
import { m } from '#/paraglide/messages'

/**
 * O menu do painel e quem vê cada item, lido pela sidebar do `PanelShell` (`lib/panel-menu.ts`). É
 * ponto de extensão do projeto (KIT.md §3.4, DECISIONS.md #491): o sync cria este esqueleto se faltar
 * e nunca o sobrescreve, porque os grupos e as telas são do produto.
 *
 * Cada item tem o destino (`to`, uma rota da árvore gerada, checada pelo tsc), o rótulo (um getter de
 * mensagem, lido no render, na língua da URL), o ícone e a `area` de `AREAS` (`lib/areas.ts`) que o
 * mostra: a mesma regra da guarda de área, então o menu nunca oferece uma tela que devolveria quem
 * clicou. Item sem `area` aparece para toda conta da sessão. O contador de um item (ocorrências sem
 * tratar) é do projeto: a consulta vive no `layout.tsx` de `_private`, que passa `badges` ao
 * `PanelShell`, pelo `to` do item.
 */
export const PANEL_MENU = [
  {
    get label() {
      return m.kit_panel_navigation()
    },
    items: [
      {
        to: '/profile',
        get label() {
          return m.kit_panel_my_profile()
        },
        icon: UserCircleIcon,
      },
    ],
  },
] as const satisfies ReadonlyArray<PanelMenuGroup>
