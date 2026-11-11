/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Extension point (KIT.md §3.4): the kit routes below come in every project, and the
| project adds its groups after them.
|
*/

import router from '@adonisjs/core/services/router'

import { STAFF_USER_ROLES } from '@maiyu/shared'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import { contactThrottle } from '#start/limiter'
import {
  refreshThrottle,
  signInAccountThrottle,
  signInThrottle,
  uploadThrottle,
} from '#start/limiter.base'

/**
 * Routes are grouped by who may enter, and the group carries the middleware: a new route is
 * born protected by the group it was placed in. Controllers come from `#generated/controllers`,
 * so moving a file breaks the build here instead of a path string failing in production.
 */

/** Liveness probe: no session, no query (`architecture.md` §7). */
router.get('/health-check', [controllers.HealthCheck])

/** The document does not document itself: both routes stay outside every authenticated group. */
router
  .get('/openapi.json', [controllers.documentation.openapi.show.Show])
  .as('documentation.openapi.show')
  .use(middleware.documentation())

router
  .get('/documentation', [controllers.documentation.reference.show.Show])
  .as('documentation.reference.show')
  .use(middleware.documentation())

/**
 * The entry door: requiring a session here would make it unreachable. What changes state
 * travels in the `httpOnly` cookies.
 */
router
  .group(() => {
    router
      .post('sign-in', [controllers.authentication.sessions.signIn.SignIn])
      .as('authentication.sessions.sign-in')
      .use([signInThrottle, signInAccountThrottle])
    // Signing out deletes *this* session's tokens, so it is the only one that needs it.
    router
      .post('sign-out', [controllers.authentication.sessions.signOut.SignOut])
      .as('authentication.sessions.sign-out')
      .use(middleware.auth())
    // Outside `auth()`: the expired access token is what brings the client here, and the
    // refresh cookie is what authorizes.
    router
      .post('refresh', [controllers.authentication.sessions.refresh.Refresh])
      .as('authentication.sessions.refresh')
      .use(refreshThrottle)
  })
  .prefix('authentication')

/**
 * Attachments, for every signed-in role. The binary never passes through the API: `POST`
 * returns signed part URLs, the browser uploads to the bucket and `complete` confirms.
 */
router
  .group(() => {
    router
      .get('/', [controllers.storages.files.paginate.Paginate])
      .as('storages.files.paginate')
    router
      .post('/', [controllers.storages.files.create.Create])
      .as('storages.files.create')
      .use(uploadThrottle)
    router
      .post(':id/complete', [controllers.storages.files.complete.Complete])
      .as('storages.files.complete')
      .use(uploadThrottle)
    // Before `:id`: the two-segment path must not be swallowed by the generic one.
    router
      .get(':id/parts', [controllers.storages.files.parts.Parts])
      .as('storages.files.parts')
      .use(uploadThrottle)
    router
      .get(':id', [controllers.storages.files.show.Show])
      .as('storages.files.show')
    router
      .delete(':id', [controllers.storages.files.delete.Delete])
      .as('storages.files.delete')
    // Behind the session: outside it, it would mint signed URLs for any uuid.
    router
      .get(':id/download', [controllers.storages.files.download.Download])
      .as('storages.files.download')
  })
  .prefix('storages')
  .use(middleware.auth())

/**
 * The public area: no session, so every write here is declared in
 * `core/openapi/public-routes.ts` and carries its own limiter.
 */
router
  .group(() => {
    router
      .group(() => {
        router
          .post('/', [controllers.storefront.contacts.create.Create])
          .as('storefront.contacts.create')
          .use(contactThrottle)
      })
      .prefix('contacts')
  })
  .prefix('storefront')

/**
 * The panel: the group carries `auth` and `role`, so a route added here is born protected.
 * Whoever has a session but no staff role answers 403 before reaching any controller.
 */
router
  .group(() => {
    router
      .group(() => {
        router
          .get('/', [controllers.administrator.contacts.paginate.Paginate])
          .as('administrator.contacts.paginate')
        router
          .get(':id', [controllers.administrator.contacts.show.Show])
          .as('administrator.contacts.show')
        router
          .post(':id/answer', [
            controllers.administrator.contacts.answer.Answer,
          ])
          .as('administrator.contacts.answer')
        router
          .delete(':id', [controllers.administrator.contacts.delete.Delete])
          .as('administrator.contacts.delete')
      })
      .prefix('contacts')
  })
  .prefix('administrator')
  .use([middleware.auth(), middleware.role(STAFF_USER_ROLES)])
