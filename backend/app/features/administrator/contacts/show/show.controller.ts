import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AdministratorContactShowUseCase from './show.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'
import ContactPolicy from '#policies/contact.policy'
import { ContactRepository } from '#repositories/contact/contact.repository'

@inject()
export default class AdministratorContactShowController {
  static docs = OpenApiDocs.defineDocs({
    description:
      'A mensagem inteira, com quem escreveu, o idioma e se já foi respondida (`answeredAt` ' +
      'preenchido). Ler não marca como respondida: quem marca é `POST /administrator/contacts/:id/answer`.',
  })

  constructor(
    private readonly useCase: AdministratorContactShowUseCase,
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
