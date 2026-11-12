import {
  HttpContextFactory,
  RequestFactory,
} from '@adonisjs/core/factories/http'
import app from '@adonisjs/core/services/app'
import i18nManager from '@adonisjs/i18n/services/main'
import { errors, LimiterManager, stores } from '@adonisjs/limiter'
import { test } from '@japa/runner'

import { ACTIVE_STATUS, BASE_LOCALE } from '@maiyu/shared'

import {
  CredentialSecret,
  CredentialSource,
  type CredentialRecord,
} from '#core/credential'
import HTTPException from '#exceptions/http.exception'
import CredentialTenantMiddleware from '#middleware/credential-tenant.middleware'
import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { CredentialAttempts } from '#start/limiter.base'
import { makeWithMemory } from '#tests/container-fixtures'
import { TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

/**
 * The tenant of a public credential (DECISIONS.md #583): a class code, an invite token, a protocol.
 * The project declares each kind as a `CredentialSource` and names it on the route; these doubles
 * stand for two of them. What the specs hold is that a credential that is wrong, expired or of a
 * tenant that is gone is, from the outside, the same answer.
 */
abstract class CodeSource extends CredentialSource {}
abstract class TokenSource extends CredentialSource {}

class MemorySource extends CredentialSource {
  finds = 0
  constructor(private readonly records: Record<string, CredentialRecord>) {
    super()
  }

  async find(locator: string): Promise<CredentialRecord | null> {
    this.finds += 1

    return this.records[locator] ?? null
  }
}

class CountingTenants extends TenantMemoryRepository {
  lookups = 0

  override async findById(id: string) {
    this.lookups += 1

    return super.findById(id)
  }
}

const base = { type: TENANT_TYPE_FIXTURE, parentId: null, cityId: 'c1' }
const FUTURE = new Date(Date.now() + 60 * 60 * 1000)
const PAST = new Date(Date.now() - 60 * 60 * 1000)
const SECRET = 's3cr3t-token-value'

const record = (
  tenantId: string,
  extra: Partial<CredentialRecord> = {},
): CredentialRecord => ({
  tenantId,
  targetId: `target-of-${tenantId}`,
  expiresAt: null,
  secretHash: null,
  ...extra,
})

/** The ceiling of the house, over the memory store: the spec holds the counting, not the database. */
function attemptsOf(name = 'credential'): CredentialAttempts {
  return new CredentialAttempts(
    name,
    new LimiterManager({
      default: 'memory',
      stores: { memory: stores.memory({}) },
    }),
  )
}

function world() {
  const tenants = new CountingTenants(new SessionMemoryRepository())
    .addCity({ id: 'c1', name: 'Tabatinga', slug: 'tabatinga' })
    .addTenant({ ...base, id: 't1', name: 'Ana', slug: 'ana' })
    .addTenant({
      ...base,
      id: 't-off',
      name: 'Off',
      slug: 'off',
      status: ACTIVE_STATUS.INACTIVE,
    })
  const codes = new MemorySource({
    AB12CD: record('t1'),
    OLD111: record('t1', { expiresAt: PAST }),
    FRESH1: record('t1', { expiresAt: FUTURE }),
    OFF111: record('t-off'),
    GONE11: record('t-deleted'),
  })
  const tokens = new MemorySource({
    abc123: record('t1', { secretHash: CredentialSecret.digest(SECRET) }),
    nohash: record('t1'),
    expired: record('t1', {
      expiresAt: PAST,
      secretHash: CredentialSecret.digest(SECRET),
    }),
    offtkn: record('t-off', { secretHash: CredentialSecret.digest(SECRET) }),
  })

  return { tenants, codes, tokens }
}

type Run = {
  status: number
  code?: string
  message?: string
  context: ReturnType<HttpContextFactory['create']>
  lookups: number
  finds: number
}

async function run(
  value: string,
  options: {
    kind: 'code' | 'token'
    access?: 'read' | 'insert'
    attempts?: CredentialAttempts
  },
): Promise<Run> {
  const { tenants, codes, tokens } = world()
  const middleware = await makeWithMemory(CredentialTenantMiddleware, [
    [TenantRepository, tenants],
  ])
  app.container.swap(CodeSource, () => codes)
  app.container.swap(TokenSource, () => tokens)
  const request = new RequestFactory().create()
  const context = new HttpContextFactory().merge({ request }).create()
  context.params = { credential: value }
  context.i18n = i18nManager.locale(BASE_LOCALE)
  context.containerResolver = app.container.createResolver()
  const kinds = {
    code: { instance: codes, token: CodeSource },
    token: { instance: tokens, token: TokenSource },
  }
  const { instance: source, token } = kinds[options.kind]

  try {
    await middleware.handle(context, async () => {}, {
      source: token,
      from: 'credential',
      secret: options.kind === 'token',
      access: options.access,
      attempts: options.attempts ?? attemptsOf(),
    })
  } catch (error) {
    if (error instanceof errors.E_TOO_MANY_REQUESTS)
      return {
        status: error.status,
        context,
        lookups: tenants.lookups,
        finds: source.finds,
      }
    if (error instanceof HTTPException)
      return {
        status: error.status,
        code: error.code,
        message: error.message,
        context,
        lookups: tenants.lookups,
        finds: source.finds,
      }
    throw error
  } finally {
    app.container.restore(CodeSource)
    app.container.restore(TokenSource)
  }

  return {
    status: 200,
    context,
    lookups: tenants.lookups,
    finds: source.finds,
  }
}

test.group('middleware > credential-tenant (unit)', () => {
  test('a code resolves its tenant and its target, read only', async ({
    assert,
  }) => {
    const result = await run('AB12CD', { kind: 'code' })

    assert.equal(result.status, 200)
    assert.deepEqual(result.context.credential, {
      tenantId: 't1',
      targetId: 'target-of-t1',
    })
    assert.deepEqual(
      [...(result.context.tenantScope?.tenantIds() ?? [])],
      ['t1'],
    )
    assert.isTrue(result.context.tenantScope?.canRead('t1'))
    assert.isFalse(result.context.tenantScope?.canRead('t2'))
    assert.isFalse(result.context.tenantScope?.canWrite('t1'))
    assert.isNull(result.context.tenantScope?.customerTarget() ?? null)
  })

  test('how the code was typed does not matter, and a code that has an expiry in the future works', async ({
    assert,
  }) => {
    assert.equal((await run('  ab12cd ', { kind: 'code' })).status, 200)
    assert.equal((await run('fresh1', { kind: 'code' })).status, 200)
  })

  test('a route that declared its write gets a scope that creates in the credential tenant', async ({
    assert,
  }) => {
    const result = await run('AB12CD', { kind: 'code', access: 'insert' })

    assert.equal(result.status, 200)
    assert.equal(result.context.tenantScope?.customerTarget()?.tenantId, 't1')
  })

  test('a wrong code, an expired one, a tenant that is off and a tenant that is gone are the same 404', async ({
    assert,
  }) => {
    const answers = await Promise.all(
      ['NOPE00', 'OLD111', 'OFF111', 'GONE11', '', 'x'.repeat(500)].map(
        (value) => run(value, { kind: 'code' }),
      ),
    )

    for (const answer of answers) {
      assert.equal(answer.status, 404)
      assert.equal(answer.code, 'RESOURCE_NOT_FOUND')
      assert.equal(answer.message, answers[0]?.message)
      assert.isUndefined(answer.context.credential)
      assert.isUndefined(answer.context.tenantScope)
    }
  })

  test('every failure does the same I/O as a hit, so the time does not tell them apart', async ({
    assert,
  }) => {
    const hit = await run('AB12CD', { kind: 'code' })

    for (const value of ['NOPE00', 'OLD111', 'OFF111', 'GONE11']) {
      const miss = await run(value, { kind: 'code' })

      assert.equal(miss.finds, hit.finds, value)
      assert.equal(miss.lookups, hit.lookups, value)
    }
  })

  test('a value with no usable shape is not looked up at all', async ({
    assert,
  }) => {
    for (const value of ['', '   ', 'x'.repeat(500)]) {
      const answer = await run(value, { kind: 'code' })
      assert.equal(answer.status, 404)
      assert.equal(answer.finds, 0, value)
    }
    for (const value of ['abc123', 'abc123.', '.s3cr3t', 'a.b.c']) {
      const answer = await run(value, { kind: 'token' })
      assert.equal(answer.status, 404)
      assert.equal(answer.finds, 0, value)
    }
  })

  test('a token resolves with the right secret', async ({ assert }) => {
    const result = await run(`abc123.${SECRET}`, { kind: 'token' })

    assert.equal(result.status, 200)
    assert.equal(result.context.credential?.tenantId, 't1')
  })

  test('a token with the wrong secret, none, no stored hash, expired or of a tenant that is off is the same 404', async ({
    assert,
  }) => {
    const answers = await Promise.all(
      [
        'abc123.wrong-secret',
        'abc123',
        'abc123.',
        `nohash.${SECRET}`,
        `expired.${SECRET}`,
        `offtkn.${SECRET}`,
        `unknown.${SECRET}`,
      ].map((value) => run(value, { kind: 'token' })),
    )

    for (const answer of answers) {
      assert.equal(answer.status, 404)
      assert.equal(answer.code, 'RESOURCE_NOT_FOUND')
      assert.equal(answer.message, answers[0]?.message)
    }
  })

  test('the token failures cost the same lookups as a hit', async ({
    assert,
  }) => {
    const hit = await run(`abc123.${SECRET}`, { kind: 'token' })

    for (const value of [
      'abc123.wrong-secret',
      `expired.${SECRET}`,
      `offtkn.${SECRET}`,
      `unknown.${SECRET}`,
    ]) {
      const miss = await run(value, { kind: 'token' })

      assert.equal(miss.lookups, hit.lookups, value)
      assert.equal(miss.finds, hit.finds, value)
    }
  })

  test('a code in a place the route does not carry is a 404 too', async ({
    assert,
  }) => {
    const { tenants, codes } = world()
    const middleware = await makeWithMemory(CredentialTenantMiddleware, [
      [TenantRepository, tenants],
    ])
    app.container.swap(CodeSource, () => codes)
    const context = new HttpContextFactory()
      .merge({ request: new RequestFactory().create() })
      .create()
    context.params = {}
    context.i18n = i18nManager.locale(BASE_LOCALE)
    context.containerResolver = app.container.createResolver()

    const refusal = await middleware
      .handle(context, async () => {}, {
        source: CodeSource,
        from: 'credential',
        attempts: attemptsOf(),
      })
      .then(
        () => null,
        (error: unknown) => error,
      )
    app.container.restore(CodeSource)

    if (!(refusal instanceof HTTPException))
      return assert.fail('a credential that is not there resolved')
    assert.equal(refusal.status, 404)
  })

  test('a code shared by a whole class opens for every student: only the miss is counted', async ({
    assert,
  }) => {
    const attempts = attemptsOf('classCode')

    for (let student = 0; student < 30; student += 1)
      assert.equal(
        (await run('AB12CD', { kind: 'code', attempts })).status,
        200,
        `student ${student + 1}`,
      )
  })

  test('ten misses on one credential lock it, the right one included, and the lock is that credential only', async ({
    assert,
  }) => {
    const attempts = attemptsOf('classCode')

    for (let miss = 0; miss < 10; miss += 1)
      assert.equal(
        (await run('OLD111', { kind: 'code', attempts })).status,
        404,
      )

    assert.equal((await run('OLD111', { kind: 'code', attempts })).status, 429)
    assert.equal((await run('AB12CD', { kind: 'code', attempts })).status, 200)
  })

  test('a hit after misses inside the ceiling passes and starts the count over', async ({
    assert,
  }) => {
    const attempts = attemptsOf('invite')
    const wrong = (n: number) => `abc123.wrong-${n}`

    for (let miss = 0; miss < 9; miss += 1)
      assert.equal(
        (await run(wrong(miss), { kind: 'token', attempts })).status,
        404,
      )
    assert.equal(
      (await run(`abc123.${SECRET}`, { kind: 'token', attempts })).status,
      200,
    )
    // The nine misses are forgotten: nine more still do not lock it.
    for (let miss = 0; miss < 9; miss += 1)
      assert.equal(
        (await run(wrong(miss), { kind: 'token', attempts })).status,
        404,
      )
    assert.equal(
      (await run(`abc123.${SECRET}`, { kind: 'token', attempts })).status,
      200,
    )
  })

  test('the ceiling of a token counts by its locator, so guesses at the secret share one bucket', async ({
    assert,
  }) => {
    const attempts = attemptsOf('invite')

    for (let guess = 0; guess < 10; guess += 1)
      assert.equal(
        (await run(`abc123.guess-${guess}`, { kind: 'token', attempts }))
          .status,
        404,
      )

    // Ten different secrets, one locator: the eleventh try is locked even with the right secret.
    assert.equal(
      (await run(`abc123.${SECRET}`, { kind: 'token', attempts })).status,
      429,
    )
    assert.equal(
      (await run(`nohash.${SECRET}`, { kind: 'token', attempts })).status,
      404,
    )
  })

  test('the buckets of two kinds never mix', async ({ assert }) => {
    const codes = attemptsOf('classCode')
    const rooms = attemptsOf('room')

    for (let miss = 0; miss < 10; miss += 1)
      await run('OLD111', { kind: 'code', attempts: codes })

    assert.equal(
      (await run('OLD111', { kind: 'code', attempts: codes })).status,
      429,
    )
    assert.equal(
      (await run('OLD111', { kind: 'code', attempts: rooms })).status,
      404,
    )
  })

  test('the secret is compared on every path, a miss without a row included', async ({
    assert,
  }) => {
    const original = CredentialSecret.matches.bind(CredentialSecret)
    let compared = 0
    CredentialSecret.matches = (secret, stored) => {
      compared += 1

      return original(secret, stored)
    }

    try {
      await run(`abc123.${SECRET}`, { kind: 'token' })
      const hit = compared
      for (const value of [
        'abc123.wrong-secret',
        `unknown.${SECRET}`,
        `nohash.${SECRET}`,
      ]) {
        compared = 0
        await run(value, { kind: 'token' })
        assert.equal(compared, hit, value)
      }
    } finally {
      CredentialSecret.matches = original
    }
  })
})
