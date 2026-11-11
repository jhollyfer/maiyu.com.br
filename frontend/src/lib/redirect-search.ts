/** Where to go back to after signing in, when the guard blocked someone midway. */
export type RedirectSearch = {
  redirect?: string | undefined
}

/**
 * Validates the authentication screen's `?redirect=`.
 *
 * By hand, and not with a Zod schema: the rule is about the path (`/`, never `//` or
 * `/\`), not the shape, and the router's `validateSearch` has to return the
 * clean object, without throwing.
 *
 * A refused value comes back as `{ redirect: undefined }`, never `{}`: the router merges
 * `{ ...parentSearch, ...validated }`, so an absent key lets the raw `?redirect=` of the URL
 * survive the validation (open redirect, relato do manganga, 2026-11-11).
 *
 * Lives outside `routes/` so it can be tested without the route tree generator
 * treating the test file as a route.
 */
const REFUSED: RedirectSearch = { redirect: undefined }

export function validateRedirectSearch(
  search: Record<string, unknown>,
): RedirectSearch {
  const value = search.redirect

  if (typeof value !== 'string') return REFUSED

  // Internal paths only. `https://evil.com` is obvious, but `//evil.com` is also
  // external navigation: the browser reads it as "same protocol, other host".
  // Without this line, a link with `?redirect=` takes the user off-site right
  // after typing the password, and the address bar gives nothing away.
  if (!value.startsWith('/') || value.startsWith('//')) return REFUSED

  // `\` in place of `/` is the variation that browsers normalize back
  // to `//`, and that gets past a check made only on the slash.
  if (value.startsWith('/\\')) return REFUSED

  // A control character (tab, line break, DEL) anywhere: the browser strips it while parsing
  // the URL, so `/\t/evil.test` becomes `//evil.test` after the checks above (relato do aporta).
  if (/[\u0000-\u001f\u007f]/.test(value)) return REFUSED

  return { redirect: value }
}

/**
 * Where to go after signing in: the validated `redirect`, or the area home the project gives
 * (`homeOf`). One function for the form, the `beforeLoad` guard and the layout guard, which
 * must agree (from the aporta).
 */
export function redirectDestination(
  search: RedirectSearch,
  home: string,
): string {
  return search.redirect ?? home
}
