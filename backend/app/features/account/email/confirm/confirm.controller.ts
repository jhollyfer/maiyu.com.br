import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AccountEmailConfirmUseCase from './confirm.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { SessionCookie } from '#features/_shared.session-cookie'
import { AccountEmailConfirmValidator } from '#validators/account/email-confirmation.validator'

@inject()
export default class AccountEmailConfirmController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Confirmar o novo e-mail',
    description:
      'Confirma a troca do e-mail pedida em `PUT /account/profile` com o `token` de uso único que ' +
      'chegou ao endereço novo (vale 60 minutos e só abre a conta de quem pediu). Código ' +
      'inválido, já usado, vencido ou de outra conta responde `422` `EMAIL_TOKEN_INVALID` no ' +
      'campo `token`; endereço que outra conta tomou nesse meio-tempo responde `422` `EMAIL_TAKEN`, e ' +
      'o código segue valendo.\n\n' +
      'Responde `204` **sem corpo**. Trocar o e-mail **derruba todas as outras sessões da conta**: a ' +
      'sessão que confirmou continua, com um par de tokens novo no `Set-Cookie`. Parte do bloco de ' +
      'e-mail: só existe no projeto que o tem.\n\n' +
      'Limite de 10 tentativas por 15 minutos por usuário.',
  })

  constructor(private readonly useCase: AccountEmailConfirmUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      AccountEmailConfirmValidator,
    )
    const result = await this.useCase.execute({
      ...payload,
      actor: context.actor,
    })
    if (result.isLeft()) throw result.value

    SessionCookie.write(context.response, result.value)

    return context.response.noContent()
  }
}
