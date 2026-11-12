import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { CONTACT_STATUSES } from '@maiyu/shared'

import AdministratorContactPaginateUseCase from './paginate.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { AdministratorContactPaginateValidator } from '#validators/administrator/contacts.validator'

@inject()
export default class AdministratorContactPaginateController {
  static docs = OpenApiDocs.defineDocs({
    description:
      'A caixa de entrada do painel: as mensagens do formulário do site, da mais recente para ' +
      'a mais antiga. A ordem é fixa, por isso não há `?sort`.\n\n' +
      '`?search` procura no nome e no e-mail, sem diferenciar maiúsculas. ' +
      `\`?status\` aceita ${CONTACT_STATUSES.join(' ou ')}: \`pending\` traz o que ainda não ` +
      'foi respondido e `answered` o que já foi.\n\n' +
      'Padrão: página 1, 20 por página.',
  })

  constructor(private readonly useCase: AdministratorContactPaginateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      AdministratorContactPaginateValidator,
      { data: context.request.qs() },
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
