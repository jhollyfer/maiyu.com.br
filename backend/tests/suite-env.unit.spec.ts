import { test } from '@japa/runner'

import env from '#start/env'
import { SuiteEnv } from '#tests/suite-env'

test.group('tests > suite-env (unit)', () => {
  test('quietDemo empties the demo key whatever it held', ({ assert }) => {
    env.set('SEED_DEMO_PASSWORD', 'a-password-from-the-shell-1')

    SuiteEnv.quietDemo()

    assert.equal(env.get('SEED_DEMO_PASSWORD'), '')
  })
})
