import router from '@adonisjs/core/services/router'
import type { ApiClient, ApiResponse } from '@japa/api-client'
import { test } from '@japa/runner'

import openapi from '#config/openapi'
import { SESSION_TOKEN } from '#config/session-token'
import {
  authenticateAsAdministrator,
  authenticateAsCustomer,
  authenticateAsNonStaff,
  authenticateAsPlatformOwner,
  resetDatabase,
  type Session,
} from '#tests/http-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'

/**
 * The leak net (`_standards/backend.md` §7, "vazamento por allowlist"): no response carries a
 * key that belongs to the model and not to the contract. The presenter chooses each field
 * (§5, "O que sai do use-case é contrato"), and this spec is what notices the day a model, an
 * entity or a join reaches the body whole.
 *
 * The routes are read from `router.toJSON()`, like `openapi.e2e.spec.ts`: a new `GET` without
 * a path parameter enters by construction, in the kit and in the project, and is read by every
 * role (and without a session). Every body is walked, the error ones included, at any depth, in
 * objects and in lists, for a forbidden key name, a value that looks like a password hash and a
 * stack trace. Every response has its headers read too: no `X-Powered-By`, and no session cookie
 * issued by a response that does not sign in (a `GET`, an error).
 */

/**
 * The names a response must never carry, compared without case, `_` or `-`
 * (`password_hash` and `passwordHash` are the same name). The `Token` suffix catches
 * `refreshToken` and `accessToken`; `digest` is the column the storage and the receipt keep to
 * refuse a duplicate, which no screen needs. `deletedAt` is forbidden too, with one exception
 * (`SESSION_ONLY_KEYS`).
 */
const FORBIDDEN_KEYS = [
  'password',
  'passwordhash',
  'hash',
  'salt',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'digest',
  'sha256',
  'deletedat',
  'stack',
]

/**
 * The names that are contract for a signed-in session and a leak for an anonymous read.
 * `ResponseRule.timestamps()` declares `deletedAt`, and the panel's trash needs it (the list of
 * archived rows with the date they went); the public showcase never shows a deleted row, so a
 * response read without a session that carries it is the soft-deleted row reaching the street.
 * A timestamp is not a secret: the rule is about who reads, not about the name.
 */
const SESSION_ONLY_KEYS = ['deletedat']

/** What a stored password looks like, whatever the key it was left under. */
const HASH_VALUE = /^\$(scrypt|argon2|2[aby]|pbkdf2)/i

/** A stack frame (`    at fn (file.ts:12:3)`), whatever the key it was left under. */
const STACK_VALUE = /\n\s+at\s|\.[cm]?[jt]s:\d+:\d+/

/** The headers that tell the stack in front of the API, which no client needs. */
const FORBIDDEN_HEADERS = ['x-powered-by']

/** The cookies that carry the session: only sign-in and refresh may issue them. */
const SESSION_COOKIES: ReadonlyArray<string> = [
  SESSION_TOKEN.ACCESS,
  SESSION_TOKEN.REFRESH,
]

/**
 * Error answers the routes of `GET` do not reach: the unknown route, the refused body and the
 * refused session. Each one is walked like a `GET` body, and none of them signs anyone in.
 */
const ERROR_PROBES: ReadonlyArray<{
  readonly name: string
  readonly send: (client: ApiClient) => Promise<ApiResponse>
}> = [
  {
    name: 'GET of a route that does not exist',
    send: (client) => client.get('/__response-leak-no-route__'),
  },
  {
    name: 'sign-in with an invalid body',
    send: (client) =>
      client.post('/authentication/sign-in').json({ login: '', password: '' }),
  },
  {
    name: 'sign-in with a wrong password',
    send: (client) =>
      client
        .post('/authentication/sign-in')
        .json({ login: 'ninguem@exemplo.com.br', password: 'errada-123' }),
  },
  {
    name: 'refresh without a cookie',
    send: (client) => client.post('/authentication/refresh'),
  },
  {
    name: 'refresh with a garbage cookie',
    send: (client) =>
      client
        .post('/authentication/refresh')
        .cookies({ [SESSION_TOKEN.REFRESH]: 'lixo' }),
  },
]

/** The path parameters a spec can fill without creating anything; the other routes are skipped. */
const KNOWN_PARAMS: Readonly<Record<string, string>> = {
  city: 'benjamin-constant',
}

type Finding = { path: string; reason: string }

class ResponseWalk {
  /**
   * Every forbidden key and every hash-looking value of `value`, with the path to it. `signedIn`
   * is whether the read had a session: it lets `SESSION_ONLY_KEYS` through.
   */
  static findings(
    value: unknown,
    signedIn = false,
    path = '$',
  ): Array<Finding> {
    if (typeof value === 'string' && HASH_VALUE.test(value))
      return [{ path, reason: 'a value that looks like a password hash' }]

    if (typeof value === 'string' && STACK_VALUE.test(value))
      return [{ path, reason: 'a value that looks like a stack trace' }]

    if (Array.isArray(value))
      return value.flatMap((item: unknown, index) =>
        ResponseWalk.findings(item, signedIn, `${path}[${index}]`),
      )

    if (typeof value !== 'object' || value === null) return []

    return Object.entries(value).flatMap(([key, child]) => {
      const name = key.toLowerCase().replace(/[_-]/g, '')
      const own: Array<Finding> = []
      const allowed = signedIn && SESSION_ONLY_KEYS.includes(name)
      if (FORBIDDEN_KEYS.includes(name) && !allowed)
        own.push({
          path: `${path}.${key}`,
          reason: 'a key that is not contract',
        })

      return [
        ...own,
        ...ResponseWalk.findings(child, signedIn, `${path}.${key}`),
      ]
    })
  }

  /**
   * Every forbidden header and every session cookie the response issues, by name. Clearing the
   * cookie (empty value, what sign-out writes) is not issuing it.
   */
  static headerFindings(headers: Record<string, unknown>): Array<Finding> {
    const found: Array<Finding> = FORBIDDEN_HEADERS.filter(
      (name) => headers[name] !== undefined,
    ).map((name) => ({ path: name, reason: 'a header that is not contract' }))

    const setCookie = headers['set-cookie']
    // Node gives `set-cookie` as a list; `flat` also reads a single value.
    const cookies: Array<unknown> = [setCookie].flat()

    for (const cookie of cookies) {
      if (typeof cookie !== 'string') continue

      const [pair = ''] = cookie.split(';')
      const separator = pair.indexOf('=')
      const name = pair.slice(0, separator).trim()
      const value = pair.slice(separator + 1).trim()

      if (SESSION_COOKIES.includes(name) && value !== '')
        found.push({
          path: `set-cookie ${name}`,
          reason: 'a session cookie issued outside sign-in and refresh',
        })
    }

    return found
  }

  /**
   * The error envelope with its `errors` map as a list of messages: the keys of that map are the
   * names of the fields the client sent (`password` included), not data the API reveals, and the
   * messages are still walked.
   */
  static withoutFieldNames(value: unknown): unknown {
    if (typeof value !== 'object' || value === null || !('errors' in value))
      return value
    if (typeof value.errors !== 'object' || value.errors === null) return value

    return { ...value, errors: Object.values(value.errors) }
  }

  /** Body and header findings of one response, already as lines of the report. */
  static report(
    label: string,
    response: ApiResponse,
    signedIn: boolean,
  ): Array<string> {
    const value = ResponseWalk.withoutFieldNames(response.body())
    const headers: Record<string, unknown> = response.headers()

    return [
      ...ResponseWalk.findings(value, signedIn),
      ...ResponseWalk.headerFindings(headers),
    ].map((finding) => `${label} ${finding.path}: ${finding.reason}`)
  }

  /** The URL of a `GET` pattern with its known parameters filled, or `null` when one is unknown. */
  static url(pattern: string): string | null {
    const unknown = [...pattern.matchAll(/:(\w+)/g)].some(
      (match) => KNOWN_PARAMS[match[1] ?? ''] === undefined,
    )
    if (unknown) return null

    return pattern.replace(/:(\w+)/g, (_match, name: string) => {
      return KNOWN_PARAMS[name] ?? ''
    })
  }

  /** The `GET` routes the spec reads: the router's, less the documentation and the health check. */
  static routes(): Array<string> {
    return Object.values(router.toJSON())
      .flat()
      .filter((route) => route.methods.includes('GET'))
      .filter((route) => !openapi.ignore.includes(route.pattern))
      .map((route) => ResponseWalk.url(route.pattern))
      .filter((url) => url !== null)
  }
}

test.group('response leak > walk', () => {
  test('when a response has a forbidden key at any depth, finds it', ({
    assert,
  }) => {
    const found = ResponseWalk.findings({
      id: 'a',
      user: { password_hash: 'x', members: [{ refreshToken: 'y' }] },
    })

    assert.deepEqual(
      found.map((finding) => finding.path),
      ['$.user.password_hash', '$.user.members[0].refreshToken'],
    )
  })

  test('when a value looks like a password hash, finds it under any key', ({
    assert,
  }) => {
    const found = ResponseWalk.findings({ note: '$scrypt$n=16384$abc' })

    assert.lengthOf(found, 1)
  })

  test('deletedAt (ResponseRule.timestamps) is contract for a session and a leak without one', ({
    assert,
  }) => {
    const row = { items: [{ id: 'a', createdAt: 'x', deletedAt: null }] }

    assert.deepEqual(ResponseWalk.findings(row, true), [])
    assert.deepEqual(
      ResponseWalk.findings(row).map((finding) => finding.path),
      ['$.items[0].deletedAt'],
    )
    // The session does not unlock the secrets: only the names of SESSION_ONLY_KEYS.
    assert.lengthOf(
      ResponseWalk.findings({ deletedAt: null, token: 'x' }, true),
      1,
    )
  })

  test('when a value looks like a stack trace, finds it under any key', ({
    assert,
  }) => {
    const found = ResponseWalk.findings({
      message: 'Erro interno',
      detail: 'Error: boom\n    at Foo.bar (/app/build/app/core/x.js:10:5)',
    })

    assert.deepEqual(
      found.map((finding) => finding.path),
      ['$.detail'],
    )
    assert.lengthOf(ResponseWalk.findings({ stack: [] }), 1)
  })

  test('the field names of a validation error are not keys of the response', ({
    assert,
  }) => {
    const envelope = { code: 'VALIDATION_ERROR', errors: { password: 'x' } }
    const leaking = { errors: { password: '$scrypt$n=16384$abc' } }

    assert.deepEqual(
      ResponseWalk.findings(ResponseWalk.withoutFieldNames(envelope)),
      [],
    )
    assert.lengthOf(
      ResponseWalk.findings(ResponseWalk.withoutFieldNames(leaking)),
      1,
    )
  })

  test('when a header tells the stack, finds it', ({ assert }) => {
    assert.deepEqual(
      ResponseWalk.headerFindings({ 'x-powered-by': 'Express' }).map(
        (finding) => finding.path,
      ),
      ['x-powered-by'],
    )
  })

  test('when a response issues a session cookie, finds it; clearing it is not issuing', ({
    assert,
  }) => {
    const issued = ResponseWalk.headerFindings({
      'set-cookie': [
        `${SESSION_TOKEN.ACCESS}=s:abc.def; Path=/; HttpOnly`,
        'locale=pt-BR; Path=/',
      ],
    })
    const cleared = ResponseWalk.headerFindings({
      'set-cookie': `${SESSION_TOKEN.REFRESH}=; Max-Age=0; Path=/; HttpOnly`,
    })

    assert.deepEqual(
      issued.map((finding) => finding.path),
      [`set-cookie ${SESSION_TOKEN.ACCESS}`],
    )
    assert.deepEqual(cleared, [])
  })

  test('when the response is the contract, finds nothing', ({ assert }) => {
    assert.deepEqual(
      ResponseWalk.findings({ items: [{ id: 'a', name: 'Ana' }], total: 1 }),
      [],
    )
  })

  test('when the router is read, there are routes to walk', ({ assert }) => {
    assert.isAbove(ResponseWalk.routes().length, 0)
  })
})

test.group('response leak > routes', (group) => {
  group.each.setup(() => resetDatabase())

  test('no GET route answers with a key, header or cookie that is not contract, to any role', async ({
    client,
    assert,
  }) => {
    const sessions: Array<Session | null> = [
      await authenticateAsPlatformOwner(client),
      await authenticateAsAdministrator(client),
      await authenticateAsCustomer(client),
      null,
    ]
    // A project whose roles are all staff has no non-staff account to walk with.
    if (ROLE_FIXTURES.nonStaff !== null)
      sessions.push(await authenticateAsNonStaff(client))
    const leaks: Array<string> = []
    let walked = 0
    let errors = 0

    for (const url of ResponseWalk.routes()) {
      for (const session of sessions) {
        const response = await client.get(url).cookies(session ?? {})

        // Error bodies are walked too: the handler is what writes them, not the presenter.
        if (response.status() === 200) walked += 1
        if (response.status() >= 400) errors += 1

        leaks.push(
          ...ResponseWalk.report(`GET ${url}`, response, session !== null),
        )
      }
    }

    assert.isAbove(walked, 0, 'no 200 body was walked: the net is blind')
    assert.isAbove(errors, 0, 'no error body was walked: the net is blind')
    assert.deepEqual(leaks, [])
  })

  test('no error answer carries a stack, a header that is not contract or a session cookie', async ({
    client,
    assert,
  }) => {
    const leaks: Array<string> = []

    for (const probe of ERROR_PROBES) {
      const response = await probe.send(client)

      assert.isAtLeast(response.status(), 400, probe.name)
      leaks.push(...ResponseWalk.report(probe.name, response, false))
    }

    assert.deepEqual(leaks, [])
  })
})
