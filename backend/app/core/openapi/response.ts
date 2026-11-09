import { ResponseRule, StoragesFileShowResponse } from '@maiyu/shared'

import type { FeatureResponse } from '#core/openapi/types'

/**
 * The registry of which response schema answers for each API action (extension point,
 * KIT.md §3.4; `_standards/openapi.md`, "registro-de-resposta"). The registry
 * **points**; the schema lives in `shared/src/responses/` and is the same one the frontend
 * uses to read the body (`_standards/architecture.md` §10).
 *
 * The key is the action's path under `app/features/`, and the lookup climbs: action
 * `storages/files/show` tries the full key and then `storages/files`. A resource entry
 * covers the actions that return the same shape; `paginate` always has its own, or the
 * listing would come out documented as the raw item and `--strict` would reject it.
 *
 * An action that answers `204` needs no entry, and one that declares `responses` in its
 * `static docs` (the upload plan) does not read this registry.
 */
export const RESPONSES: Readonly<Record<string, FeatureResponse>> = {
  'storages/files': StoragesFileShowResponse,
  'storages/files/paginate': ResponseRule.paginated(StoragesFileShowResponse),
}
