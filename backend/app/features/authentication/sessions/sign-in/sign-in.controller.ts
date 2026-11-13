import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AuthenticationSessionSignInUseCase from './sign-in.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { SessionCookie } from '#features/_shared.session-cookie'
import { AuthenticationSessionSignInValidator } from '#validators/authentication/sessions.validator'

@inject()
export default class AuthenticationSessionSignInController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Entrar',
    description:
      'Abre a sessão. O campo `login` é o e-mail **ou** o celular da conta (com ou sem máscara e ' +
      '`+55`). Responde `204` **sem corpo**: o que importa é o `Set-Cookie` com o par de ' +
      'tokens `httpOnly`. O cliente nunca manipula o token, e nenhum dado do ' +
      'usuário viaja dentro dele.\n\n' +
      'A falha é **indistinguível pela causa**: senha errada, conta inativa e conta arquivada ' +
      'devolvem o mesmo `401`. É isso que impede descobrir, pela resposta, quais e-mails e celulares existem.',
  })

  constructor(private readonly useCase: AuthenticationSessionSignInUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      AuthenticationSessionSignInValidator,
    )
    const result = await this.useCase.execute(payload)

    if (result.isLeft()) throw result.value

    SessionCookie.write(context.response, result.value)

    return context.response.noContent()
  }
}
