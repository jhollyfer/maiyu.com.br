import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { createElement } from 'react'

export type TestRoute = Readonly<{
  /** The route path, as `createRoute` takes it (`/groups/new`). */
  path: string
  component: () => React.JSX.Element
}>

/**
 * Test helper: mounts `routes` in a router with a memory history, opened at `initialPath`, and
 * returns a reader of the current pathname. A component that needs the router (`useNavigate`,
 * `Link`, a blocker) is tested inside a real one, not behind a mock of `@tanstack/react-router`.
 * `.ts` and `createElement`, not `.tsx`: `lib/` holds no JSX (`frontend.md` §1.1). Only tests import it.
 *
 * `navigate({ to })` in a test type-checks against the registered router, so the destination
 * is a route the kit brings to every app (`/health-check`); only `path` here is free.
 * _doc-lib/tanstack-router.md#guide/history-types.
 */
export function renderWithRouter(
  routes: ReadonlyArray<TestRoute>,
  initialPath: string,
): () => string {
  const root = createRootRoute()
  const children = routes.map((route) =>
    createRoute({
      getParentRoute: () => root,
      path: route.path,
      component: route.component,
    }),
  )
  const router = createRouter({
    routeTree: root.addChildren(children),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  render(createElement(RouterProvider, { router }))

  return (): string => router.state.location.pathname
}
