import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StoragesFileDeleteUseCase from './delete.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class StoragesFileDeleteController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Remover arquivo',
    description:
      '**Irreversível**: apaga o binário no bucket e a linha em `storages`.\n\n' +
      'Só apaga arquivo **órfão**. O arquivo é um registro neutro e compartilhado (não ' +
      'pertence ao formulário que o enviou), então quem o referencia manda: arquivo ' +
      'em uso por outro registro (hoje, o avatar de um usuário) responde `409`, com a origem na ' +
      'mensagem. Desvincule primeiro, apague depois.\n\n' +
      'Arquivo ainda `PENDING` é cancelamento de envio: o multipart é abortado, e é isso que ' +
      'faz as partes já enviadas sumirem do bucket.\n\n' +
      'É o par de `POST /storages`, que grava o arquivo antes de o formulário ser salvo: sem ' +
      'esta rota, todo anexo escolhido e depois tirado da tela ficaria no bucket para sempre.',
  })

  constructor(private readonly useCase: StoragesFileDeleteUseCase) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const result = await this.useCase.execute(params)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
