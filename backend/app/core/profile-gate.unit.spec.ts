import { test } from '@japa/runner'

import ProfileGate from '#core/profile-gate'

test.group('core > profile-gate (unit)', () => {
  test('a filled profile misses nothing', ({ assert }) => {
    assert.deepEqual(
      ProfileGate.missing({ pixKey: 'ana@mail.com', birthDate: '2000-01-31' }),
      [],
    )
  })

  test('null, undefined, blank text and an empty list are missing, in the order declared', ({
    assert,
  }) => {
    assert.deepEqual(
      ProfileGate.missing({
        pixKey: null,
        document: undefined,
        address: '   ',
        phones: [],
        name: 'Ana',
      }),
      ['pixKey', 'document', 'address', 'phones'],
    )
  })

  test('zero, false and a list with items are values, not gaps', ({
    assert,
  }) => {
    assert.deepEqual(
      ProfileGate.missing({ capacity: 0, accepts: false, phones: ['9'] }),
      [],
    )
  })

  test('no fields declared misses nothing', ({ assert }) => {
    assert.deepEqual(ProfileGate.missing({}), [])
  })
})
