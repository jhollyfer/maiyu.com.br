import { describe, expect, it } from 'vitest'

import { PLATFORM_ROLE } from '../../enums/platform-role.js'
import { USER_ROLES } from '../../enums/user-role.js'
import { ActorSchema } from './actor.validator.js'

// The roles belong to the project (extension point): the test reads whatever the project defines.
const [ROLE] = USER_ROLES

const tenant = { id: 't1', cityId: 'c1', role: ROLE, childIds: [] }

describe('ActorSchema', () => {
  it('when the account has a tenant or none, accepts it', () => {
    const withTenant = ActorSchema.safeParse({
      id: 'a1',
      email: 'ana@exemplo.com',
      phone: null,
      platformRole: PLATFORM_ROLE.USER,
      tenant,
      avatarId: 'f1',
    })
    const withoutTenant = ActorSchema.safeParse({
      id: 'a1',
      email: 'ana@exemplo.com',
      phone: null,
      platformRole: PLATFORM_ROLE.OWNER,
      tenant: null,
      avatarId: null,
    })

    expect(withTenant.success).toBe(true)
    expect(withoutTenant.success).toBe(true)
  })

  it("when the account is the platform's staff, accepts it (DECISIONS.md #404)", () => {
    const result = ActorSchema.safeParse({
      id: 'a1',
      email: 'equipe@exemplo.com',
      phone: null,
      platformRole: PLATFORM_ROLE.ADMINISTRATOR,
      tenant: null,
      avatarId: null,
    })

    expect(result.success).toBe(true)
  })

  it('when the account has only a phone, accepts it with a null email', () => {
    const result = ActorSchema.safeParse({
      id: 'a1',
      email: null,
      phone: '+5597991234567',
      platformRole: PLATFORM_ROLE.USER,
      tenant: null,
      avatarId: null,
    })

    expect(result.success).toBe(true)
  })

  it('when the tenant role is unknown to the application, rejects it', () => {
    const result = ActorSchema.safeParse({
      id: 'a1',
      email: 'ana@exemplo.com',
      phone: null,
      platformRole: PLATFORM_ROLE.USER,
      tenant: { ...tenant, role: '__not_a_role__' },
      avatarId: null,
    })

    expect(result.success).toBe(false)
  })

  it('when the input carries more than the actor, drops the extra fields', () => {
    const result = ActorSchema.safeParse({
      id: 'a1',
      email: 'ana@exemplo.com',
      phone: null,
      platformRole: PLATFORM_ROLE.USER,
      tenant: null,
      avatarId: null,
      password: 'segredo',
    })

    expect(result.data).toEqual({
      id: 'a1',
      email: 'ana@exemplo.com',
      phone: null,
      platformRole: PLATFORM_ROLE.USER,
      tenant: null,
      avatarId: null,
    })
  })
})
