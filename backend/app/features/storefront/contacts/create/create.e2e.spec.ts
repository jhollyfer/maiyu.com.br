import { test } from '@japa/runner'

import { ErrorEnvelope, StorefrontContactCreateResponse } from '@maiyu/shared'

import { body, resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const VALID = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  message: 'Quero conversar sobre um projeto.',
  locale: 'pt-BR',
} as const

/**
 * The public contact form. It has no session, so what is asserted is what it stores, what it
 * refuses without storing and the two barriers a robot meets: the honeypot and the limit by
 * IP. Every refusal is followed by "saved nothing" (`_standards/backend.md` §7).
 */
test.group('storefront/contacts > create', (group) => {
  group.each.setup(() => resetDatabase())

  test('a valid message is saved pending', async ({ client, assert }) => {
    const response = await client.post('/storefront/contacts').json(VALID)

    response.assertStatus(201)
    const receipt = body(response, StorefrontContactCreateResponse)

    const [saved, ...others] = await Stored.contacts()
    assert.lengthOf(others, 0)
    assert.equal(saved?.id, receipt.id)
    assert.deepInclude(saved?.serialize(), {
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      message: 'Quero conversar sobre um projeto.',
      locale: 'pt-BR',
      answeredAt: null,
    })
  })

  test('an invalid field answers 422 and saves nothing', async ({
    client,
    assert,
  }) => {
    // Five cases, the ceiling of the hourly limit: the sixth request would answer 429 and measure
    // the limiter instead of the validator. The other bounds are the shared validator's spec.
    const invalid = [
      { payload: {}, fields: ['email', 'locale', 'message', 'name'] },
      { payload: { ...VALID, name: 'a'.repeat(121) }, fields: ['name'] },
      { payload: { ...VALID, email: 'ana' }, fields: ['email'] },
      { payload: { ...VALID, message: '         ' }, fields: ['message'] },
      { payload: { ...VALID, locale: 'fr' }, fields: ['locale'] },
    ]

    for (const { payload, fields } of invalid) {
      const response = await client
        .post('/storefront/contacts')
        .unsafeJson(payload)

      response.assertStatus(422)
      assert.deepEqual(
        Object.keys(body(response, ErrorEnvelope).errors ?? {}).sort(),
        fields,
      )
    }

    assert.lengthOf(await Stored.contacts(), 0)
  })

  test('a filled honeypot answers 201 and saves nothing', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/storefront/contacts')
      .json({ ...VALID, website: 'http://spam.example' })

    response.assertStatus(201)
    // The same receipt shape as a person gets, so the robot learns nothing.
    assert.sameMembers(
      Object.keys(body(response, StorefrontContactCreateResponse)),
      ['id', 'createdAt'],
    )
    assert.lengthOf(await Stored.contacts(), 0)
  })

  test('the sixth message from the same address in an hour answers 429', async ({
    client,
    assert,
  }) => {
    for (let sent = 1; sent <= 5; sent += 1) {
      const accepted = await client.post('/storefront/contacts').json(VALID)

      accepted.assertStatus(201)
    }

    const response = await client.post('/storefront/contacts').json(VALID)

    response.assertStatus(429)
    assert.equal(body(response, ErrorEnvelope).code, 'TOO_MANY_REQUESTS')
    assert.lengthOf(await Stored.contacts(), 5)
  })

  test('a write from another origin answers 403 and saves nothing', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/storefront/contacts')
      .header('origin', 'http://intruder.example')
      .json(VALID)

    response.assertStatus(403)
    assert.equal(body(response, ErrorEnvelope).code, 'ORIGIN_NOT_ALLOWED')
    assert.lengthOf(await Stored.contacts(), 0)
  })
})
