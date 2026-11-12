import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import { left, right, type Actor, type Either } from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import type { AuthenticationTenantSelectPayload } from '#validators/authentication/tenants.validator'

type Payload = AuthenticationTenantSelectPayload & { readonly actor: Actor }
type Response = Either<HTTPException, null>

/**
 * The tenant the session works in from now on (DECISIONS.md #390). Only a tenant the account is a
 * member of: any other answers 404, the same as one that does not exist, so the route does not
 * confirm which tenants exist.
 */
@inject()
export default class AuthenticationTenantSelectUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ actor, tenantId }: Payload): Promise<Response> {
    try {
      const access = await this.tenants.accessFor(actor.id, tenantId)
      if (access?.id !== tenantId)
        return left(
          HTTPException.NotFound(
            this.i18n.t('errors.not_found'),
            'TENANT_NOT_FOUND',
          ),
        )

      await this.tenants.setActive(actor.id, tenantId)

      return right(null)
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[authentication/tenants > select][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'AUTHENTICATION_TENANT_SELECT_ERROR',
        ),
      )
    }
  }
}
