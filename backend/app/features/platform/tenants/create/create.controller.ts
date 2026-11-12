import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PlatformTenantCreateUseCase from './create.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { TenantsCreateValidator } from '#validators/tenants/tenants.validator'

@inject()
export default class PlatformTenantCreateController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Cadastrar cliente',
    description:
      'Só o dono da plataforma. O cliente (tenant) nasce ativo numa cidade existente. O `slug` é ' +
      'o segmento da URL depois da cidade: único na cidade, em minúsculas, e nunca um segmento ' +
      'que o frontend já usa. `parentId` é o contratante que agrupa outros, um nível só: o pai ' +
      'precisa estar no primeiro nível.',
  })

  constructor(private readonly useCase: PlatformTenantCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(TenantsCreateValidator)
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
