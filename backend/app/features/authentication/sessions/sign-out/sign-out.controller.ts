import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AuthenticationSessionSignOutUseCase from './sign-out.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { SessionCookie } from '#features/_shared.session-cookie'

@inject()
export default class AuthenticationSessionSignOutController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Sair',
    description:
      'Encerra a sessão **no servidor**, não só na tela: apaga o token de acesso atual e o de refresh, ' +
      'depois limpa os dois cookies. Responde `204` sem corpo.\n\n' +
      'Refresh ilegível não impede a saída: os cookies são limpos mesmo assim, ' +
      'porque o resultado que a pessoa pediu é ficar sem sessão.\n\n' +
      'Apaga só os tokens desta sessão. Derrubar **todos** é consequência de trocar celular ou ' +
      'senha em `PUT /account/profile`, não desta rota.',
  })

  constructor(private readonly useCase: AuthenticationSessionSignOutUseCase) {}

  async handle(context: HttpContext) {
    const { actor } = context
    const refreshToken = SessionCookie.readRefresh(context.request)

    const result = await this.useCase.execute({
      actor,
      accessTokenId:
        context.auth.user?.currentAccessToken?.identifier.toString(),
      refreshToken,
    })

    if (result.isLeft()) throw result.value

    SessionCookie.clear(context.response)

    return context.response.noContent()
  }
}
