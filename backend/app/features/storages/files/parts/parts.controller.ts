import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { StoragesFileUploadResponse } from '@maiyu/shared'

import StoragesFilePartsUseCase from './parts.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'
import {
  PART_SIZE,
  PRESIGNED_BATCH,
} from '#services/multipart/multipart.contract'

@inject()
export default class StoragesFilePartsController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Retomar o upload',
    responses: { 200: StoragesFileUploadResponse },
    description:
      'De onde continuar: em `uploaded`, o que o bucket já recebeu; em `parts`, uma URL nova para ' +
      'o que falta.\n\n' +
      'Atende dois casos que são o mesmo problema. **Retomada**: a conexão caiu no meio, e ' +
      'sem isto a única saída seria recomeçar. **Próximo lote**: as URLs saem ' +
      // Both numbers come from the service constants: written by hand, the
      // documentation would start lying the day one of them changed.
      `${PRESIGNED_BATCH} por vez, porque assinar tudo de uma vez seriam centenas ` +
      `de kilobytes de JSON antes do primeiro byte subir. Cada parte tem ${PART_SIZE} bytes.` +
      '\n\n' +
      'Assinar de novo é o objetivo, não efeito colateral: URL assinada expira, e um envio ' +
      'que durou mais que a validade acha aqui um endereço novo para a mesma parte.\n\n' +
      'Arquivo já confirmado responde `200` com as duas listas vazias: quem pergunta é um ' +
      'cliente retomando, e ler o `status` e parar é o desfecho certo.',
  })

  constructor(private readonly useCase: StoragesFilePartsUseCase) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const result = await this.useCase.execute(params)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
