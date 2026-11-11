import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AdministratorContactAnswerUseCase from './answer.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'
import ContactPolicy from '#policies/contact.policy'
import { ContactRepository } from '#repositories/contact/contact.repository'

@inject()
export default class AdministratorContactAnswerController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Marcar contato como respondido',
    description:
      'Marca a mensagem como respondida e devolve o contato com `answeredAt` no instante da ' +
      'chamada. **Mão única**: não há como desmarcar, e marcar de novo responde `409`, sem ' +
      'mudar o instante da primeira vez.\n\n' +
      'A resposta ao visitante o dono envia do próprio e-mail: a API só registra que ela foi dada. ' +
      'Duas chamadas simultâneas para o mesmo contato dão um `200` e um `409`.',
  })

  constructor(
    private readonly useCase: AdministratorContactAnswerUseCase,
    private readonly contacts: ContactRepository,
  ) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const contact = await this.contacts.findById(params.id)
    await context.bouncer.with(ContactPolicy).authorize('manage', contact)
    const result = await this.useCase.execute(params)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
