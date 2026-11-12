import { redirect } from '@tanstack/react-router'

import { homeOf } from '#/lib/areas'
import type { PlatformRole, UserRole } from '@maiyu/shared'

/**
 * Quem entra numa área: papéis acima dos tenants (`platformRole`) e/ou papéis no tenant ativo
 * (`tenant.role`), as duas coordenadas do `Actor` (DECISIONS.md #394, #397, #404). Entra quem
 * está em qualquer uma das listas; a conta sem vínculo (o cliente final) só entra em área que
 * lista o papel de plataforma dela.
 */
export type AreaRule = {
  readonly platform?: ReadonlyArray<PlatformRole>
  readonly tenant?: ReadonlyArray<UserRole>
}

/**
 * O que a guarda lê da conta da sessão: o `AccountProfileShowResponse` (`GET /account/profile`,
 * DECISIONS.md #491) e o `Actor` do backend servem. O `tenant` é o vínculo ativo, `null` quando a
 * conta não tem nenhum ou tem vários e não escolheu.
 */
export type AreaAccount = {
  readonly platformRole: PlatformRole
  readonly tenant: { readonly role: UserRole } | null
}

/**
 * A guarda de área do painel (`_standards/frontend.md` §3).
 *
 * O `layout.tsx` de `_private` cobre só a sessão: qualquer conta logada passa. Cada
 * área declara quem entra no `beforeLoad` do próprio layout, e quem não pode volta
 * para a casa da própria conta antes de a rota carregar dado. Sem isso um comprador
 * abria a tela de categorias do administrador e só o 403 da API, tela a tela, o
 * barrava. O backend continua sendo quem autoriza; aqui só se redireciona.
 *
 * `allows` é a mesma tabela lida pelo menu (`PanelMenu.visible`): o link nunca leva a uma tela
 * que devolveria quem clicou.
 *
 * Ponto de extensão: `#/lib/areas.ts` do projeto exporta `AREAS` (área para `AreaRule`) e
 * `homeOf(account)`, o destino de quem não pode entrar.
 *
 * ```ts
 * beforeLoad: ({ context }) => AreaCapability.require(context.account, AREAS.administrator)
 * ```
 *
 * Base: `simple-hub/frontend/src/lib/area-capability.ts`.
 */
export class AreaCapability {
  static allows(account: AreaAccount, rule: AreaRule): boolean {
    if (rule.platform?.includes(account.platformRole)) return true

    return Boolean(account.tenant && rule.tenant?.includes(account.tenant.role))
  }

  static require(account: AreaAccount, rule: AreaRule): void {
    if (AreaCapability.allows(account, rule)) return

    redirect({ ...homeOf(account), throw: true })
  }
}
