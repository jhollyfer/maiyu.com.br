import { test } from '@japa/runner'

import Tenant from '#models/tenant'
import User from '#models/user'
import env from '#start/env'
import { resetDatabase } from '#tests/http-fixtures'

/**
 * The suite starts with the demonstration off (`tests/suite-env.ts`, DECISIONS.md #802), even with
 * `SEED_DEMO_PASSWORD` exported in the shell or set in `.env`: the seed of `resetDatabase` then
 * leaves no demo row. Proof: run the functional suite with the key exported.
 */
test.group('tests > suite env', (group) => {
  group.each.setup(() => resetDatabase())

  test('the demo key is empty when the suite starts and the seed creates no demo row', async ({
    assert,
  }) => {
    assert.equal((env.get('SEED_DEMO_PASSWORD') ?? '').trim(), '')
    assert.lengthOf(await Tenant.query().where('demo', true), 0)
    assert.lengthOf(await User.query().where('email', 'like', '%@demo.%'), 0)
  })
})
