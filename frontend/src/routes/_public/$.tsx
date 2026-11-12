import { createFileRoute, notFound } from '@tanstack/react-router'

import { NotFoundPage } from '#/components/common/route-status/not-found-page'
import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/** The screen for the address that does not exist, inside the public shell. */
function NotFound(): React.JSX.Element {
  return <NotFoundPage className="min-h-[80dvh]" />
}

/**
 * The public address that does not exist.
 *
 * The `defaultNotFoundComponent` of `router.tsx` draws the same screen, and draws it **outside**
 * any shell: an address that matches no route never reaches `_public`, and whoever mistypes the
 * address would be left without a menu and a footer. This catch-all route brings the screen
 * inside the shell.
 *
 * The `loader` throws `notFound()` instead of drawing the screen as a `component`: drawn as a
 * common page, the route matched and SSR answered **200** for any made-up address (soft 404), and
 * the search engine, monitor and proxy read success. With `notFound()` the router answers 404 and
 * draws this same route's `notFoundComponent`, as `blog/$slug` already did
 * (_doc-lib/tanstack-router.md#guide/not-found-errors).
 *
 * **No `.lazy` file, and it is a decision**, as in academy: splitting it would cost a trip to the
 * server to load six lines.
 *
 * `noindex` stays: the status already says the address does not exist, and the meta covers the
 * crawler that ignores the status.
 */
export const Route = createFileRoute('/_public/$')({
  loader: () => {
    throw notFound()
  },
  // Title, `robots` and canonical come from `pageHead` as on every public route (`frontend.md` §9.7):
  // by hand the separator diverged (`·`) and `robots` was left without the `nofollow`.
  head: ({ params }) => {
    let splat = ''
    if (params._splat) splat = params._splat

    return pageHead({
      pathname: '/'.concat(splat),
      title: m.kit_not_found_title(),
      noindex: true,
    })
  },
  notFoundComponent: NotFound,
})
