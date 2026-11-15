import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PlatformTenantUpdateUseCase from './update.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { TenantsUpdateValidator } from '#validators/tenants/tenants.validator'

@inject()
export default class PlatformTenantUpdateController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Editar cliente',
    description:
      'Só o dono da plataforma. O registro inteiro de novo, com o status: cliente inativo some ' +
      'do acesso e da URL pública, e os dados ficam. Trocar o `slug` ou a cidade muda a URL ' +
      'pública do cliente.',
  })

  constructor(private readonly useCase: PlatformTenantUpdateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(TenantsUpdateValidator)
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
