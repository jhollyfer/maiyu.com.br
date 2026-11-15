import { describe, expect, it } from 'vitest'

import { PLATFORM_ROLE, PLATFORM_STAFF_ROLES } from './platform-role.js'

describe('PLATFORM_STAFF_ROLES', () => {
  it('is the owner and the platform administrator, and no one else', () => {
    expect([...PLATFORM_STAFF_ROLES].sort()).toEqual([
      PLATFORM_ROLE.ADMINISTRATOR,
      PLATFORM_ROLE.OWNER,
    ])
    expect(PLATFORM_STAFF_ROLES).not.toContain(PLATFORM_ROLE.USER)
  })
})
