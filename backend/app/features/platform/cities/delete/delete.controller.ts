import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PlatformCityDeleteUseCase from './delete.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class PlatformCityDeleteController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Remover cidade',
    description:
      'Só o dono da plataforma, e só cidade sem cliente: com algum tenant responde `409 CITY_IN_USE`.',
  })

  constructor(private readonly useCase: PlatformCityDeleteUseCase) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const result = await this.useCase.execute(params)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
