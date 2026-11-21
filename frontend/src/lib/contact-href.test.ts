import { describe, expect, it } from 'vitest'

import { ContactHref } from './contact-href'

describe('ContactHref', () => {
  it('e-mail vira mailto sem espaço nas pontas', () => {
    expect(ContactHref.email(' ana@mail.com ')).toBe('mailto:ana@mail.com')
  })

  it('telefone sai sem máscara e guarda o + do país', () => {
    expect(ContactHref.phone('+55 (97) 99999-9999')).toBe('tel:+5597999999999')
    expect(ContactHref.phone('(97) 99999-9999')).toBe('tel:97999999999')
  })
})
