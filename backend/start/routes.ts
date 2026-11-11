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

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
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
router.get('/health-check', [controllers.HealthCheck]).as('health-check')

/** The document does not document itself: both routes stay outside every authenticated group. */
router
  .get('/openapi.json', [controllers.documentation.openapi.show.Show])
  .as('documentation.openapi')
  .use(middleware.documentation())

router
  .get('/documentation', [controllers.documentation.reference.show.Show])
  .as('documentation.reference')
  .use(middleware.documentation())

/**
 * The entry door: requiring a session here would make it unreachable. What changes state
 * travels in the `httpOnly` cookies.
 */
router
  .group(() => {
    router
      .post('sign-in', [controllers.authentication.sessions.signIn.SignIn])
      .use([signInThrottle, signInAccountThrottle])
    // Signing out deletes *this* session's tokens, so it is the only one that needs it.
    router
      .post('sign-out', [controllers.authentication.sessions.signOut.SignOut])
      .use(middleware.auth())
    // Outside `auth()`: the expired access token is what brings the client here, and the
    // refresh cookie is what authorizes.
    router
      .post('refresh', [controllers.authentication.sessions.refresh.Refresh])
      .use(refreshThrottle)
  })
  .prefix('authentication')
  .as('authentication')

/**
 * Attachments, for every signed-in role. The binary never passes through the API: `POST`
 * returns signed part URLs, the browser uploads to the bucket and `complete` confirms.
 */
router
  .group(() => {
    router.get('/', [controllers.storages.files.paginate.Paginate])
    router
      .post('/', [controllers.storages.files.create.Create])
      .use(uploadThrottle)
    router
      .post(':id/complete', [controllers.storages.files.complete.Complete])
      .as('complete')
      .use(uploadThrottle)
    // Before `:id`: the two-segment path must not be swallowed by the generic one.
    router
      .get(':id/parts', [controllers.storages.files.parts.Parts])
      .as('parts')
      .use(uploadThrottle)
    router.get(':id', [controllers.storages.files.show.Show])
    router.delete(':id', [controllers.storages.files.delete.Delete])
    // Behind the session: outside it, it would mint signed URLs for any uuid.
    router
      .get(':id/download', [controllers.storages.files.download.Download])
      .as('download')
  })
  .prefix('storages')
  .as('storages')
  .use(middleware.auth())
