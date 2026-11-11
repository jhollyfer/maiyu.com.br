import { test } from '@japa/runner'

import { corsOrigins } from '#config/cors'
import { body } from '#tests/http-fixtures'

/**
 * The CSRF barrier through the real kernel, one test per signal the middleware reads
 * (`origin.middleware.ts`). It has no visible effect on a legitimate request, so this
 * group is what stops it from vanishing unnoticed.
 *
 * `POST /authentication/refresh` is the write without session or body: past the barrier
 * it answers 401 for the missing cookie, so what is measured is only whether the
 * refusal is the origin's.
 */
test.group('middleware > origin (e2e)', () => {
  const ROUTE = '/authentication/refresh'
  const REFUSED = 'ORIGIN_NOT_ALLOWED'

  test('an allowlisted Origin passes', async ({ client, assert }) => {
    const [origin] = corsOrigins
    assert.isDefined(origin)

    const response = await client.post(ROUTE).header('origin', origin ?? '')

    assert.notEqual(body(response).code, REFUSED)
  })

  test('an Origin outside the allowlist is refused with 403', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post(ROUTE)
      .header('origin', 'http://intruder.example')

    response.assertStatus(403)
    assert.equal(body(response).code, REFUSED)
  })

  test('without Origin, a cross-site Sec-Fetch-Site is refused', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post(ROUTE)
      .header('sec-fetch-site', 'cross-site')

    response.assertStatus(403)
    assert.equal(body(response).code, REFUSED)
  })

  test('without Origin, a same-origin Sec-Fetch-Site passes', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post(ROUTE)
      .header('sec-fetch-site', 'same-origin')

    assert.notEqual(body(response).code, REFUSED)
  })

  test('without Origin and Sec-Fetch-Site the write is refused', async ({
    client,
    assert,
  }) => {
    // Removes the origin `tests/bootstrap.ts` fills in: its hook runs first.
    const response = await client.post(ROUTE).setup((request) => {
      request.request.unset('origin')
    })

    response.assertStatus(403)
    assert.equal(body(response).code, REFUSED)
  })
})
