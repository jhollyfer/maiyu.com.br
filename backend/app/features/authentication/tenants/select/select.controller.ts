import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AuthenticationTenantSelectUseCase from './select.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { AuthenticationTenantSelectValidator } from '#validators/authentication/tenants.validator'

@inject()
export default class AuthenticationTenantSelectController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Escolher cliente',
    description:
      'Troca o cliente (tenant) em que a sessão trabalha. Só um em que a conta tem papel: ' +
      'qualquer outro responde `404 TENANT_NOT_FOUND`, igual a um que não existe. A escolha vale ' +
      'para as próximas requisições, e o papel é conferido em cada uma.',
  })

  constructor(private readonly useCase: AuthenticationTenantSelectUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      AuthenticationTenantSelectValidator,
    )
    const result = await this.useCase.execute({
      ...payload,
      actor: context.actor,
    })
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
