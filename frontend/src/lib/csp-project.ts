/**
 * The third-party origins the project's images come from (map tiles, an embedded avatar host), added
 * to `img-src` of the document CSP by `src/server.ts` (`lib/security-headers.ts`). It is the
 * project's file (KIT.md §3.4): the sync creates this empty skeleton when it is missing and never
 * overwrites it. Origin only (`https://tile.openstreetmap.org`), never a path or a wildcard scheme:
 * every entry widens what a page may load.
 */
export const PROJECT_IMAGE_ORIGINS: ReadonlyArray<string> = []
