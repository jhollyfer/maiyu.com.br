import type { I18n } from '@adonisjs/i18n'

import type { TenantError } from '#domain/tenant/tenant.errors'
import HTTPException from '#exceptions/http.exception'
import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'

/**
 * The tenant's and the membership's facts in the request language (DECISIONS.md #341), shared by
 * the platform owner's tenant and member actions.
 */
export class TenantRefusal extends RefusalBase {
  private static readonly TABLE = {
    TENANT_PARENT_NESTED: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('tenants.invalid'),
        'TENANT_PARENT_NESTED',
        { parentId: i18n.t('tenants.parent_nested_field') },
      ),
    TENANT_PARENT_ELSEWHERE: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('tenants.invalid'),
        'TENANT_PARENT_ELSEWHERE',
        { parentId: i18n.t('tenants.parent_elsewhere_field') },
      ),
    TENANT_HAS_CHILDREN: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('tenants.invalid'),
        'TENANT_HAS_CHILDREN',
        { cityId: i18n.t('tenants.has_children_field') },
      ),
  } satisfies RefusalTable<TenantError>

  static http(fact: TenantError, i18n: I18n): HTTPException {
    return TenantRefusal.translate(TenantRefusal.TABLE, fact.code, fact, i18n)
  }

  static notFound(i18n: I18n): HTTPException {
    return HTTPException.NotFound(
      i18n.t('tenants.not_found'),
      'TENANT_NOT_FOUND',
    )
  }

  static slugTaken(i18n: I18n): HTTPException {
    return HTTPException.Conflict(
      i18n.t('tenants.slug_taken'),
      'TENANT_SLUG_TAKEN',
      { slug: i18n.t('tenants.slug_taken_field') },
    )
  }

  static cityNotFound(i18n: I18n): HTTPException {
    return HTTPException.UnprocessableEntity(
      i18n.t('tenants.invalid'),
      'TENANT_CITY_NOT_FOUND',
      { cityId: i18n.t('tenants.city_not_found_field') },
    )
  }

  static parentNotFound(i18n: I18n): HTTPException {
    return HTTPException.UnprocessableEntity(
      i18n.t('tenants.invalid'),
      'TENANT_PARENT_NOT_FOUND',
      { parentId: i18n.t('tenants.parent_not_found_field') },
    )
  }

  static userNotFound(i18n: I18n): HTTPException {
    return HTTPException.UnprocessableEntity(
      i18n.t('tenants.invalid'),
      'MEMBER_USER_NOT_FOUND',
      { userId: i18n.t('tenants.user_not_found_field') },
    )
  }

  static memberNotFound(i18n: I18n): HTTPException {
    return HTTPException.NotFound(
      i18n.t('tenants.member_not_found'),
      'MEMBER_NOT_FOUND',
    )
  }
}
