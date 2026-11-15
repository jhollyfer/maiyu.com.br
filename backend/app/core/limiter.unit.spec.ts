import { test } from '@japa/runner'

import { LimiterKey } from '#start/limiter.base'

test.group('start/limiter.base > LimiterKey (unit)', () => {
  test('the account key is the same for any case and spacing of the e-mail', ({
    assert,
  }) => {
    assert.equal(
      LimiterKey.account('  Ana@Escola.COM '),
      LimiterKey.account('ana@escola.com'),
    )
  })

  test('the account key is the same for a phone with or without mask and +55', ({
    assert,
  }) => {
    assert.equal(
      LimiterKey.account('(97) 99123-4567'),
      LimiterKey.account('+5597991234567'),
    )
  })

  test('the account key never holds the e-mail in clear text', ({ assert }) => {
    const key = LimiterKey.account('ana@escola.com')

    assert.match(key ?? '', /^signin:[0-9a-f]{64}$/)
    assert.notInclude(key ?? '', 'ana')
  })

  test('the account bucket by id is the same for every login of the account', ({
    assert,
  }) => {
    const key = LimiterKey.accountOf('u1')

    assert.equal(key, LimiterKey.accountOf('u1'))
    assert.notEqual(key, LimiterKey.accountOf('u2'))
    assert.notEqual(key, LimiterKey.account('ana@escola.com'))
  })

  test('without a usable e-mail there is no account key', ({ assert }) => {
    assert.isNull(LimiterKey.account(undefined))
    assert.isNull(LimiterKey.account(42))
    assert.isNull(LimiterKey.account('   '))
  })

  test('the refresh key is one bucket per token, without the token in clear text', ({
    assert,
  }) => {
    const key = LimiterKey.refresh('oat_abc.def')

    assert.match(key ?? '', /^refresh:[0-9a-f]{64}$/)
    assert.notInclude(key ?? '', 'oat_abc')
    assert.equal(key, LimiterKey.refresh('oat_abc.def'))
    assert.notEqual(key, LimiterKey.refresh('oat_abc.deg'))
  })

  test('without a refresh cookie there is no token key', ({ assert }) => {
    assert.isNull(LimiterKey.refresh(undefined))
    assert.isNull(LimiterKey.refresh(''))
  })

  test('the per-user key carries the scope, so quotas do not mix', ({
    assert,
  }) => {
    assert.equal(LimiterKey.user('upload', { id: 'u1' }), 'upload:u1')
    assert.notEqual(
      LimiterKey.user('upload', { id: 'u1' }),
      LimiterKey.user('account', { id: 'u1' }),
    )
  })

  test('without a session there is no per-user key', ({ assert }) => {
    assert.isNull(LimiterKey.user('upload', undefined))
  })

  test('the credential key is the same for any case and spacing of the code', ({
    assert,
  }) => {
    assert.equal(
      LimiterKey.credential('turma', '  ab12cd '),
      LimiterKey.credential('turma', 'AB12CD'),
    )
  })

  test('the credential key never holds the credential in clear text, and carries the kind', ({
    assert,
  }) => {
    const key = LimiterKey.credential('convite', 'abc123.s3cr3t')

    assert.match(key ?? '', /^credential:convite:[0-9a-f]{64}$/)
    assert.notInclude(key ?? '', 's3cr3t')
    assert.notEqual(key, LimiterKey.credential('turma', 'abc123.s3cr3t'))
  })

  test('without a usable credential there is no per-credential key', ({
    assert,
  }) => {
    assert.isNull(LimiterKey.credential('turma', undefined))
    assert.isNull(LimiterKey.credential('turma', 42))
    assert.isNull(LimiterKey.credential('turma', '   '))
  })
})
