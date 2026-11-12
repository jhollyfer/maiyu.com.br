import { isRedirect } from '@tanstack/react-router'
import { expect, test, vi } from 'vitest'

import { USER_ROLE } from '@maiyu/shared'

import { AreaCapability } from './area-capability'

vi.mock('#/lib/areas', () => ({
  homeOf: (role: string) => ({ to: `/home-${role.toLowerCase()}` }),
}))

test('o papel da área passa sem desvio', () => {
  expect(() =>
    AreaCapability.require({ role: USER_ROLE.ADMINISTRATOR }, [
      USER_ROLE.ADMINISTRATOR,
    ]),
  ).not.toThrow()
})

test('papel de fora volta para a casa da própria conta', () => {
  let thrown: unknown

  try {
    // The one role the kit guarantees (`shared/src/enums/user-role.ts`), in an area that admits none.
    AreaCapability.require({ role: USER_ROLE.ADMINISTRATOR }, [])
  } catch (error) {
    thrown = error
  }

  // Um `redirect` do router, e não um erro qualquer: é o que o `beforeLoad`
  // transforma em navegação antes de a rota carregar.
  expect(isRedirect(thrown)).toBe(true)
  if (isRedirect(thrown)) expect(thrown.options.to).toBe('/home-administrator')
})
