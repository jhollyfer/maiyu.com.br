import { redirect } from '@tanstack/react-router'

import { homeOf } from '#/lib/areas'
import type { Role } from '#/lib/areas'

/**
 * A guarda de área do painel (`_standards/frontend.md` §3).
 *
 * O `layout.tsx` de `_private` cobre só a sessão: qualquer conta logada passa. Cada
 * área declara quem entra no `beforeLoad` do próprio layout, e quem não pode volta
 * para a casa da própria conta antes de a rota carregar dado. Sem isso um comprador
 * abria a tela de categorias do administrador e só o 403 da API, tela a tela, o
 * barrava. O backend continua sendo quem autoriza; aqui só se redireciona.
 *
 * Ponto de extensão: `#/lib/areas.ts` do projeto exporta `type Role`, `AREAS` (área
 * para papéis) e `homeOf(role)`, o destino de quem não pode entrar.
 *
 * ```ts
 * beforeLoad: ({ context }) => AreaCapability.require(context.account, AREAS.administrator)
 * ```
 *
 * Base: `simple-hub/frontend/src/lib/area-capability.ts`.
 */
export class AreaCapability {
  static require(
    account: { readonly role: Role },
    roles: ReadonlyArray<Role>,
  ): void {
    if (roles.includes(account.role)) return

    redirect({ ...homeOf(account.role), throw: true })
  }
}
