import { AuthorizationResponse } from '@adonisjs/bouncer'
import { test } from '@japa/runner'

import { STAFF_USER_ROLES, USER_ROLE, type Actor } from '@maiyu/shared'

import ContactPolicy from '#policies/contact.policy'
import { pendingContact } from '#tests/contacts-unit-fixtures'

/**
 * The policy called directly, without route or Bouncer (`_standards/backend.md` §4.6). The
 * denial carries the key and the code, never a translated text.
 */
test.group('ContactPolicy > manage', () => {
  const policy = new ContactPolicy()
  const [role] = STAFF_USER_ROLES
  if (role === undefined) throw new Error('the project declares no staff role')

  const staff: Actor = {
    id: 'actor-1',
    email: 'staff@mail.com',
    role,
    avatarId: null,
  }
  const member: Actor = { ...staff, role: USER_ROLE.MEMBER }

  test('when the contact exists and the actor is staff, allows', ({
    assert,
  }) => {
    assert.isTrue(policy.manage(staff, pendingContact()))
  })

  test('when the contact is missing, denies with 404, the code and the key, untranslated', ({
    assert,
  }) => {
    const response = policy.manage(staff, null)

    if (!(response instanceof AuthorizationResponse))
      return assert.fail('expected a denial')

    assert.equal(response.status, 404)
    assert.equal(response.message, 'CONTACT_NOT_FOUND')
    assert.equal(response.translation?.identifier, 'contacts.not_found')
  })

  test('when the actor is not staff, denies with 403, the code and the key, untranslated', ({
    assert,
  }) => {
    const response = policy.manage(member, pendingContact())

    if (!(response instanceof AuthorizationResponse))
      return assert.fail('expected a denial')

    assert.equal(response.status, 403)
    assert.equal(response.message, 'CONTACT_FORBIDDEN')
    assert.equal(response.translation?.identifier, 'contacts.forbidden')
  })
})
