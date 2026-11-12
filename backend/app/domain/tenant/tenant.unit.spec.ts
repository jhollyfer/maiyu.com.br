import { test } from '@japa/runner'

import { ACTIVE_STATUS } from '@maiyu/shared'

import { Tenant, type TenantFields } from '#domain/tenant/tenant.entity'
import { TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

const FIELDS: TenantFields = {
  name: 'Secretaria de Educação',
  slug: 'semed',
  type: TENANT_TYPE_FIXTURE,
  cityId: 'c1',
  parentId: null,
  status: ACTIVE_STATUS.ACTIVE,
}

const NOW = new Date('2026-11-11T12:00:00Z')

test.group('domain > tenant (unit)', () => {
  test('a tenant under a top-level parent is born', ({ assert }) => {
    const born = Tenant.create(
      { ...FIELDS, id: 't2', parentId: 't1', now: NOW },
      {
        parent: { parentId: null, cityId: 'c1', active: true },
        hasChildren: false,
      },
    )

    assert.isTrue(born.isRight())
  })

  // DECISIONS.md #390: one level only; the parent reads its children, and nobody reads grandchildren.
  test('a parent that has a parent is refused, at birth and on update', ({
    assert,
  }) => {
    const nested = {
      parent: { parentId: 't0', cityId: 'c1', active: true },
      hasChildren: false,
    }
    const born = Tenant.create(
      { ...FIELDS, id: 't2', parentId: 't1', now: NOW },
      nested,
    )
    assert.deepEqual(born.value, { code: 'TENANT_PARENT_NESTED' })

    const top = Tenant.create(
      { ...FIELDS, id: 't2', now: NOW },
      {
        parent: { parentId: null, cityId: 'c1', active: true },
        hasChildren: false,
      },
    )
    if (top.isLeft()) return assert.fail('a top-level tenant is born')
    const updated = top.value.update({ ...FIELDS, parentId: 't1' }, nested, NOW)
    assert.deepEqual(updated.value, { code: 'TENANT_PARENT_NESTED' })
  })

  test('a tenant with children cannot get a parent, nor be its own', ({
    assert,
  }) => {
    const top = Tenant.create(
      { ...FIELDS, id: 't1', now: NOW },
      {
        parent: { parentId: null, cityId: 'c1', active: true },
        hasChildren: false,
      },
    )
    if (top.isLeft()) return assert.fail('a top-level tenant is born')

    const withChildren = top.value.update(
      { ...FIELDS, parentId: 't9' },
      {
        parent: { parentId: null, cityId: 'c1', active: true },
        hasChildren: true,
      },
      NOW,
    )
    const ownParent = top.value.update(
      { ...FIELDS, parentId: 't1' },
      {
        parent: { parentId: null, cityId: 'c1', active: true },
        hasChildren: false,
      },
      NOW,
    )

    assert.deepEqual(withChildren.value, { code: 'TENANT_PARENT_NESTED' })
    assert.deepEqual(ownParent.value, { code: 'TENANT_PARENT_NESTED' })
  })

  // The verifier's finding 4: a parent in another city, or an inactive one, is refused.
  test('a parent of another city or inactive is refused', ({ assert }) => {
    const elsewhere = Tenant.create(
      { ...FIELDS, id: 't2', parentId: 't1', now: NOW },
      {
        parent: { parentId: null, cityId: 'c9', active: true },
        hasChildren: false,
      },
    )
    const inactive = Tenant.create(
      { ...FIELDS, id: 't2', parentId: 't1', now: NOW },
      {
        parent: { parentId: null, cityId: 'c1', active: false },
        hasChildren: false,
      },
    )

    assert.deepEqual(elsewhere.value, { code: 'TENANT_PARENT_ELSEWHERE' })
    assert.deepEqual(inactive.value, { code: 'TENANT_PARENT_ELSEWHERE' })
  })

  // The children are of the parent's city (`TENANT_PARENT_ELSEWHERE`): moving the parent would
  // leave them under one that is no longer there.
  test('a tenant with children does not move to another city', ({ assert }) => {
    const tenant = Tenant.restore({
      ...FIELDS,
      id: 't1',
      createdAt: NOW,
      updatedAt: null,
    })
    const hierarchy = { parent: null, hasChildren: true }

    const moved = tenant.update({ ...FIELDS, cityId: 'c9' }, hierarchy, NOW)
    const stayed = tenant.update({ ...FIELDS, name: 'Outro' }, hierarchy, NOW)

    assert.deepEqual(moved.value, { code: 'TENANT_HAS_CHILDREN' })
    assert.isTrue(stayed.isRight())
  })
})
