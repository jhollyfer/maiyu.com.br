import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { PLATFORM_ROLES, STAFF_USER_ROLES } from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

import { AreaCapability } from './area-capability'
import type { AreaAccount } from './area-capability'

// The tenant roles are the project's (`shared/src/enums/user-role.ts`): the spec reads one, never names it.
const [staff] = STAFF_USER_ROLES
if (!staff) throw new Error('STAFF_USER_ROLES has no member')
const [platform] = PLATFORM_ROLES
if (!platform) throw new Error('PLATFORM_ROLES has no member')

const member = (platformRole: PlatformRole): AreaAccount => ({
  platformRole,
  tenant: { role: staff },
})
const customer = (platformRole: PlatformRole): AreaAccount => ({
  platformRole,
  tenant: null,
})

test('allows lê a tabela da área: papel no tenant ou papel de plataforma', () => {
  expect(AreaCapability.allows(member(platform), { tenant: [staff] })).toBe(
    true,
  )
  expect(
    AreaCapability.allows(customer(platform), { platform: [platform] }),
  ).toBe(true)
  expect(AreaCapability.allows(customer(platform), { tenant: [staff] })).toBe(
    false,
  )
  expect(AreaCapability.allows(member(platform), { tenant: [] })).toBe(false)
  expect(AreaCapability.allows(member(platform), {})).toBe(false)
})

test('não importa nada de #/lib/areas: o homeOf do projeto usa AreaCapability sem ciclo', () => {
  // O `homeOf` do projeto pode decidir a casa com `AreaCapability.allows`; um import de volta,
  // mesmo de tipo, convida o ciclo em runtime que a régua proíbe (DECISIONS.md #764).
  const source = readFileSync(
    join(import.meta.dirname, 'area-capability.ts'),
    'utf8',
  )

  expect(source).not.toMatch(/from\s+['"](?:#\/lib\/areas|\.\/areas)['"]/)
})
