import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { STORAGE_MIMETYPES, STORAGE_SORT_COLUMNS } from '@maiyu/shared'

import StoragesFilePaginateUseCase from './paginate.use-case.ts'

import { OpenApiDocs } from '#core/openapi/types'
import { StoragesFilePaginateValidator } from '#validators/storages/files.validator'

@inject()
export default class StoragesFilePaginateController {
  static docs = OpenApiDocs.defineDocs({
    summary: 'Listar arquivos',
    description:
      'A biblioteca de arquivos do painel. `?search` filtra por nome original, nome gerado e ' +
      'tipo, `?status` separa o que já subiu do envio aberto, e `?mimetype` restringe a um ' +
      'tipo só.\n\n' +
      // Both lists come from the tuples themselves: written by hand, the documentation
      // would start promising a value the day someone removed it from the validator.
      `\`?mimetype\` aceita ${STORAGE_MIMETYPES.join(', ')}.\n\n` +
      `\`?sort\` aceita ${STORAGE_SORT_COLUMNS.join(', ')} e \`?direction\` aceita asc ou desc. ` +
      'Padrão: página 1, 20 por página, do mais recente ao mais antigo, porque numa biblioteca de ' +
      'arquivos o que importa é o que acabou de subir.',
  })

  constructor(private readonly useCase: StoragesFilePaginateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      StoragesFilePaginateValidator,
      {
        data: context.request.qs(),
      },
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
