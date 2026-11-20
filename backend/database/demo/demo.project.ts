import type Tenant from '#models/tenant'

/** The demo tenants (one per `TENANT_TYPE`) a project's seed and purge work in. */
export type DemoContext = {
  readonly tenants: ReadonlyArray<Tenant>
}

/**
 * The answer of `DemoProject.ready` (DECISIONS.md #807): `{ ok: true }`, or `{ ok: false, reason }`
 * with the log line that says why the demonstration is not safe here yet.
 */
export type DemoReadiness =
  { readonly ok: true } | { readonly ok: false; readonly reason: string }

/**
 * The project's part of the demonstration (DECISIONS.md #802). It is the project's file
 * (KIT.md §3.4): the sync creates this skeleton when it is missing and never overwrites it. Both
 * methods start empty.
 *
 * `seed` creates **one** record of each entity of the product in each demo tenant, and one image
 * (`DemoImage.of(tenant, '<label>')`) for each record that needs one: no list, no batch, no random
 * data. It runs on every deploy, so each write is `firstOrCreate` by a natural key and a second
 * run creates nothing. `ready` is the project's precondition (DECISIONS.md #807): the demo accounts
 * have a known password and, in production too, one of them is the platform OWNER, so the project
 * answers `{ ok: false, reason }` while a demo account could write into a real tenant (for example
 * a domain repository that is not scoped by tenant yet). The seeder then skips **everything**, the
 * accounts included, with one log line. The default is `{ ok: true }`. `purge` deletes what `seed` created, before `demo:purge` removes the files,
 * the tenants and the accounts: a table that points to `tenants` or `storages` without cascade has
 * to be emptied here, or the tenant cannot be deleted. The same goes for a table with a foreign key to
 * `users` without cascade (`SET NULL` and `CASCADE` are fine): the demo accounts go after this
 * method, so a row left pointing at one makes the purge of the accounts fail. Neither touches a row that is not in a demo
 * tenant.
 */
export class DemoProject {
  static ready(): DemoReadiness {
    return { ok: true }
  }

  static seed(context: DemoContext): Promise<void> {
    void context

    return Promise.resolve()
  }

  static purge(context: DemoContext): Promise<void> {
    void context

    return Promise.resolve()
  }
}
