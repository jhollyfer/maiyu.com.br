import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PlatformOverviewShowUseCase from './show.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'

@inject()
export default class PlatformOverviewShowController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Visão da plataforma',
    description:
      'Só o dono da plataforma. Quantos clientes cada cidade tem e quantos membros cada cliente ' +
      'tem: contagem, nunca o dado de um cliente.',
  })

  constructor(private readonly useCase: PlatformOverviewShowUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute()
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
