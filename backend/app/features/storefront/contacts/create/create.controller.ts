import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontContactCreateUseCase from './create.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { StorefrontContactCreateValidator } from '#validators/storefront/contacts.validator'

@inject()
export default class StorefrontContactCreateController {
  static docs = OpenApiDocs.defineDocs({
    description:
      'O formulário de contato do site. **Pública**: não exige sessão, e por isso ' +
      'é a única escrita anônima da vitrine.\n\n' +
      'Guarda o nome, o e-mail, a mensagem e o idioma, para a equipe responder a quem ' +
      'escreveu. O dado pessoal é guardado por 12 meses e apagado depois. A mensagem fica no cliente do site ' +
      '(o tenant de `SINGLE_TENANT_SLUG`) e só a equipe dele a lê; sem cliente resolvido, `403` `TENANT_REQUIRED`.\n\n' +
      'Responde `201` só com o recibo (`id` e `createdAt`), sem repetir o que o visitante digitou. O campo `website` é uma armadilha para robôs: preenchido, ' +
      'a resposta é a mesma `201` e nada é gravado, para o robô não aprender que foi barrado.\n\n' +
      'Limite de 5 envios por hora por IP: o sexto responde `429`.',
  })

  constructor(private readonly useCase: StorefrontContactCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      StorefrontContactCreateValidator,
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
