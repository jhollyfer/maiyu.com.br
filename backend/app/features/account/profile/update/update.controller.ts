import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AccountProfileUpdateUseCase from './update.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { SessionCookie } from '#features/_shared.session-cookie'
import { AccountProfileUpdateValidator } from '#validators/account/profile.validator'

@inject()
export default class AccountProfileUpdateController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Trocar nome, celular ou senha',
    description:
      'Troca o nome, o celular, a senha ou mais de um. O corpo precisa de `name`, `phone` ou ' +
      '`password` (esta com `passwordConfirmation`, como em todo lugar que se escolhe senha), e ' +
      'trocar qualquer um exige `currentPassword`: o cookie prova a sessão, não a pessoa, e sem isso um ' +
      'cookie roubado trocaria a senha do dono. Senha atual errada responde `422` no campo ' +
      '`currentPassword`; senha nova igual à atual responde `422` `PASSWORD_SAME_AS_CURRENT` no ' +
      'campo `password`; celular que outra conta já usa responde `422` `PHONE_TAKEN` no campo `phone`.\n\n' +
      'Trocar a senha ou o celular **derruba todas as sessões da conta**, inclusive a que fez esta ' +
      'chamada, na mesma transação da gravação; a resposta `200` já limpa os cookies, e o dono entra ' +
      'de novo com a credencial nova. Trocar só o nome responde `200` e mantém as sessões e os cookies.\n\n' +
      'Limite de 10 trocas por 15 minutos por usuário. O e-mail e o papel não mudam por aqui.',
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
