import {
  HttpContextFactory,
  RequestFactory,
} from '@adonisjs/core/factories/http'
import i18nManager from '@adonisjs/i18n/services/main'
import { test } from '@japa/runner'

import {
  BASE_LOCALE,
  PLATFORM_ROLE,
  PLATFORM_STAFF_ROLES,
  type PlatformRole,
} from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import PlatformMiddleware from '#middleware/platform.middleware'

type Outcome = {
  readonly status: number
  readonly code: string | null
  readonly nextCalls: number
}

/** The middleware alone, with the platform role on the actor and the route's `roles` option. */
class PlatformRun {
  static async of(
    platformRole: PlatformRole,
    options?: { roles?: ReadonlyArray<PlatformRole> },
  ): Promise<Outcome> {
    const context = new HttpContextFactory()
      .merge({ request: new RequestFactory().create() })
      .create()
    context.i18n = i18nManager.locale(BASE_LOCALE)
    context.actor = {
      id: 'user-1',
      email: 'pessoa@mail.com',
      phone: null,
      platformRole,
      tenant: null,
      avatarId: null,
    }
    let nextCalls = 0

    try {
      await new PlatformMiddleware().handle(
        context,
        async () => {
          nextCalls += 1
        },
        options,
      )
    } catch (error) {
      if (error instanceof HTTPException)
        return { status: error.status, code: error.code, nextCalls }
      throw error
    }

    return { status: 200, code: null, nextCalls }
  }
}

const DENIED = { status: 403, code: 'ACCESS_DENIED', nextCalls: 0 }
const PASSED = { status: 200, code: null, nextCalls: 1 }

test.group('middleware > platform (unit)', () => {
  test('without options only the owner passes', async ({ assert }) => {
    assert.deepEqual(await PlatformRun.of(PLATFORM_ROLE.OWNER), PASSED)
    assert.deepEqual(await PlatformRun.of(PLATFORM_ROLE.ADMINISTRATOR), DENIED)
    assert.deepEqual(await PlatformRun.of(PLATFORM_ROLE.USER), DENIED)
  })

  test('an empty options object keeps the owner-only default', async ({
    assert,
  }) => {
    assert.deepEqual(await PlatformRun.of(PLATFORM_ROLE.OWNER, {}), PASSED)
    assert.deepEqual(
      await PlatformRun.of(PLATFORM_ROLE.ADMINISTRATOR, {}),
      DENIED,
    )
  })

  test('the staff roles admit the owner and the platform administrator', async ({
    assert,
  }) => {
    const options = { roles: PLATFORM_STAFF_ROLES }

    assert.deepEqual(await PlatformRun.of(PLATFORM_ROLE.OWNER, options), PASSED)
    assert.deepEqual(
      await PlatformRun.of(PLATFORM_ROLE.ADMINISTRATOR, options),
      PASSED,
    )
    assert.deepEqual(await PlatformRun.of(PLATFORM_ROLE.USER, options), DENIED)
  })

  test('a role outside the listed ones is refused with 403 and never reaches the handler', async ({
    assert,
  }) => {
    const outcome = await PlatformRun.of(PLATFORM_ROLE.OWNER, {
      roles: [PLATFORM_ROLE.ADMINISTRATOR],
    })

    assert.deepEqual(outcome, DENIED)
  })
})
