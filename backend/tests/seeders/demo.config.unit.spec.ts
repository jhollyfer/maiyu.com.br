import { test } from '@japa/runner'

import { DemoConfig } from '#database/demo/demo.config'
import { TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

test.group('DemoConfig', () => {
  test('a password under 16 characters is refused, 16 is accepted, and spaces do not count', ({
    assert,
  }) => {
    assert.isNotNull(DemoConfig.refusal('a'.repeat(15)))
    assert.isNull(DemoConfig.refusal('a'.repeat(16)))
    assert.isNotNull(DemoConfig.refusal(`  ${'a'.repeat(14)}  `))
  })

  test('the e-mail domain is demo. plus the host of the site, without the port', ({
    assert,
  }) => {
    assert.equal(
      DemoConfig.domain('https://app.example.com:8443/path'),
      'demo.app.example.com',
    )
    assert.equal(DemoConfig.domain('http://localhost:3000'), 'demo.localhost')
  })

  test('a role literal becomes the label of its e-mail, and a type the slug of its tenant', ({
    assert,
  }) => {
    assert.equal(DemoConfig.label('PLATFORM_OWNER'), 'platform-owner')
    assert.equal(
      DemoConfig.email('administrator', 'demo.example.com'),
      'administrator@demo.example.com',
    )
    assert.equal(
      DemoConfig.slug(TENANT_TYPE_FIXTURE),
      `demo-${TENANT_TYPE_FIXTURE.toLowerCase().replaceAll('_', '-')}`,
    )
  })
})
