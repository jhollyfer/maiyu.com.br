import i18nManager from '@adonisjs/i18n/services/main'
import { test } from '@japa/runner'

import { BASE_LOCALE } from '@maiyu/shared'

import { ProfileGateRefusal } from './_shared.profile-gate-refusal.ts'

const i18n = i18nManager.locale(BASE_LOCALE)

test.group('features > profile-gate-refusal (unit)', () => {
  test('a filled profile is not refused', ({ assert }) => {
    assert.isNull(ProfileGateRefusal.check({ pixKey: 'ana@mail.com' }, i18n))
  })

  test('a gap is 409 PROFILE_INCOMPLETE with the missing fields as the keys of errors', ({
    assert,
  }) => {
    const refusal = ProfileGateRefusal.check(
      { pixKey: null, document: '', name: 'Ana' },
      i18n,
    )

    assert.equal(refusal?.status, 409)
    assert.equal(refusal?.code, 'PROFILE_INCOMPLETE')
    assert.deepEqual(Object.keys(refusal?.errors ?? {}), ['pixKey', 'document'])
    assert.deepEqual(refusal?.toResponse(), {
      message: i18n.t('account.profile_incomplete'),
      status: 409,
      code: 'PROFILE_INCOMPLETE',
      errors: {
        pixKey: i18n.t('account.profile_incomplete_field'),
        document: i18n.t('account.profile_incomplete_field'),
      },
    })
  })
})
