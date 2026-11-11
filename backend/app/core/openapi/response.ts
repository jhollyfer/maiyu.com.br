import {
  AccountProfileShowResponse,
  AdministratorContactPaginateResponse,
  AdministratorContactShowResponse,
  StoragesFileShowResponse,
  StorefrontContactCreateResponse,
  StoragesFileUploadResponse,
} from '@maiyu/shared'

import type { FeatureResponse } from '#core/openapi/types'

/**
 * The registry of which response schema answers for each API action
 * (`_standards/openapi.md`, "registro-de-resposta"). The registry only points: the
 * schema lives in `shared/src/responses/`, the same one the presenter types and the
 * frontend reads, and `core/` does not import `models/`.
 *
 * The key is the resource directory in `app/features` (`storages/files`) and holds
 * for all its actions; the key with the action (`storages/files/create`) wins when
 * the action returns another shape. A listing gets the pagination envelope on its own.
 *
 * Skeleton: the project adds one entry per resource that returns a body. Annotated,
 * not `satisfies`, because the generator looks the key up by a computed string.
 */
export const RESPONSES: Record<string, FeatureResponse> = {
  'account/profile': AccountProfileShowResponse,
  'administrator/contacts': AdministratorContactShowResponse,
  'administrator/contacts/paginate': AdministratorContactPaginateResponse,
  'storefront/contacts/create': StorefrontContactCreateResponse,
  'storages/files': StoragesFileShowResponse,
  'storages/files/create': StoragesFileUploadResponse,
  'storages/files/parts': StoragesFileUploadResponse,
}
