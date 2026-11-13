import { test } from '@japa/runner'

import { Credential, CredentialSecret } from '#core/credential'

test.group('core > credential (unit)', () => {
  test('a human code is trimmed and upper-cased, so how it was typed does not matter', ({
    assert,
  }) => {
    assert.equal(Credential.normalize('  ab12cd '), 'AB12CD')
    assert.equal(Credential.normalize('ENR-2026-xy'), 'ENR-2026-XY')
  })

  test('a credential longer than the ceiling is no credential', ({
    assert,
  }) => {
    assert.equal(Credential.normalize('a'.repeat(Credential.MAX + 1)), '')
    assert.equal(Credential.normalize('a'.repeat(Credential.MAX)).length, 200)
  })

  test('a token splits into the locator that is stored in clear and the secret', ({
    assert,
  }) => {
    assert.deepEqual(CredentialSecret.split('abc123.s3cr3t-value'), {
      locator: 'abc123',
      secret: 's3cr3t-value',
    })
  })

  test('a token without both halves does not split', ({ assert }) => {
    for (const raw of [
      '',
      'abc',
      '.secret',
      'locator.',
      'a.b.c',
      ' . ',
      ' .s3cr3t',
      'a.' + 'b'.repeat(Credential.MAX),
    ])
      assert.isNull(CredentialSecret.split(raw), raw)
  })

  test('the stored form is the SHA-256 of the secret, never the secret', ({
    assert,
  }) => {
    const stored = CredentialSecret.digest('s3cr3t')

    assert.match(stored, /^[0-9a-f]{64}$/)
    assert.notInclude(stored, 's3cr3t')
    assert.equal(stored, CredentialSecret.digest('s3cr3t'))
  })

  test('only the right secret matches its hash', ({ assert }) => {
    const stored = CredentialSecret.digest('s3cr3t')

    assert.isTrue(CredentialSecret.matches('s3cr3t', stored))
    assert.isFalse(CredentialSecret.matches('s3cr3T', stored))
    assert.isFalse(CredentialSecret.matches('', stored))
  })

  test('no hash, or a hash that is not one, matches nothing, and still takes a comparison', ({
    assert,
  }) => {
    assert.isFalse(CredentialSecret.matches('s3cr3t', null))
    assert.isFalse(CredentialSecret.matches('s3cr3t', ''))
    assert.isFalse(CredentialSecret.matches('s3cr3t', 'not-hex'))
    assert.isFalse(
      CredentialSecret.matches(
        's3cr3t',
        CredentialSecret.digest('s3cr3t').slice(2),
      ),
    )
    // The placeholder the miss compares against is a digest like any other, and still no secret opens it.
    assert.isFalse(CredentialSecret.matches('no credential', null))
    assert.isFalse(CredentialSecret.matches('no credential', 'zz'))
  })
})
