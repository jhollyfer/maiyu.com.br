import { test } from '@japa/runner'

import { CityResponse, ErrorEnvelope } from '@maiyu/shared'

import {
  authenticateAsAdministrator,
  authenticateAsPlatformOwner,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

const CITY = {
  name: 'São Paulo de Olivença',
  state: 'AM',
  slug: 'sao-paulo-de-olivenca',
  timeZone: 'America/Eirunepe',
  latitude: -3.38,
  longitude: -68.87,
  south: -3.4,
  west: -68.9,
  north: -3.36,
  east: -68.85,
}

test.group('platform/cities > create', (group) => {
  group.each.setup(() => resetDatabase())

  test('the platform owner registers a city', async ({ client, assert }) => {
    const session = await authenticateAsPlatformOwner(client)

    const response = await client
      .post('/platform/cities')
      .cookies(session)
      .json(CITY)

    response.assertStatus(201)
    assert.equal(body(response, CityResponse).slug, CITY.slug)
  })

  test("a tenant's administrator is 403", async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/platform/cities')
      .cookies(session)
      .json(CITY)

    response.assertStatus(403)
  })

  test('a language prefix as slug is 422, and a seeded slug is 409', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsPlatformOwner(client)

    const reserved = await client
      .post('/platform/cities')
      .cookies(session)
      .json({ ...CITY, slug: 'pt-br' })
    const taken = await client
      .post('/platform/cities')
      .cookies(session)
      .json({ ...CITY, slug: 'tabatinga' })

    reserved.assertStatus(422)
    taken.assertStatus(409)
    assert.equal(body(taken, ErrorEnvelope).code, 'CITY_SLUG_TAKEN')
  })
})
