import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PlatformMemberDeleteUseCase from './delete.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class PlatformMemberDeleteController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Desvincular conta do cliente',
    description:
      'Só o dono da plataforma. Remove o vínculo pelo `id` dele e derruba todas as sessões da ' +
      'conta. A conta continua existindo.',
  })

  constructor(private readonly useCase: PlatformMemberDeleteUseCase) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const result = await this.useCase.execute(params)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
