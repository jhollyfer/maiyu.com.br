import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

import { JOB_POSITIONS } from './entity'
import { messages } from './validator-messages'

export * from './entity'

/**
 * Os schemas dos formulários do site.
 *
 * Nos irmãos este arquivo é cópia do `validator.ts` do backend, porque o
 * formulário fala com uma API AdonisJS. Aqui não há backend: contato e
 * candidatura confirmam na tela, e o contato de verdade segue por e-mail e
 * WhatsApp, como no site antigo. O dialeto continua o VineJS mesmo assim: é o
 * que os projetos falam, e no dia em que houver API os schemas já estão na
 * forma que ela vai exigir.
 *
 * Quem consome isto num formulário não chama `validate` na mão: passa o
 * validator para `vineResolver()` do `@hookform/resolvers/vine`.
 */

// O `vineResolver` lê `error.messages` no formato do `SimpleErrorReporter`
// padrão. Trocar `vine.errorReporter` por um repórter próprio quebra o resolver
// em silêncio: os erros somem dos campos sem nenhum aviso.
vine.messagesProvider = messages

/**
 * `''` vira `null` antes da validação, e é o que faz o LinkedIn opcional
 * funcionar: sem isto o campo vazio chegaria à regra `url` e seria recusado.
 *
 * Precisa rodar **antes** de qualquer `vine.create()` abaixo: a flag é lida na
 * compilação do schema, não na validação.
 */
vine.convertEmptyStringsToNull = true

/**
 * O `vine` sai reexportado daqui, e não importado de `@vinejs/vine`, porque as
 * duas linhas acima configuram um **singleton**: um schema criado a partir do
 * pacote cru compilaria sem a flag e com as mensagens em inglês.
 */
export { vine }

// ---------------------------------------------------------------------------
// Regras compartilhadas
// ---------------------------------------------------------------------------

/**
 * Funções e não constantes: reaproveitar o mesmo nó de schema em dois
 * validators compartilharia as opções entre eles.
 */

/** Um e-mail, com o teto que o RFC 5321 dá para o endereço inteiro. */
export function email() {
  return vine.string().trim().email().maxLength(254)
}

/** Um nome de pessoa. */
export function personName() {
  return vine.string().trim().maxLength(120)
}

// ---------------------------------------------------------------------------
// Contato
// ---------------------------------------------------------------------------

/**
 * A mensagem da página de contato.
 *
 * O piso de dez caracteres vem do site antigo: abaixo disso a mensagem não diz
 * o que a pessoa precisa, e a resposta vira uma pergunta de volta.
 */
export const ContactCreateValidator = vine.create({
  firstName: personName(),
  lastName: personName(),
  email: email(),
  message: vine.string().trim().minLength(10).maxLength(5000),
})

export type ContactCreatePayload = Infer<typeof ContactCreateValidator>

// ---------------------------------------------------------------------------
// Carreiras
// ---------------------------------------------------------------------------

/**
 * A candidatura da página de carreiras.
 *
 * O link é opcional: `nullable` junto com `convertEmptyStringsToNull`, e não
 * `optional`, porque o campo existe no formulário e chega vazio, não ausente.
 */
export const CareerApplicationCreateValidator = vine.create({
  name: personName(),
  email: email(),
  position: vine.enum(JOB_POSITIONS),
  linkedin: vine.string().trim().url().maxLength(2048).nullable(),
})

export type CareerApplicationCreatePayload = Infer<
  typeof CareerApplicationCreateValidator
>
