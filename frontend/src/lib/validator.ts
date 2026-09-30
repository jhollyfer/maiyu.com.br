import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

/**
 * Os schemas dos formulários do site.
 *
 * Nos irmãos este arquivo é cópia do `validator.ts` do backend, porque o
 * formulário fala com uma API AdonisJS. Aqui não há backend: contato e
 * candidatura confirmam na tela e o contato de verdade segue por e-mail e
 * WhatsApp, como no site antigo. O dialeto continua o VineJS mesmo assim - é o
 * que os quatro projetos falam, e o dia em que houver API os schemas já estão
 * na forma que ela vai exigir.
 *
 * Compilados uma vez, fora do componente: `vine.compile()` dentro do render
 * recompilaria o schema a cada tecla.
 */

/**
 * `''` vira `null` antes da validação, e é o que faz o LinkedIn opcional
 * funcionar: sem isto o campo vazio chegaria à regra `url` e seria recusado.
 * Precisa rodar antes de qualquer `vine.compile()`, porque a flag é lida na
 * compilação.
 */
vine.convertEmptyStringsToNull = true

export { vine }

/** As vagas abertas, e o que o `<select>` da candidatura aceita. */
export const POSITIONS = ['frontend', 'designer', 'qa', 'backend'] as const

export const ContactValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim(),
    lastName: vine.string().trim(),
    email: vine.string().trim().email(),
    message: vine.string().trim().minLength(10),
  }),
)

export type ContactPayload = Infer<typeof ContactValidator>

export const CareerValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
    email: vine.string().trim().email(),
    position: vine.enum(POSITIONS),
    linkedin: vine.string().trim().url().nullable(),
  }),
)

export type CareerPayload = Infer<typeof CareerValidator>
