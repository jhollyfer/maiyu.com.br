import { test } from '@japa/runner'

import ErrorMessage from '#core/error-message'

test.group('core > error message', () => {
  test('when the value is an Error, returns its message', ({ assert }) => {
    assert.equal(ErrorMessage.of(new Error('bucket offline')), 'bucket offline')
  })

  test('when the value is not an Error, returns it as text', ({ assert }) => {
    assert.equal(ErrorMessage.of('timeout'), 'timeout')
    assert.equal(ErrorMessage.of(42), '42')
  })
})
