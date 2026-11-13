/**
 * The city segment of a public URL (DECISIONS.md #390): `/pt-br/<city>/...`. The router reads the
 * path without the language (the `rewrite` of `router.tsx` takes the prefix off), so here the city
 * is the first segment. A city slug never collides with a language prefix: the backend refuses
 * one on the city's registration (`Rule.slug()` of the shared).
 */
export class CityPath {
  /** The city of a router path (`/tabatinga/agenda` gives `tabatinga`); `null` at the root. */
  static slugOf(pathname: string): string | null {
    const [segment] = pathname.split('/').filter(Boolean)

    return segment ?? null
  }

  /** The same page in another city: only the first segment changes, the rest of the path stays. */
  static switchTo(pathname: string, slug: string): string {
    const [, ...rest] = pathname.split('/').filter(Boolean)

    return `/${[slug, ...rest].join('/')}`
  }
}
