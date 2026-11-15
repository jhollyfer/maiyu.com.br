import type { ApiClient } from '@japa/api-client'
import { test } from '@japa/runner'

import { LOCALE } from '@maiyu/shared'

import { resetDatabase } from '#tests/http-fixtures'

/**
 * The language negotiation through the real path: the 422 of a blank login comes out in the
 * language the middleware chose, so the message is the probe. `Accept-Language` is read whole,
 * with its qualities and its regional variants (`en-US` serves `en`): the list that
 * `request.languages()` returns has no `q`, and a negotiation over it ranked `es` above
 * `fr;q=0.9, en-US;q=0.8, es;q=0.5`, because an exact tag outweighs a variant when the
 * qualities look equal.
 */
test.group('middleware > detect-user-locale', (group) => {
  // Sign-in has an attempt ceiling per client: each test starts with the counter at zero.
  group.each.setup(() => resetDatabase())

  async function messageFor(
    client: ApiClient,
    acceptLanguage?: string,
  ): Promise<string> {
    const request = client
      .post('/authentication/sign-in')
      .json({ login: '', password: 'x' })

    if (acceptLanguage !== undefined)
      request.header('Accept-Language', acceptLanguage)
    const response = await request

    return JSON.stringify(response.body())
  }

  const CASES = [
    ['fr;q=0.9, en-US;q=0.8, es;q=0.5', LOCALE.EN],
    ['es;q=0.5, en;q=0.8', LOCALE.EN],
    ['en-US,en;q=0.9', LOCALE.EN],
    ['en-GB', LOCALE.EN],
    ['es-419, en;q=0.4', LOCALE.ES],
    ['es', LOCALE.ES],
    ['pt, en;q=0.5', LOCALE.PT_BR],
    ['pt-PT', LOCALE.PT_BR],
    ['fr', LOCALE.PT_BR],
    ['fr, de;q=0.7', LOCALE.PT_BR],
    ['*', LOCALE.PT_BR],
  ] as const

  for (const [header, expected] of CASES) {
    test(`Accept-Language "${header}" answers in ${expected}`, async ({
      client,
      assert,
    }) => {
      const reference = await messageFor(client, expected)

      assert.equal(await messageFor(client, header), reference)
    })
  }

  test('without Accept-Language the answer is in the base language', async ({
    client,
    assert,
  }) => {
    assert.equal(
      await messageFor(client),
      await messageFor(client, LOCALE.PT_BR),
    )
  })

  test('the three languages answer differently', async ({ client, assert }) => {
    const messages = new Set([
      await messageFor(client, LOCALE.PT_BR),
      await messageFor(client, LOCALE.ES),
      await messageFor(client, LOCALE.EN),
    ])

    assert.equal(messages.size, 3)
  })
})
