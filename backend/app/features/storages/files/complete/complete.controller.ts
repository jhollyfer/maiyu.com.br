import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StoragesFileCompleteUseCase from './complete.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { StoragesFileCompleteValidator } from '#validators/storages/files.validator'

@inject()
export default class StoragesFileCompleteController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Confirmar o upload',
    description:
      'Fecha o envio aberto por `POST /storages`: o bucket remonta as partes e a linha vira ' +
      '`UPLOADED`, o único estado que pode ser anexado a alguma coisa.\n\n' +
      'O corpo leva o `ETag` que cada `PUT` de parte devolveu: é assim que o storage confere ' +
      'que nenhuma parte se perdeu ou chegou pela metade. Envio de parte única não tem parte ' +
      'a confirmar, e `parts` fica ausente.\n\n' +
      'É aqui que o tamanho **declarado** em `POST /storages` é comparado com o do objeto que ' +
      'chegou de fato. Se diverge, o objeto é apagado, a linha morre com ele e a resposta é `422`. ' +
      'O `mimetype` não é conferido porque não pode divergir: ele entra na assinatura da ' +
      'URL, e o bucket recusa o `PUT` que não bate com ele.\n\n' +
      'Chamar duas vezes é seguro: a segunda devolve o mesmo registro.',
  })

  constructor(private readonly useCase: StoragesFileCompleteUseCase) {}

  async handle(context: HttpContext) {
    const { params, ...body } = await context.request.validateUsing(
      StoragesFileCompleteValidator,
    )
    const result = await this.useCase.execute({ ...body, id: params.id })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
