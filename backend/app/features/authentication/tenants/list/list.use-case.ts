import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type Actor,
  type AuthenticationTenantsResponse,
  type Either,
} from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import { TenantRepository } from '#repositories/tenant/tenant.repository'

type Payload = { readonly actor: Actor }
type Response = Either<HTTPException, AuthenticationTenantsResponse>

/** The account's memberships and the one the session works in (DECISIONS.md #390). */
@inject()
export default class AuthenticationTenantListUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ actor }: Payload): Promise<Response> {
    try {
      return right({
        activeId: actor.tenant?.id ?? null,
        data: await this.tenants.membershipsOf(actor.id),
      })
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[authentication/tenants > list][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'AUTHENTICATION_TENANT_LIST_ERROR',
        ),
      )
    }
  }
}
