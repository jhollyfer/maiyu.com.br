import { test } from '@japa/runner'

import EnvBlocks from '#core/env-blocks'

const OFF = {
  SMTP_HOST: '',
  MAIL_FROM: '',
  SMTP_PORT: undefined,
} as const

test.group('core > env blocks', () => {
  test('when every block is empty, nothing is required and the boot goes on', ({
    assert,
  }) => {
    assert.deepEqual(
      EnvBlocks.problems((key) => OFF[key]),
      [],
    )
  })

  test('when the trigger key has a value, the rest of its block is required', ({
    assert,
  }) => {
    const values = { ...OFF, SMTP_HOST: 'smtp.example.com' }

    assert.deepEqual(
      EnvBlocks.problems((key) => values[key]),
      [
        'mail: SMTP_HOST is set, so MAIL_FROM is required',
        'mail: SMTP_HOST is set, so SMTP_PORT is required',
      ],
    )
  })

  test('when the whole block has values, it is complete', ({ assert }) => {
    const values = {
      ...OFF,
      SMTP_HOST: 'smtp.example.com',
      MAIL_FROM: 'no-reply@example.com',
      SMTP_PORT: 587,
    }

    assert.deepEqual(
      EnvBlocks.problems((key) => values[key]),
      [],
    )
  })

  test('a blank value counts as empty', ({ assert }) => {
    const values = { ...OFF, SMTP_HOST: 'smtp.example.com', MAIL_FROM: '   ' }

    assert.deepEqual(
      EnvBlocks.problems((key) => values[key]),
      [
        'mail: SMTP_HOST is set, so MAIL_FROM is required',
        'mail: SMTP_HOST is set, so SMTP_PORT is required',
      ],
    )
  })

  test('a trigger of only spaces is off, the same as `config/mail.ts` reads it', ({
    assert,
  }) => {
    const values = { ...OFF, SMTP_HOST: '   ' }

    assert.deepEqual(
      EnvBlocks.problems((key) => values[key]),
      [],
    )
  })

  test('assert stops the boot naming every empty key', ({ assert }) => {
    const values = { ...OFF, SMTP_HOST: 'smtp.example.com' }

    assert.throws(
      () => EnvBlocks.assert((key) => values[key]),
      /Incomplete environment blocks.*MAIL_FROM.*SMTP_PORT/s,
    )
  })

  test('a key without trigger set never fails the boot', ({ assert }) => {
    const values = { ...OFF, MAIL_FROM: 'no-reply@example.com' }

    assert.doesNotThrow(() => EnvBlocks.assert((key) => values[key]))
  })
})
