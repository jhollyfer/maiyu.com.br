import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AccountProfileShowUseCase from './show.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'

@inject()
export default class AccountProfileShowController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Ver a própria conta',
    description:
      'Devolve a conta da sessão: nome, e-mail, celular e papel na plataforma. O `id` vem da ' +
      'sessão, nunca do caminho, e a senha não faz parte da resposta.',
  })

  constructor(private readonly useCase: AccountProfileShowUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute({ actor: context.actor })
    if (result.isLeft()) throw result.value

    return context.response.ok(result.value)
  }
}
