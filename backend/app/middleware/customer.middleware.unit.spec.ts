import {
  HttpContextFactory,
  RequestFactory,
} from '@adonisjs/core/factories/http'
import i18nManager from '@adonisjs/i18n/services/main'
import { test } from '@japa/runner'

import {
  BASE_LOCALE,
  PLATFORM_ROLE,
  type Actor,
  type PlatformRole,
} from '@maiyu/shared'

import { TenantScope } from '#core/tenant-scope'
import HTTPException from '#exceptions/http.exception'
import CustomerMiddleware from '#middleware/customer.middleware'
import { ROLE_FIXTURES } from '#tests/role-fixtures'

type Outcome = {
  readonly status: number
  readonly code: string | null
  readonly nextCalls: number
}

/** The middleware alone, after the scope `auth.middleware.ts` would have set for the account. */
class CustomerRun {
  static async of(scope: TenantScope | undefined): Promise<Outcome> {
    const context = new HttpContextFactory()
      .merge({ request: new RequestFactory().create() })
      .create()
    context.i18n = i18nManager.locale(BASE_LOCALE)
    if (scope) context.tenantScope = scope
    let nextCalls = 0

    try {
      await new CustomerMiddleware().handle(context, async () => {
        nextCalls += 1
      })
    } catch (error) {
      if (error instanceof HTTPException)
        return { status: error.status, code: error.code, nextCalls }
      throw error
    }

    return { status: 200, code: null, nextCalls }
  }

  static readonly MEMBERSHIP: Actor['tenant'] = {
    id: 't1',
    cityId: 'c1',
    role: ROLE_FIXTURES.staff,
    childIds: [],
  }

  static actor(platformRole: PlatformRole, tenant: Actor['tenant']): Actor {
    return {
      id: 'user-1',
      email: 'pessoa@mail.com',
      phone: null,
      platformRole,
      tenant,
      avatarId: null,
    }
  }
}

const DENIED = { status: 403, code: 'ACCESS_DENIED', nextCalls: 0 }

test.group('middleware > customer (unit)', () => {
  test('an account with no membership is the customer and passes once', async ({
    assert,
  }) => {
    const scope = TenantScope.ofAccess(
      CustomerRun.actor(PLATFORM_ROLE.USER, null),
    )

    assert.deepEqual(await CustomerRun.of(scope), {
      status: 200,
      code: null,
      nextCalls: 1,
    })
  })

  test('a member is refused with 403 ACCESS_DENIED', async ({ assert }) => {
    const scope = TenantScope.ofAccess(
      CustomerRun.actor(PLATFORM_ROLE.USER, CustomerRun.MEMBERSHIP),
    )

    assert.deepEqual(await CustomerRun.of(scope), DENIED)
  })

  test('an account with several memberships and no pick is refused', async ({
    assert,
  }) => {
    const scope = TenantScope.ofAccess(
      CustomerRun.actor(PLATFORM_ROLE.USER, null),
      true,
    )

    assert.deepEqual(await CustomerRun.of(scope), DENIED)
  })

  test('the platform owner is refused', async ({ assert }) => {
    const scope = TenantScope.ofAccess(
      CustomerRun.actor(PLATFORM_ROLE.OWNER, null),
    )

    assert.deepEqual(await CustomerRun.of(scope), DENIED)
  })

  test('a request with no scope is refused', async ({ assert }) => {
    assert.deepEqual(await CustomerRun.of(undefined), DENIED)
  })

  test('it names no tenant: the customer scope keeps none', async ({
    assert,
  }) => {
    const scope = TenantScope.ofAccess(
      CustomerRun.actor(PLATFORM_ROLE.USER, null),
    )

    assert.isNull(scope.tenantId)
    assert.isNull(scope.customerTarget())
  })
})
