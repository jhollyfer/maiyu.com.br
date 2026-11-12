import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import PlatformMemberSaveUseCase from './save.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { TenantsMemberSaveValidator } from '#validators/tenants/tenants.validator'

@inject()
export default class PlatformMemberSaveController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Vincular conta ao cliente',
    description:
      'Só o dono da plataforma. Põe a conta no cliente com o papel, ou troca o papel que ela já ' +
      'tem ali. Vínculo novo ou papel novo derruba todas as sessões da conta: ela entra de novo ' +
      'com o acesso atual. O mesmo papel outra vez não muda nada.',
  })

  constructor(private readonly useCase: PlatformMemberSaveUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      TenantsMemberSaveValidator,
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
