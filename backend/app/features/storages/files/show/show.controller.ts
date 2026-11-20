import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StoragesFileShowUseCase from './show.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'
import StoragePolicy from '#policies/storage.policy'
import { StorageRepository } from '#repositories/storage/storage.repository'

@inject()
export default class StoragesFileShowController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Detalhar arquivo',
    description:
      'Devolve o registro cru, sem envelope: o rótulo original, o tipo, o tamanho, o estado do ' +
      'envio e a `url` derivada.\n\n' +
      'Vale também para arquivo ainda `PENDING`: a tela de detalhe é onde se descobre que ' +
      'um envio ficou pela metade. Quem anexa é quem exige `UPLOADED`.\n\n' +
      'Alcança quem enviou o arquivo e a equipe do tenant; membro comum não vê o arquivo de ' +
      'outro membro, e o arquivo de cliente final é só dele. O que não se alcança responde ' +
      '`404`, o mesmo de um arquivo que não existe (`StoragePolicy`).',
  })

  constructor(
    private readonly useCase: StoragesFileShowUseCase,
    private readonly storages: StorageRepository,
  ) {}

  async handle(context: HttpContext) {
    const { params } = await context.request.validateUsing(IdentifierValidator)
    const storage = await this.storages.findById(params.id)
    await context.bouncer.with(StoragePolicy).authorize('show', storage)
    const result = await this.useCase.execute(params)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
