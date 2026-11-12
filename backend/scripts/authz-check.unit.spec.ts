import { test } from '@japa/runner'

import { AuthzCheck } from './authz-check.ts'

import { ROLE_FIXTURES } from '#tests/role-fixtures'

test.group('authz:check > comparison with the baseline', () => {
  const check = new AuthzCheck()

  test('when the chain is equal, is not a finding', ({ assert }) => {
    const chain = {
      'GET /account': 'authenticated',
      'GET /storefront/notices': 'anonymous',
    }

    assert.deepEqual(check.compare(chain, { ...chain }), [])
  })

  test('when a role changes, is a §4.6 finding, in the baseline file', ({
    assert,
  }) => {
    const { staff } = ROLE_FIXTURES
    const [finding] = check.compare(
      { 'DELETE /administrator/notices/{id}': staff },
      { 'DELETE /administrator/notices/{id}': `${staff}, EDITOR` },
    )

    assert.equal(finding?.file, 'app/core/openapi/authz-baseline.json')
    assert.equal(finding?.rule, 'authorization-chain-changed')
    assert.equal(finding?.section, '4.6')
    assert.include(finding?.message ?? '', `${staff} -> ${staff}, EDITOR`)
  })

  test('when a route is new or removed, both are findings', ({ assert }) => {
    const findings = check.compare(
      { 'GET /a': 'anonymous' },
      { 'GET /b': 'authenticated' },
    )

    assert.lengthOf(findings, 2)
    assert.include(findings[0]?.message ?? '', 'removed route')
    assert.include(findings[1]?.message ?? '', 'new route')
  })
})
