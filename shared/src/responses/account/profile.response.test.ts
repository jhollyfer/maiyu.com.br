import { describe, expect, it } from 'vitest'

import { AccountProfileShowResponse } from './profile.response.js'

describe('AccountProfileShowResponse', () => {
  it('when given the account with a password or hash, it drops them', () => {
    const result = AccountProfileShowResponse.parse({
      id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
      name: 'Ana',
      email: 'ana@exemplo.com',
      phone: null,
      platformRole: 'USER',
      avatar: null,
      tenant: null,
      password: '$argon2id$segredo',
    })

    expect(result).toEqual({
      id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
      name: 'Ana',
      email: 'ana@exemplo.com',
      phone: null,
      platformRole: 'USER',
      avatar: null,
      tenant: null,
    })
  })
})
