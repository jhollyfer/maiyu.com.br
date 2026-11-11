import { inject } from '@adonisjs/core'

import { right, type Either } from '@maiyu/shared'

import openapi from '#config/openapi'
import { ScalarPage } from '#core/openapi/scalar'
import type HTTPException from '#exceptions/http.exception'

type Response = Either<HTTPException, string>

/**
 * The browsable reference (Scalar) over `/openapi.json`. Building the page does no I/O,
 * so `execute` is synchronous: an `async` with nothing to wait for is what
 * `require-await` refuses.
 */
@inject()
export default class DocumentationReferenceShowUseCase {
  execute(): Response {
    return right(ScalarPage.html('/openapi.json', openapi.info.title))
  }
}
