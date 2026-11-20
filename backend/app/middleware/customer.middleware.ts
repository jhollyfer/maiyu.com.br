import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import HTTPException from '#exceptions/http.exception'

/**
 * The end customer of a product with no tenant in the URL (DECISIONS.md #397, #797): a storefront
 * that is one global catalog, where the buyer's cart and orders are its own whatever store they
 * come from. Runs after `middleware.auth()` and asks only what `TenantScope.ofAccess` already
 * decided: the account has no membership at all, so it is a customer. A member, one with several
 * memberships and no pick, and the platform owner get `403 ACCESS_DENIED`, the same answer as
 * `publicTenant({ access: 'customer' })`. It sets no scope: the customer reads and changes the rows
 * it owns in any tenant (`CustomerScoped`), and creates none through `customerTarget`, which needs
 * a tenant; the use case that writes for a store names that store from the data it already
 * validated, never from the request's scope.
 */
export default class CustomerMiddleware {
  async handle(context: HttpContext, next: NextFn) {
    if (!context.tenantScope?.customer) {
      throw HTTPException.Forbidden(
        context.i18n.t('errors.access_denied'),
        'ACCESS_DENIED',
      )
    }

    await next()
  }
}
