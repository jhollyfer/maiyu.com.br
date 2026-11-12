import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AuthenticationTenantListUseCase from './list.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'

@inject()
export default class AuthenticationTenantListController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Listar clientes da conta',
    description:
      'Os clientes (tenants) em que a conta tem papel, com a cidade de cada um, e o `activeId` ' +
      'em que a sessão trabalha. `activeId` nulo com mais de um cliente: a tela pede a escolha.',
  })

  constructor(private readonly useCase: AuthenticationTenantListUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute({ actor: context.actor })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
