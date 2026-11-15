import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AuthenticationSessionRefreshUseCase from './refresh.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { SessionCookie } from '#features/_shared.session-cookie'

@inject()
export default class AuthenticationSessionRefreshController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Renovar a sessão',
    description:
      'Renova a sessão a partir do cookie de refresh e responde `204` com o novo par de tokens ' +
      'em `Set-Cookie`.\n\n' +
      'Fica **fora** do grupo autenticado de propósito: é justamente o token de acesso vencido ' +
      'que traz alguém aqui, então exigir sessão válida tornaria a rota inalcançável. O que ' +
      'autoriza é o cookie de refresh, e nada mais.\n\n' +
      '**Rotaciona**: o refresh usado é apagado quando o novo é emitido. Refresh usado que ' +
      'volta é **reuso** e encerra todas as sessões da conta, inclusive o par emitido a partir dele. ' +
      'Dois refresh simultâneos com o mesmo token não são reuso: um vence, o outro recebe `401` ' +
      'e as sessões ficam.\n\n' +
      'Cookie ausente, ilegível, que não é de refresh ou reusado responde `401` `AUTHENTICATION_REQUIRED`, ' +
      'sem distinguir qual foi.',
  })

  constructor(private readonly useCase: AuthenticationSessionRefreshUseCase) {}

  async handle(context: HttpContext) {
    const refreshToken = SessionCookie.readRefresh(context.request)
    const result = await this.useCase.execute({ refreshToken })

    if (result.isLeft()) throw result.value

    SessionCookie.write(context.response, result.value)

    return context.response.noContent()
  }
}
