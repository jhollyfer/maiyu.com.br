import { ESLint, Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Every route that loads data declares the skeleton of its final screen (_standards/frontend.md §5,
 * DECISIONS.md #808): the rule lives in `eslint.config.js` (`ROUTE_PENDING`). This suite holds it to
 * where it applies (route files, not the lazy half, not `__root`) and what it reports.
 */
const Restricted = z.object({
  rules: z.object({
    'no-restricted-syntax': z
      .tuple([z.union([z.string(), z.number()])])
      .rest(z.object({ selector: z.string(), message: z.string() })),
  }),
})

const eslint = new ESLint({ overrideConfigFile: 'eslint.config.js' })

async function selectorsFor(path: string) {
  const config: unknown = await eslint.calculateConfigForFile(path)
  const [, ...selectors] =
    Restricted.parse(config).rules['no-restricted-syntax']
  return selectors
}

async function hits(
  code: string,
  path = 'src/routes/_private/posts/index.tsx',
) {
  const selectors = await selectorsFor(path)
  const linter = new Linter()
  return linter
    .verify(
      code,
      [
        {
          files: ['**/*.tsx'],
          languageOptions: { parser: tseslint.parser },
          rules: { 'no-restricted-syntax': ['error', ...selectors] },
        },
      ],
      { filename: path },
    )
    .filter((each) => !each.message.startsWith('Colaborador'))
    .map((each) => each.message)
}

describe('ROUTE_PENDING: a loader needs a skeleton', () => {
  it('refuses a route with `loader` and no `pendingComponent`', async () => {
    const found = await hits(`
      export const Route = createFileRoute('/_private/posts/')({
        loader: ({ context }) => context.queryClient.query(postsQueryOptions()),
      })
    `)

    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/`loader` que busca dado sem `pendingComponent`/)
  })

  it('passes the route with its own skeleton', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/_private/posts/')({
          loader: () => load(),
          pendingComponent: () => <TableSkeleton headers={['A']} />,
        })
      `),
    ).toEqual([])
  })

  it('passes the layout that hands the wait to the child (`Outlet`)', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/$city')({
          loader: () => load(),
          pendingComponent: Outlet,
        })
      `),
    ).toEqual([])
  })

  it('refuses `pendingComponent: Outlet` on a layout of `ssr: data-only` or `false`', async () => {
    for (const ssr of ["'data-only'", 'false']) {
      const found = await hits(`
        export const Route = createFileRoute('/_private')({
          ssr: ${ssr},
          pendingComponent: Outlet,
          beforeLoad: () => guard(),
        })
      `)

      expect(found).toHaveLength(1)
      expect(found[0]).toMatch(/não usa `pendingComponent: Outlet`/)
    }
  })

  it('passes a layout without `ssr` or with `ssr: true` that uses `Outlet`', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/$city')({
          ssr: true,
          loader: () => load(),
          pendingComponent: Outlet,
        })
      `),
    ).toEqual([])
  })

  it('refuses a listing loader that does not look at `cause`', async () => {
    const found = await hits(`
      export const Route = createFileRoute('/_private/posts/')({
        validateSearch,
        pendingComponent: () => <TableSkeleton />,
        loaderDeps: ({ search }) => ({ search }),
        loader: ({ context, deps }) => context.queryClient.query(postsQueryOptions(deps.search)),
      })
    `)

    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/Listagem com `loaderDeps`/)
  })

  it('passes a detail route whose loader uses `params` (the guard is for listings only)', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/_private/events/$id/')({
          validateSearch,
          pendingComponent: () => <TableSkeleton />,
          loaderDeps: ({ search }) => ({ search }),
          loader: ({ context, deps, params }) =>
            context.queryClient.query(registrationsQueryOptions(params.id, deps.search)),
        })
      `),
    ).toEqual([])
  })

  it('passes a detail loader that destructures `params` too', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/_private/events/$id/')({
          validateSearch,
          pendingComponent: () => <TableSkeleton />,
          loaderDeps: ({ search }) => ({ search }),
          loader: async ({ context, params: { id } }) => {
            await context.queryClient.query(eventQueryOptions(id))
          },
        })
      `),
    ).toEqual([])
  })

  it('passes the listing loader that stands down on `stay`', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/_private/posts/')({
          validateSearch,
          pendingComponent: () => <TableSkeleton />,
          loaderDeps: ({ search }) => ({ search }),
          loader: ({ context, deps, cause }) => {
            if (cause === 'stay') return undefined
            return context.queryClient.query(postsQueryOptions(deps.search))
          },
        })
      `),
    ).toEqual([])
  })

  it('passes a route with no loader (nothing to wait for)', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/_private/profile/')({
          staticData: { crumb: () => 'x' },
        })
      `),
    ).toEqual([])
  })

  it('does not take a nested `loader` key for the route one', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/x/')({
          head: () => ({ meta: [{ loader: 1 }] }),
        })
      `),
    ).toEqual([])
  })
})

describe('ROUTE_PENDING: only a loader that fetches', () => {
  it('passes a loader that only throws notFound() (the wildcard route)', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/$')({
          loader: () => {
            throw notFound()
          },
        })
      `),
    ).toEqual([])
  })

  it('passes a loader that only redirects', async () => {
    expect(
      await hits(`
        export const Route = createFileRoute('/old/')({
          loader: () => {
            throw redirect({ to: '/new' })
          },
        })
      `),
    ).toEqual([])
  })

  it.each([
    [
      'a query',
      `loader: ({ context }) => context.queryClient.query(postsQueryOptions())`,
    ],
    [
      'ensureQueryData',
      `loader: ({ context }) => context.queryClient.ensureQueryData(postsQueryOptions())`,
    ],
    [
      'Promise.all of queries',
      `loader: async ({ context }) => { await Promise.all([context.queryClient.query(a()), context.queryClient.query(b())]) }`,
    ],
    [
      'a helper (CityGuard.require)',
      `loader: ({ context, params }) => CityGuard.require({ context, slug: params.city })`,
    ],
    [
      'a fetch before a notFound',
      `loader: async () => { const row = await loadOrNotFound(get()); if (!row) throw notFound() }`,
    ],
  ])('refuses a loader that calls %s', async (_name, loader) => {
    const found = await hits(`
      export const Route = createFileRoute('/_private/posts/')({
        ${loader},
      })
    `)

    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/que busca dado/)
  })
})

describe('ROUTE_PENDING: the spinner is the root fallback', () => {
  it('refuses `pendingComponent: () => <RoutePending />` too', async () => {
    const found = await hits(`
      export const Route = createFileRoute('/_private')({
        pendingComponent: () => <RoutePending />,
      })
    `)

    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/fallback raiz do router/)
  })

  it('refuses `pendingComponent: RoutePending` in a route', async () => {
    const found = await hits(`
      export const Route = createFileRoute('/_private')({
        pendingComponent: RoutePending,
      })
    `)

    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/fallback raiz do router/)
  })

  it('refuses it in a route that also has a loader (one report, the spinner)', async () => {
    const found = await hits(`
      export const Route = createFileRoute('/_private/posts/')({
        loader: () => load(),
        pendingComponent: RoutePending,
      })
    `)

    expect(found).toHaveLength(1)
  })
})

describe('ROUTE_PENDING: where it applies', () => {
  it.each([
    'src/routes/_private/posts/index.tsx',
    'src/routes/_private/layout.tsx',
    'src/routes/$city/layout.tsx',
  ])('charges %s', async (path) => {
    const messages = (await selectorsFor(path)).map((each) => each.message)

    expect(messages.some((each) => each.includes('que busca dado'))).toBe(true)
  })

  it.each([
    'src/routes/_private/posts/index.lazy.tsx',
    'src/routes/__root.tsx',
    'src/components/common/route-status/route-pending.tsx',
  ])('does not charge %s', async (path) => {
    const messages = (await selectorsFor(path)).map((each) => each.message)

    expect(messages.some((each) => each.includes('que busca dado'))).toBe(false)
  })
})
