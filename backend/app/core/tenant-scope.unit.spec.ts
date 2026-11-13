import { test } from '@japa/runner'

import { PLATFORM_ROLE } from '@maiyu/shared'
import type { PlatformRole, UserRole } from '@maiyu/shared'

import { TenantScope } from '#core/tenant-scope'
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'

test.group('TenantScope', () => {
  test('a public scope reads the URL tenant and writes nothing', ({
    assert,
  }) => {
    const one = TenantScope.ofPublic('t1', [])
    assert.isTrue(one.canRead('t1'))
    assert.isFalse(one.canWrite('t1'))

    const city = TenantScope.ofPublic(null, ['t1', 't2'])
    assert.isTrue(city.canRead('t2'))
    assert.isFalse(city.canWrite(null))
    // A city-wide public route never reaches the platform's rows (tenant_id null).
    assert.isFalse(city.canRead(null))
  })

  test('a session scope writes its own tenant and only reads the children', ({
    assert,
  }) => {
    const scope = TenantScope.ofAccess({
      id: 'a1',
      platformRole: 'USER',
      tenant: {
        id: 'parent',
        cityId: 'c1',
        role: ROLE_FIXTURES.staff,
        childIds: ['child'],
      },
    })
    assert.isTrue(scope.canWrite('parent'))
    assert.isTrue(scope.canRead('child'))
    assert.isFalse(scope.canWrite('child'))
  })

  test('without a membership the scope owns nothing; the platform owner owns the platform rows', ({
    assert,
  }) => {
    const none = TenantScope.ofAccess({
      id: 'a1',
      platformRole: 'USER',
      tenant: null,
    })
    assert.isFalse(none.canRead(null))
    assert.isFalse(none.canWrite(null))

    const owner = TenantScope.ofAccess({
      id: 'o1',
      platformRole: 'OWNER',
      tenant: null,
    })
    assert.isTrue(owner.canRead(null))
    assert.isTrue(owner.canWrite(null))
    assert.isFalse(owner.canRead('t1'))
  })

  // DECISIONS.md #404: `PLATFORM_STAFF_ROLES` is OWNER and ADMINISTRATOR. Without this, the platform
  // ADMINISTRATOR could lose the flag (the list is the only place that says who it is) and nothing
  // in a project without the Pix, the only feature that reads it, would notice.
  test('the platform staff flag is set for the owner and the platform administrator, and for no one else', ({
    assert,
  }) => {
    const flag = (platformRole: PlatformRole) =>
      TenantScope.ofAccess({ id: 'a1', platformRole, tenant: null })
        .platformStaff

    assert.isTrue(flag(PLATFORM_ROLE.OWNER))
    assert.isTrue(flag(PLATFORM_ROLE.ADMINISTRATOR))
    assert.isFalse(flag(PLATFORM_ROLE.USER))
  })

  test('the platform administrator is staff in every scope the account can end up in, and reaches no tenant row', ({
    assert,
  }) => {
    const administrator = {
      id: 'a1',
      platformRole: PLATFORM_ROLE.ADMINISTRATOR,
    }
    const member = TenantScope.ofAccess({
      ...administrator,
      tenant: {
        id: 't1',
        cityId: 'c1',
        role: ROLE_FIXTURES.staff,
        childIds: [],
      },
    })
    const picking = TenantScope.ofAccess(
      { ...administrator, tenant: null },
      true,
    )
    const customer = TenantScope.ofAccess({ ...administrator, tenant: null })

    assert.isTrue(member.platformStaff)
    assert.isTrue(picking.platformStaff)
    assert.isTrue(customer.platformStaff)
    // Staff of the platform is not the owner: the platform's own rows stay the owner's.
    assert.isFalse(customer.canRead(null))
    assert.isFalse(customer.canWrite(null))
  })

  // DECISIONS.md #397: the account with no membership is a customer. It reads none of a tenant's
  // rows; in a customer table it reads and writes only the rows it owns, in any tenant, and a new
  // one goes to the tenant the URL names.
  test('a customer owns its rows in a customer table and nothing of the tenant', ({
    assert,
  }) => {
    const customer = TenantScope.ofCustomer('a1', 't1')
    assert.isFalse(customer.canRead('t1'))
    assert.isFalse(customer.canWrite('t1'))
    assert.deepEqual(customer.tenantIds(), [])

    assert.isTrue(customer.canReadOwned('t2', 'a1'))
    assert.isTrue(customer.canWriteOwned('t2', 'a1'))
    assert.isFalse(customer.canReadOwned('t1', 'a2'))
    assert.isFalse(customer.canReadOwned('t1', null))
    assert.deepEqual(customer.customerTarget(), {
      tenantId: 't1',
      customerId: 'a1',
    })

    // Without a tenant in the URL the customer only reads its own rows.
    assert.isNull(TenantScope.ofCustomer('a1', null).customerTarget())
  })

  // The verifier's findings 1 and 2: a plain member, and the staff of a parent tenant, are not the
  // staff that serves a customer's row.
  test("only the staff of the row's own tenant reaches a customer's row", ({
    assert,
  }) => {
    const { nonStaff } = ROLE_FIXTURES
    if (nonStaff === null)
      return assert.fail('the project has a non-staff role')
    const access = (role: UserRole) =>
      TenantScope.ofAccess({
        id: 'm1',
        platformRole: 'USER',
        tenant: { id: 't1', cityId: 'c1', role, childIds: ['child'] },
      })
    const staff = access(ROLE_FIXTURES.staff)
    const member = access(nonStaff)

    assert.isTrue(staff.canReadOwned('t1', 'a1'))
    assert.isTrue(staff.canWriteOwned('t1', 'a1'))
    assert.isFalse(staff.canReadOwned('child', 'a1'))
    assert.isTrue(staff.canReadOwned('child', null))
    assert.isFalse(member.canReadOwned('t1', 'a1'))
    assert.isFalse(member.canWriteOwned('t1', 'a1'))
    assert.isTrue(member.canReadOwned('t1', null))
    assert.isTrue(member.canReadOwned('t2', 'm1'))
    assert.deepEqual(member.customerTarget(), {
      tenantId: 't1',
      customerId: null,
    })
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("the public never reaches a customer's row", ({ assert }) => {
    const visitor = TenantScope.ofPublic('t1', [])
    assert.isTrue(visitor.canReadOwned('t1', null))
    assert.isFalse(visitor.canReadOwned('t1', 'a1'))
    assert.isNull(visitor.customerTarget())
  })

  // Finding 5: an account with memberships and no pick is not a customer; it reaches nothing.
  test('an account with memberships and no pick reaches nothing until it picks', ({
    assert,
  }) => {
    const undecided = TenantScope.ofAccess(
      { id: 'a1', platformRole: 'USER', tenant: null },
      true,
    )

    assert.isFalse(undecided.customer)
    assert.isFalse(undecided.canReadOwned('t1', 'a1'))
    assert.isNull(undecided.customerTarget())
  })

  // Finding 3: a customer and a declared public write create no row of a tenant table.
  test('only a member or the platform owner gets a tenant-table target', ({
    assert,
  }) => {
    assert.isNull(TenantScope.ofCustomer('a1', 't1').tenantTarget())
    assert.isNull(
      TenantScope.ofPublic('t1', [], { inserts: true }).tenantTarget(),
    )
    assert.deepEqual(
      TenantScope.ofAccess({
        id: 'm1',
        platformRole: 'USER',
        tenant: {
          id: 't1',
          cityId: 'c1',
          role: ROLE_FIXTURES.staff,
          childIds: [],
        },
      }).tenantTarget(),
      { tenantId: 't1' },
    )
  })

  test('a declared public write inserts into the URL tenant and changes no row', ({
    assert,
  }) => {
    const writer = TenantScope.ofPublic('t1', [], { inserts: true })
    assert.deepEqual(writer.customerTarget(), {
      tenantId: 't1',
      customerId: null,
    })
    assert.isFalse(writer.canWrite('t1'))
    assert.isFalse(writer.canWriteOwned('t1', null))

    // A city-wide public route names no tenant, so it has nowhere to write.
    assert.isNull(
      TenantScope.ofPublic(null, ['t1'], { inserts: true }).customerTarget(),
    )
  })
})
