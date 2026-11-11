import { test } from '@japa/runner'

import { UploadParts } from './_shared.parts.ts'

test.group('storages/_shared > partes (unit)', () => {
  test('every part has the full size, except the last, which takes the rest', ({
    assert,
  }) => {
    assert.equal(UploadParts.sizeOf(25, 10, 1), 10)
    assert.equal(UploadParts.sizeOf(25, 10, 2), 10)
    assert.equal(UploadParts.sizeOf(25, 10, 3), 5)
  })

  test('a single-part file has the size of the file', ({ assert }) => {
    assert.equal(UploadParts.sizeOf(7, 10, 1), 7)
  })

  test('sized pairs number and size', ({ assert }) => {
    assert.deepEqual(UploadParts.sized([2, 3], 25, 10), [
      { partNumber: 2, size: 10 },
      { partNumber: 3, size: 5 },
    ])
  })
})
