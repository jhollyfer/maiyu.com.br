import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StoragesFileShowUseCase from './show.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class StoragesFileShowController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Detalhar arquivo',
    description:
      'Devolve o registro cru, sem envelope: o rótulo original, o tipo, o tamanho, o estado do ' +
      'envio e a `url` derivada.\n\n' +
      'Vale também para arquivo ainda `PENDING`: a tela de detalhe é onde se descobre que ' +
      'um envio ficou pela metade. Quem anexa é quem exige `UPLOADED`.',
  })

  constructor(private readonly useCase: StoragesFileShowUseCase) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const result = await this.useCase.execute(params)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
