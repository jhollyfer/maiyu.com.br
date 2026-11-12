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
  accountThrottle,
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
 * The owner's own account (DECISIONS.md #413): who is signed in reads and edits it, and no other.
 * The edit checks the current password, hence the ceiling per user.
 */
router
  .group(() => {
    router
      .get('/', [controllers.account.profile.show.Show])
      .as('account.profile.show')
    router
      .put('/', [controllers.account.profile.update.Update])
      .as('account.profile.update')
      .use(accountThrottle)
  })
  .prefix('account/profile')
  .use(middleware.auth())

/**
 * The tenant the session works in (DECISIONS.md #390): the account's memberships and the pick
 * among them. The role inside a tenant is the membership's, read on every request.
 */
router
  .group(() => {
    router
      .get('/', [controllers.authentication.tenants.list.List])
      .as('authentication.tenants.list')
    router
      .put('active', [controllers.authentication.tenants.select.Select])
      .as('authentication.tenants.select')
  })
  .prefix('authentication/tenants')
  .use(middleware.auth())

/**
 * The public catalog of cities and of the clients of each one, the segments the frontend puts
 * after the language (`/pt-br/<city>/<tenant>`). The city segment resolves the tenant scope.
 */
router
  .group(() => {
    router
      .get('cities', [controllers.storefront.cities.list.List])
      .as('storefront.cities.list')
    router
      .get('cities/:city/tenants', [controllers.storefront.tenants.list.List])
      .as('storefront.tenants.list')
      .use(middleware.publicTenant())
  })
  .prefix('storefront')

/** The platform owner's area: the city catalog, the tenants and their members, and the counts. */
router
  .group(() => {
    router
      .post('cities', [controllers.platform.cities.create.Create])
      .as('platform.cities.create')
    router
      .put('cities/:id', [controllers.platform.cities.update.Update])
      .as('platform.cities.update')
    router
      .delete('cities/:id', [controllers.platform.cities.delete.Delete])
      .as('platform.cities.delete')
    router
      .get('overview', [controllers.platform.overview.show.Show])
      .as('platform.overview.show')
    // The tenants and who works in each (DECISIONS.md #397): the seeder is not the only door.
    router
      .post('tenants', [controllers.platform.tenants.create.Create])
      .as('platform.tenants.create')
    router
      .put('tenants/:id', [controllers.platform.tenants.update.Update])
      .as('platform.tenants.update')
    router
      .put('tenants/:id/members', [controllers.platform.members.save.Save])
      .as('platform.members.save')
    router
      .delete('members/:id', [controllers.platform.members.delete.Delete])
      .as('platform.members.delete')
  })
  .prefix('platform')
  .use([middleware.auth(), middleware.platform()])

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
    // The end customer's upload (a payment proof, DECISIONS.md #397): the file goes to the store
    // the URL names, owned by the customer; the rest of the flow is the routes below, by id.
    router
      .post('cities/:city/tenants/:tenant', [
        controllers.storages.files.create.Create,
      ])
      .as('storages.files.create-for-tenant')
      .use([middleware.publicTenant({ access: 'customer' }), uploadThrottle])
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
