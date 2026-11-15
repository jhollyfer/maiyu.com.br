import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontCityListUseCase from './list.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'

@inject()
export default class StorefrontCityListController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Listar cidades',
    description:
      'Público, sem sessão. Todas as cidades, por nome: o catálogo é pequeno e o seletor mostra ' +
      'inteiro. O `slug` é o segmento da URL depois do idioma, e o `timeZone` é o relógio em que as ' +
      'datas da cidade aparecem.',
  })

  constructor(private readonly useCase: StorefrontCityListUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute()
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
