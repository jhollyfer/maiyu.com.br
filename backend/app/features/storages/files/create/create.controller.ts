import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { STORAGE_MIMETYPES, StoragesFileUploadResponse } from '@maiyu/shared'

import StoragesFileCreateUseCase from './create.use-case.ts'

import { UPLOAD_MAX_SIZE } from '#config/drive'
import { OpenApiDocs } from '#core/openapi/types'
import { PART_SIZE } from '#services/multipart/multipart.contract'
import { StoragesFileCreateValidator } from '#validators/storages/files.validator'

@inject()
export default class StoragesFileCreateController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Abrir o upload',
    // The response is not the file, it is the upload plan - hence declared here
    // instead of coming from the feature's default `Storage` resource.
    responses: { 201: StoragesFileUploadResponse },
    description:
      'Abre um envio e devolve para onde mandá-lo. **Não recebe bytes**: só os metadados do ' +
      'arquivo.\n\n' +
      'O binário vai do navegador direto ao bucket, por URL assinada, e nunca atravessa esta ' +
      'aplicação: arquivo grande em corpo HTTP bate no limite do proxy, ocupa a ' +
      'aplicação durante o envio inteiro e não retoma quando a conexão cai.\n\n' +
      `Aceita ${STORAGE_MIMETYPES.join(', ')}, até ${UPLOAD_MAX_SIZE} bytes, recusados **antes** ` +
      'de qualquer assinatura: arquivo proibido não ganha URL, então nunca chega ao bucket. Que o ' +
      'tamanho declarado é verdadeiro é o que `POST /storages/:id/complete` confere, contra o ' +
      'objeto real.\n\n' +
      `O arquivo é fatiado em partes de ${PART_SIZE} bytes. Quando cabe numa parte só, ` +
      '`uploadId` é nulo e a única URL aceita um `PUT` com o arquivo inteiro. Quando não ' +
      'cabe, cada URL aceita a sua parte, o cliente guarda o `ETag` que cada `PUT` devolve, e ' +
      '`parts` pode trazer só o primeiro lote: o resto vem de `GET /storages/:id/parts`, que ' +
      'é o mesmo endpoint da retomada.\n\n' +
      'A linha nasce `PENDING` e não pode ser anexada a nada até ser confirmada. O arquivo ' +
      'nasce sem dono: quem anexa guarda a referência, informando o `id` no ' +
      'campo do recurso (hoje, o `avatarId` do usuário).',
  })

  constructor(private readonly useCase: StoragesFileCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      StoragesFileCreateValidator,
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
