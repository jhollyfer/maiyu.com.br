import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

import LegacyAwareHashDriver from '#core/legacy-aware-hash-driver'

const PASSWORD = 'Senha@123'

test.group('core > legacy aware hash driver', () => {
  test('when the hash is scrypt, verifies the right password and asks for a rehash', async ({
    assert,
  }) => {
    const hasher = LegacyAwareHashDriver.hasher()
    const legacy = await hash.use('scrypt').make(PASSWORD)

    assert.isTrue(await hasher.verify(legacy, PASSWORD))
    assert.isFalse(await hasher.verify(legacy, 'Errada@123'))
    assert.isTrue(hasher.needsReHash(legacy))
  })

  test('when the hash is the current one, verifies it and asks for nothing', async ({
    assert,
  }) => {
    const hasher = LegacyAwareHashDriver.hasher()
    const current = await hash.make(PASSWORD)

    assert.isTrue(await hasher.verify(current, PASSWORD))
    assert.isFalse(hasher.needsReHash(current))
  })

  test('when it makes a hash, writes with the default driver', async ({
    assert,
  }) => {
    const made = await LegacyAwareHashDriver.hasher().make(PASSWORD)

    assert.isTrue(hash.use().isValidHash(made))
    assert.isFalse(hash.use('scrypt').isValidHash(made))
  })
})
