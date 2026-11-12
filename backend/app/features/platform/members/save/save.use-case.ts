import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type Either,
  type PlatformMemberResponse,
} from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import { TenantRefusal } from '#features/platform/_shared.tenant-refusal'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { UserRepository } from '#repositories/user/user.repository'
import type { TenantsMemberSavePayload } from '#validators/tenants/tenants.validator'

type Payload = TenantsMemberSavePayload
type Response = Either<HTTPException, PlatformMemberResponse>

/**
 * Puts an account in a tenant with a role, or changes the role it has there (DECISIONS.md #397), by
 * the platform owner. A new membership or a new role ends every session of the account in the same
 * transaction (`TenantRepository.saveMember`, `_standards/backend.md` §4.2): the session signed in
 * under the old access does not keep it. Saving the same role again changes nothing and ends nothing.
 */
@inject()
export default class PlatformMemberSaveUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly users: UserRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ params, userId, role }: Payload): Promise<Response> {
    try {
      if (!(await this.tenants.findById(params.id)))
        return left(TenantRefusal.notFound(this.i18n))
      if (!(await this.users.findById(userId)))
        return left(TenantRefusal.userNotFound(this.i18n))

      const saved = await this.tenants.saveMember(params.id, userId, role)

      return right(saved.member)
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[platform/members > save][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'PLATFORM_MEMBER_SAVE_ERROR',
        ),
      )
    }
  }
}
