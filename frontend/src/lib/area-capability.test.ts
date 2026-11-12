import { isRedirect } from '@tanstack/react-router'
import { expect, test, vi } from 'vitest'

import { PLATFORM_ROLES, STAFF_USER_ROLES } from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

import { AreaCapability } from './area-capability'
import type { AreaAccount } from './area-capability'

// The tenant roles are the project's (`shared/src/enums/user-role.ts`): the spec reads one, never names it.
const [staff] = STAFF_USER_ROLES
if (!staff) throw new Error('STAFF_USER_ROLES has no member')
const [platform] = PLATFORM_ROLES
if (!platform) throw new Error('PLATFORM_ROLES has no member')

vi.mock('#/lib/areas', () => ({
  homeOf: (account: { platformRole: string }) => ({
    to: `/home-${account.platformRole.toLowerCase()}`,
  }),
}))

const member = (platformRole: PlatformRole): AreaAccount => ({
  platformRole,
  tenant: { id: 't', cityId: 'c', role: staff, childIds: [] },
})
const customer = (platformRole: PlatformRole): AreaAccount => ({
  platformRole,
  tenant: null,
})

function thrownBy(run: () => void): unknown {
  try {
    run()
  } catch (error) {
    return error
  }
  return undefined
}

test('o papel no tenant da área passa sem desvio', () => {
  expect(() =>
    AreaCapability.require(member(platform), { tenant: [staff] }),
  ).not.toThrow()
})

test('o papel de plataforma da área passa, com ou sem vínculo', () => {
  expect(() =>
    AreaCapability.require(customer(platform), { platform: [platform] }),
  ).not.toThrow()
})

test('papel de fora volta para a casa da própria conta', () => {
  const thrown = thrownBy(() =>
    AreaCapability.require(member(platform), { tenant: [] }),
  )

  // Um `redirect` do router, e não um erro qualquer: é o que o `beforeLoad`
  // transforma em navegação antes de a rota carregar.
  expect(isRedirect(thrown)).toBe(true)
  if (isRedirect(thrown))
    expect(thrown.options.to).toBe(`/home-${platform.toLowerCase()}`)
})

test('o cliente final, sem vínculo, não entra em área só de papel de tenant', () => {
  expect(
    isRedirect(
      thrownBy(() =>
        AreaCapability.require(customer(platform), { tenant: [staff] }),
      ),
    ),
  ).toBe(true)
})
