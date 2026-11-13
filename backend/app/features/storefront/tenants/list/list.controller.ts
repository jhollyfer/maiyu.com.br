import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontTenantListUseCase from './list.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { TenantScope } from '#core/tenant-scope'

@inject()
export default class StorefrontTenantListController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Listar clientes da cidade',
    description:
      'Público, sem sessão. Os clientes ativos da cidade do segmento `:city`, por nome. Cidade ' +
      'que não existe responde `404`, como qualquer endereço desconhecido.',
  })

  constructor(private readonly useCase: StorefrontTenantListUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute({
      scope: context.tenantScope ?? TenantScope.none(),
    })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
