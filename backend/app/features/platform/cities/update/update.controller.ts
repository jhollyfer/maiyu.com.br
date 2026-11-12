import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PlatformCityUpdateUseCase from './update.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'
import { CitiesUpdateValidator } from '#validators/cities/cities.validator'

@inject()
export default class PlatformCityUpdateController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Editar cidade',
    description:
      'Só o dono da plataforma. O registro inteiro de novo, com as mesmas regras do cadastro. ' +
      'Trocar o `slug` muda a URL pública da cidade: link já divulgado deixa de resolver.',
  })

  constructor(private readonly useCase: PlatformCityUpdateUseCase) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const fields = await context.request.validateUsing(CitiesUpdateValidator)
    const result = await this.useCase.execute({ ...fields, id: params.id })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
