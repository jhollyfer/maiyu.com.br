import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AccountProfileShowUseCase from './show.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'

@inject()
export default class AccountProfileShowController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Ver a própria conta',
    description:
      'A conta de quem está na sessão, seja qual for o papel: id, nome, e-mail e papel, nunca a senha ' +
      'nem o hash. Não há identificador no caminho: o escopo vem sempre do cookie.',
  })

  constructor(private readonly useCase: AccountProfileShowUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute({ actor: context.actor })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
