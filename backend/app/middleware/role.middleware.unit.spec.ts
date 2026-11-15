import {
  HttpContextFactory,
  RequestFactory,
} from '@adonisjs/core/factories/http'
import app from '@adonisjs/core/services/app'
import i18nManager from '@adonisjs/i18n/services/main'
import { test } from '@japa/runner'

import {
  BASE_LOCALE,
  PLATFORM_ROLE,
  type TenantAccess,
  type UserRole,
} from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import RoleMiddleware from '#middleware/role.middleware'
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'

type Outcome = {
  readonly status: number
  readonly code: string | null
  readonly nextCalls: number
}

/**
 * The middleware alone, with the role of the active tenant on the actor: the matrix of which
 * route group admits which role is the project's (`start/routes.ts`) and lives in the project's
 * own spec. Here is what holds for every project: the role is the membership's in the active
 * tenant, an account with no active tenant has none, and a refusal is `403 ACCESS_DENIED` that
 * never reaches the handler.
 */
class RoleRun {
  static async of(
    allowed: ReadonlyArray<UserRole>,
    role: UserRole | null,
  ): Promise<Outcome> {
    const context = new HttpContextFactory()
      .merge({ request: new RequestFactory().create() })
      .create()
    context.i18n = i18nManager.locale(BASE_LOCALE)
    context.actor = {
      id: 'user-1',
      email: 'pessoa@mail.com',
      phone: null,
      platformRole: PLATFORM_ROLE.USER,
      tenant: RoleRun.tenantWith(role),
      avatarId: null,
    }
    const middleware = await app.container.make(RoleMiddleware)
    let nextCalls = 0

    try {
      await middleware.handle(
        context,
        async () => {
          nextCalls += 1
        },
        allowed,
      )
    } catch (error) {
      if (error instanceof HTTPException)
        return { status: error.status, code: error.code, nextCalls }
      throw error
    }

    return { status: 200, code: null, nextCalls }
  }

  /** The active tenant with `role`, or no active tenant when the role is `null`. */
  private static tenantWith(role: UserRole | null): TenantAccess | null {
    if (role === null) return null

    return { id: 't1', cityId: 'c1', role, childIds: [] }
  }
}

test.group('middleware > role (unit)', () => {
  test('a role in the list passes to the handler once', async ({ assert }) => {
    const outcome = await RoleRun.of([ROLE_FIXTURES.staff], ROLE_FIXTURES.staff)

    assert.deepEqual(outcome, { status: 200, code: null, nextCalls: 1 })
  })

  test('a role outside the list responds 403 ACCESS_DENIED and stops', async ({
    assert,
  }) => {
    const outcome = await RoleRun.of([], ROLE_FIXTURES.staff)

    assert.deepEqual(outcome, {
      status: 403,
      code: 'ACCESS_DENIED',
      nextCalls: 0,
    })
  })

  test('a non-staff role is refused by a staff group', async ({ assert }) => {
    const outcome = await RoleRun.of(
      [ROLE_FIXTURES.staff],
      ROLE_FIXTURES.nonStaff,
    )

    assert.deepEqual(outcome, {
      status: 403,
      code: 'ACCESS_DENIED',
      nextCalls: 0,
    })
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test('an account with no active tenant has no role and is refused', async ({
    assert,
  }) => {
    const outcome = await RoleRun.of([ROLE_FIXTURES.staff], null)

    assert.deepEqual(outcome, {
      status: 403,
      code: 'ACCESS_DENIED',
      nextCalls: 0,
    })
  })
})
