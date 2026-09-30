import { describe, expect, it } from 'vitest'

import {
  CareerApplicationCreateValidator,
  ContactCreateValidator,
} from './validator'

/**
 * O que o schema **decide**, não o que o VineJS faz: o piso da mensagem, o
 * LinkedIn opcional que chega como texto vazio e a vaga fora da lista. Formato
 * de e-mail fica de fora, porque testá-lo é testar a biblioteca.
 */

/** Os campos que um erro acusou, para comparar por nome em vez de por posição. */
function fieldsOf(error: { messages: Array<{ field: string }> } | null) {
  if (!error) return []

  return error.messages.map((each) => each.field).sort()
}

const CONTACT = {
  firstName: 'Maria',
  lastName: 'Souza',
  email: 'maria@mail.com',
  message: 'Queremos um sistema de agendamento.',
}

const APPLICATION = {
  name: 'Maria Souza',
  email: 'maria@mail.com',
  position: 'frontend',
  linkedin: '',
}

describe('contato', () => {
  it('aceita a mensagem completa', async () => {
    const [error] = await ContactCreateValidator.tryValidate(CONTACT)

    expect(fieldsOf(error)).toEqual([])
  })

  it('recusa mensagem com menos de dez caracteres', async () => {
    const [error] = await ContactCreateValidator.tryValidate({
      ...CONTACT,
      message: 'Oi',
    })

    expect(fieldsOf(error)).toEqual(['message'])
  })

  it('cobra os campos vazios, que chegam como nulo', async () => {
    const [error] = await ContactCreateValidator.tryValidate({
      firstName: '',
      lastName: '',
      email: '',
      message: '',
    })

    expect(fieldsOf(error)).toEqual([
      'email',
      'firstName',
      'lastName',
      'message',
    ])
  })
})

describe('candidatura', () => {
  it('aceita o LinkedIn em branco', async () => {
    const [error, payload] =
      await CareerApplicationCreateValidator.tryValidate(APPLICATION)

    expect(fieldsOf(error)).toEqual([])
    expect(payload?.linkedin).toBeNull()
  })

  it('recusa link que não é URL', async () => {
    const [error] = await CareerApplicationCreateValidator.tryValidate({
      ...APPLICATION,
      linkedin: 'meu perfil',
    })

    expect(fieldsOf(error)).toEqual(['linkedin'])
  })

  it('recusa vaga fora da lista', async () => {
    const [error] = await CareerApplicationCreateValidator.tryValidate({
      ...APPLICATION,
      position: 'ceo',
    })

    expect(fieldsOf(error)).toEqual(['position'])
  })
})
