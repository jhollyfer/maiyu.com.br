import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PlatformCityCreateUseCase from './create.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { CitiesCreateValidator } from '#validators/cities/cities.validator'

@inject()
export default class PlatformCityCreateController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Cadastrar cidade',
    description:
      'Só o dono da plataforma. O `slug` é o segmento da URL depois do idioma ' +
      '(`/pt-br/<cidade>`): único, em minúsculas, e nunca um prefixo de idioma. O fuso é um nome ' +
      'IANA (`America/Eirunepe`). O centro precisa cair dentro dos limites, e o sul abaixo do norte.',
  })

  constructor(private readonly useCase: PlatformCityCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(CitiesCreateValidator)
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
