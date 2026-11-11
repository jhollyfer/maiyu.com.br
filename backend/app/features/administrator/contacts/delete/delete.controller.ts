import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AdministratorContactDeleteUseCase from './delete.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'
import ContactPolicy from '#policies/contact.policy'
import { ContactRepository } from '#repositories/contact/contact.repository'

@inject()
export default class AdministratorContactDeleteController {
  static docs = OpenApiDocs.defineDocs({
    description:
      '**Irreversível**: apaga a linha do banco, que guarda dado pessoal (nome e e-mail de ' +
      'quem escreveu). É também a forma de atender o pedido de exclusão do titular, sem esperar ' +
      'os 12 meses da guarda.\n\n' +
      'Não há lixeira: o contato respondido ou pendente sai da mesma forma. Privilégio da equipe.',
  })

  constructor(
    private readonly useCase: AdministratorContactDeleteUseCase,
    private readonly contacts: ContactRepository,
  ) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const contact = await this.contacts.findById(params.id)
    await context.bouncer.with(ContactPolicy).authorize('manage', contact)
    const result = await this.useCase.execute(params)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
