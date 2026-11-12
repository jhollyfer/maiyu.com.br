import router from '@adonisjs/core/services/router'
import { test } from '@japa/runner'

import openapi from '#config/openapi'
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
 * role (and without a session). A 200 body is walked at any depth, in objects and in lists,
 * for a forbidden key name and for a value that looks like a password hash.
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

  test('no GET route answers with a key that is not contract, to any role', async ({
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

    for (const url of ResponseWalk.routes()) {
      for (const session of sessions) {
        const request = client.get(url).cookies(session ?? {})
        const response = await request

        if (response.status() !== 200) continue

        walked += 1
        const value: unknown = response.body()

        for (const finding of ResponseWalk.findings(value, session !== null)) {
          leaks.push(`GET ${url} ${finding.path}: ${finding.reason}`)
        }
      }
    }

    assert.isAbove(walked, 0, 'no 200 body was walked: the net is blind')
    assert.deepEqual(leaks, [])
  })
})
