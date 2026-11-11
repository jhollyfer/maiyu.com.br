/**
 * The project's public surface, read by `public-routes.unit.spec.ts` against the authorization
 * baseline that `authz:check` writes (_standards/backend.md §4.10).
 *
 * Extension point (KIT.md §3.4): the kit's own anonymous writes (sign-in and refresh) live in the
 * spec; what is listed here is only what the project adds.
 */

/**
 * Anonymous routes that write by design, as `METHOD /path` (the key of the baseline): the
 * project's sign-up, an anonymous report. Any other anonymous route that is not `GET` fails.
 */
export const PROJECT_ANONYMOUS_WRITES: readonly string[] = []

/**
 * Path prefixes that are anonymous and read-only, such as `/storefront`. Each one must have
 * routes, all anonymous, and none that writes. Empty when the project has no such area.
 */
export const READ_ONLY_PUBLIC_PREFIXES: readonly string[] = []
