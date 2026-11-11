import { describe, expect, it } from 'vitest'

import { USER_ROLES } from '../../enums/user-role.js'
import { ActorSchema } from './actor.validator.js'

// The roles belong to the project (extension point): the test reads whatever the project defines.
const [ROLE] = USER_ROLES

describe('ActorSchema', () => {
  it('when the account has an avatar or not, accepts it', () => {
    const withoutAvatar = ActorSchema.safeParse({
      id: 'a1',
      email: 'ana@exemplo.com',
      role: ROLE,
      avatarId: null,
    })
    const withAvatar = ActorSchema.safeParse({
      id: 'a1',
      email: 'ana@exemplo.com',
      role: ROLE,
      avatarId: 'f1',
    })

    expect(withoutAvatar.success).toBe(true)
    expect(withAvatar.success).toBe(true)
  })

  it('when the role is unknown to the application, rejects it', () => {
    const result = ActorSchema.safeParse({
      id: 'a1',
      email: 'ana@exemplo.com',
      role: '__not_a_role__',
      avatarId: null,
    })

    expect(result.success).toBe(false)
  })

  it('when the input carries more than the actor, drops the extra fields', () => {
    const result = ActorSchema.safeParse({
      id: 'a1',
      email: 'ana@exemplo.com',
      role: ROLE,
      avatarId: null,
      password: 'segredo',
    })

    expect(result.data).toEqual({
      id: 'a1',
      email: 'ana@exemplo.com',
      role: ROLE,
      avatarId: null,
    })
  })
})
