import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AccountProfileUpdateUseCase from './update.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { SessionCookie } from '#features/authentication/_shared.session-cookie'
import { AccountProfileUpdateValidator } from '#validators/account/profile.validator'

@inject()
export default class AccountProfileUpdateController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Trocar e-mail ou senha',
    description:
      'Troca o e-mail, a senha ou os dois. O corpo precisa de `email` ou `password`, e trocar ' +
      'qualquer um exige `currentPassword`: o cookie prova a sessão, não a pessoa, e sem isso um ' +
      'cookie roubado trocaria a senha do dono. Senha atual errada responde `422` no campo ' +
      '`currentPassword`; e-mail de outra conta responde `409` `EMAIL_IN_USE`.\n\n' +
      'Trocar e-mail ou senha **derruba todas as sessões da conta**, inclusive a que fez esta ' +
      'chamada, na mesma transação da gravação; a resposta `200` já limpa os cookies, e o dono ' +
      'entra de novo com a credencial nova. Enviar o e-mail que a conta já tem responde `200` e ' +
      'mantém as sessões.\n\n' +
      'Limite de 5 trocas por 15 minutos por usuário. O papel e o nome não mudam por aqui.',
  })

  constructor(private readonly useCase: AccountProfileUpdateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      AccountProfileUpdateValidator,
    )
    const result = await this.useCase.execute({
      ...payload,
      actor: context.actor,
    })
    if (result.isLeft()) throw result.value

    // The tokens are gone from the database; the cookies would only carry dead values.
    if (result.value.sessionsRevoked) SessionCookie.clear(context.response)

    return context.response.ok(result.value.profile)
  }
}
