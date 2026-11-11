import { test } from '@japa/runner'

import { DOCUMENTATION_CSP } from '#core/openapi/scalar'
import {
  authenticateAsAdministrator,
  authenticateAsNonStaff,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

/**
 * `GET /documentation`: the browsable reference over `/openapi.json`. Same
 * protection as the document it reads - for whoever does not operate, the route does not exist.
 */
test.group('reference > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('the reference page is served as HTML to the operator', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const response = await client.get('/documentation').cookies(session)

    response.assertStatus(200)
    assert.include(response.header('content-type') ?? '', 'text/html')
    assert.include(response.text(), '/openapi.json')
  })

  test('the page carries its own CSP, not the closed one of the API', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const response = await client.get('/documentation').cookies(session)

    response.assertStatus(200)
    assert.equal(response.header('content-security-policy'), DOCUMENTATION_CSP)
  })

  test('the rest of the API answers with the closed CSP', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/health-check')

    response.assertStatus(200)
    assert.include(
      response.header('content-security-policy') ?? '',
      "default-src 'none'",
    )
  })

  test('without a session responds 404, not 401 nor 403', async ({
    client,
  }) => {
    const response = await client.get('/documentation').redirects(0)

    response.assertStatus(404)
  })

  test('whoever does not operate the installation also gets 404', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsNonStaff(client)
    const response = await client.get('/documentation').cookies(session)

    response.assertStatus(404)
    assert.equal(body(response).code, 'RESOURCE_NOT_FOUND')
  })
})
