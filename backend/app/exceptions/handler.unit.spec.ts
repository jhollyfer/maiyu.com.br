import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { LimiterResponse } from '@adonisjs/limiter'
import { Exception } from '@adonisjs/core/exceptions'
import { errors as httpErrors } from '@adonisjs/core/http'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

import HttpExceptionHandler from '#exceptions/handler'
import HTTPException from '#exceptions/http.exception'

/** `shouldReport` is protected; the probe reads it the way `report()` does. */
class ReportProbe extends HttpExceptionHandler {
  reports(error: unknown): boolean {
    return this.shouldReport(this.toHttpError(error))
  }
}

async function run(error: unknown) {
  const handler = await app.container.make(HttpExceptionHandler)
  const context = new HttpContextFactory().create()

  await handler.handle(error, context)

  return {
    status: context.response.getStatus(),
    body: context.response.getBody(),
  }
}

test.group('exceptions > handler (unit)', () => {
  test("the guard's 401 uses the HTTPException factory code", async ({
    assert,
  }) => {
    const result = await run(
      new authErrors.E_UNAUTHORIZED_ACCESS('x', { guardDriverName: 'api' }),
    )

    assert.equal(result.status, 401)
    assert.deepInclude(result.body, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
  })

  test("the limiter's 429 becomes the envelope with a stable code", async ({
    assert,
  }) => {
    const response = new LimiterResponse({
      limit: 5,
      remaining: 0,
      consumed: 5,
      availableIn: 600,
    })
    const result = await run(new limiterErrors.E_TOO_MANY_REQUESTS(response))

    assert.equal(result.status, 429)
    assert.deepInclude(result.body, { status: 429, code: 'TOO_MANY_REQUESTS' })
  })

  test('an unknown error becomes a generic 500 and does not leak the message', async ({
    assert,
  }) => {
    const result = await run(new Error('relation "users" does not exist'))

    assert.equal(result.status, 500)
    assert.deepInclude(result.body, { status: 500, code: 'SERVER_ERROR' })
    assert.notInclude(JSON.stringify(result.body), 'users')
  })

  test('a framework 404 keeps the status and drops its own text', async ({
    assert,
  }) => {
    const result = await run(
      new httpErrors.E_ROUTE_NOT_FOUND(['GET', '/admin/secret-path']),
    )

    assert.equal(result.status, 404)
    assert.deepInclude(result.body, {
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
    })
    assert.notInclude(JSON.stringify(result.body), 'secret-path')
  })

  test('an unmapped framework 4xx gets the fixed fallback message', async ({
    assert,
  }) => {
    const result = await run(
      new Exception('raw framework detail', { status: 405 }),
    )

    assert.equal(result.status, 405)
    assert.deepInclude(result.body, {
      status: 405,
      code: 'INVALID_PARAMETERS',
    })
    assert.notInclude(JSON.stringify(result.body), 'raw framework detail')
  })

  test('expected statuses and codes stay out of the error report', async ({
    assert,
  }) => {
    const probe = await app.container.make(ReportProbe)

    assert.isFalse(probe.reports(new Exception('gone', { status: 404 })))
    assert.isFalse(probe.reports(new Exception('slow down', { status: 429 })))
    assert.isFalse(
      probe.reports(
        new authErrors.E_UNAUTHORIZED_ACCESS('x', { guardDriverName: 'api' }),
      ),
    )
    assert.isFalse(
      probe.reports(new httpErrors.E_ROUTE_NOT_FOUND(['GET', '/missing'])),
    )
    assert.isTrue(probe.reports(new Error('database is down')))
  })

  test('HTTPException keeps its own message and code', async ({ assert }) => {
    const result = await run(
      HTTPException.Conflict('já existe', 'ALREADY_EXISTS'),
    )

    assert.equal(result.status, 409)
    assert.deepInclude(result.body, {
      message: 'já existe',
      code: 'ALREADY_EXISTS',
    })
  })
})
