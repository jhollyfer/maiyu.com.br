import { describe, expect, it } from 'vitest'

import { LOCALE } from '@maiyu/shared'

import { ProfilePending } from './profile-pending'

describe('ProfilePending.describe', () => {
  it('um campo sem rótulo aparece pelo nome cru, na ordem recebida', () => {
    expect(
      ProfilePending.describe(['campoSemRotulo', 'outroCampo'], {
        locale: LOCALE.PT_BR,
      }),
    ).toBe('campoSemRotulo, outroCampo')
  })

  it('o rótulo do projeto vence o nome cru', () => {
    expect(
      ProfilePending.describe(['pixKey', 'document'], {
        labels: { pixKey: 'a chave Pix' },
        locale: LOCALE.PT_BR,
      }),
    ).toBe('a chave Pix, document')
  })

  it('sem campos, o texto é vazio', () => {
    expect(ProfilePending.describe([], { locale: LOCALE.PT_BR })).toBe('')
  })
})
