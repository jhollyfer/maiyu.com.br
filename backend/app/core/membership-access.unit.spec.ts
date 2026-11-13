import { test } from '@japa/runner'

import { STAFF_USER_ROLES, USER_ROLES, type UserRole } from '@maiyu/shared'

import MembershipAccess from '#core/membership-access'
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'

const staff: UserRole = ROLE_FIXTURES.staff
const nonStaff = ROLE_FIXTURES.nonStaff

/**
 * When a membership write ends the account's sessions (DECISIONS.md #581): only when the grant
 * gets smaller. A session signed in under a bigger access must not keep it, but a new or bigger
 * grant takes nothing away, and ending the session there signs out whoever just joined.
 */
test.group('core > membership-access (unit)', () => {
  test('a new membership reduces nothing', ({ assert }) => {
    assert.isFalse(MembershipAccess.reduces(null, { role: staff }))
    assert.isFalse(
      MembershipAccess.reduces(null, { role: staff, active: false }),
    )
  })

  test('removing a membership reduces', ({ assert }) => {
    assert.isTrue(MembershipAccess.reduces({ role: staff }, null))
    assert.isTrue(MembershipAccess.reduces({ role: nonStaff ?? staff }, null))
  })

  test('deactivating a membership reduces', ({ assert }) => {
    assert.isTrue(
      MembershipAccess.reduces({ role: staff }, { role: staff, active: false }),
    )
  })

  test('activating one that was off, or keeping it off, reduces nothing', ({
    assert,
  }) => {
    const off = { role: staff, active: false }
    assert.isFalse(MembershipAccess.reduces(off, { role: staff }))
    assert.isFalse(MembershipAccess.reduces(off, off))
    assert.isFalse(
      MembershipAccess.reduces(off, { role: nonStaff ?? staff, active: false }),
    )
  })

  test('the same role again reduces nothing', ({ assert }) => {
    for (const role of USER_ROLES)
      assert.isFalse(MembershipAccess.reduces({ role }, { role }))
  })

  test('from staff to a role outside the staff reduces', ({ assert }) => {
    if (nonStaff === null) return assert.fail(NO_NON_STAFF_ROLE)

    assert.isTrue(MembershipAccess.reduces({ role: staff }, { role: nonStaff }))
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test('from a role outside the staff to staff raises, and does not reduce', ({
    assert,
  }) => {
    if (nonStaff === null) return assert.fail(NO_NON_STAFF_ROLE)

    assert.isFalse(
      MembershipAccess.reduces({ role: nonStaff }, { role: staff }),
    )
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test('a change it cannot rank counts as a reduction, the side that signs out', ({
    assert,
  }) => {
    for (const from of USER_ROLES)
      for (const to of USER_ROLES)
        if (
          from !== to &&
          STAFF_USER_ROLES.includes(from) === STAFF_USER_ROLES.includes(to)
        )
          assert.isTrue(MembershipAccess.reduces({ role: from }, { role: to }))
  })

  /**
   * The skeleton has one role on each side, so the test above ranks nothing there. A project has
   * more: two staff roles and two outside it, handed as the staff set the rule ranks by.
   */
  test('with a wider set of roles, two on the same side count as a reduction in both directions', ({
    assert,
  }) => {
    const staffSet = ['COORDINATOR', 'TEACHER']
    const reduces = (from: string, to: string) =>
      MembershipAccess.reduces({ role: from }, { role: to }, staffSet)

    assert.isTrue(reduces('COORDINATOR', 'TEACHER'))
    assert.isTrue(reduces('TEACHER', 'COORDINATOR'))
    assert.isTrue(reduces('STUDENT', 'GUEST'))
    assert.isTrue(reduces('GUEST', 'STUDENT'))
    // The sides still rank: up to staff raises, down from it reduces.
    assert.isFalse(reduces('STUDENT', 'TEACHER'))
    assert.isTrue(reduces('TEACHER', 'STUDENT'))
  })
})
