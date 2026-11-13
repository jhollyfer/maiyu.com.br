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
 * A regra de área do painel (`_standards/frontend.md` §3.4): quem entra em cada área.
 *
 * `allows` é a tabela lida pela guarda de área (`SessionGuard.requireArea`, `lib/session-guard.ts`) e
 * pelo menu (`PanelMenu.visible`): o link nunca leva a uma tela que devolveria quem clicou.
 *
 * Puro de propósito: não importa nada de `#/lib/areas`. O `homeOf` do projeto pode decidir a casa por
 * papel com `AreaCapability.allows`, e um import de volta daqui fecharia um ciclo em runtime
 * (`area-capability.test.ts` cobra). O redirect de quem não entra mora em `SessionGuard.requireArea`,
 * que já dependia de `homeOf`.
 *
 * Base: `simple-hub/frontend/src/lib/area-capability.ts`.
 */
export class AreaCapability {
  static allows(account: AreaAccount, rule: AreaRule): boolean {
    if (rule.platform?.includes(account.platformRole)) return true

    return Boolean(account.tenant && rule.tenant?.includes(account.tenant.role))
  }
}
