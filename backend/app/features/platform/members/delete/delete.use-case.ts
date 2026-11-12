import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import { left, right, type Either } from '@maiyu/shared'

import type { IdentifierPayload } from '#core/validator'
import HTTPException from '#exceptions/http.exception'
import { TenantRefusal } from '#features/platform/_shared.tenant-refusal'
import { TenantRepository } from '#repositories/tenant/tenant.repository'

type Response = Either<HTTPException, null>

/**
 * Takes an account out of a tenant (DECISIONS.md #397), by the platform owner. The repository ends
 * every session of the account in the same transaction (`TenantRepository.removeMember`): the
 * session that held the membership does not survive its removal.
 */
@inject()
export default class PlatformMemberDeleteUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: IdentifierPayload): Promise<Response> {
    try {
      const removed = await this.tenants.removeMember(id)
      if (!removed) return left(TenantRefusal.memberNotFound(this.i18n))

      return right(null)
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[platform/members > delete][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'PLATFORM_MEMBER_DELETE_ERROR',
        ),
      )
    }
  }
}
