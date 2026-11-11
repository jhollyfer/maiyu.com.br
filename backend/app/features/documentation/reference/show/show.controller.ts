import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import DocumentationReferenceShowUseCase from './show.use-case.ts'

import { DOCUMENTATION_CSP } from '#core/openapi/scalar'

/**
 * `GET /documentation`: the browsable reference. Lives in `openapi.ignore` and
 * behind `middleware.documentation()`, like the document it reads. The page needs
 * its own CSP: the API's refuses every script (`config/shield.ts`).
 */
@inject()
export default class DocumentationReferenceShowController {
  constructor(private readonly useCase: DocumentationReferenceShowUseCase) {}

  handle(context: HttpContext) {
    const result = this.useCase.execute()
    if (result.isLeft()) throw result.value
    return context.response
      .header('content-type', 'text/html')
      .header('content-security-policy', DOCUMENTATION_CSP)
      .send(result.value)
  }
}
