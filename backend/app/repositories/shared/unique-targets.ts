/**
 * The unique indexes of the project's own tables that `LucidMapping.insertUnlessUnique` tolerates
 * (DECISIONS.md #408), as the SQL `ON CONFLICT` takes them: a column (`(document)`), several
 * (`(tenant_id, document)`) or an expression (`(lower(slug))`). It is the project's file (KIT.md
 * §3.4): the sync creates this empty skeleton when it is missing and never overwrites it, and
 * `lucid-mapping.ts` merges it into the kit's `UNIQUE_TARGET`. Closed on purpose: the kit takes a
 * name from here, never a string typed in a repository, and `as const` keeps each target a literal
 * type.
 */
export const PROJECT_UNIQUE_TARGET = {} as const satisfies Record<
  string,
  string
>
