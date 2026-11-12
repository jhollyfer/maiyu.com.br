import { createFileRoute } from '@tanstack/react-router'

/**
 * Liveness only: Nitro is up and answering. It never calls the API, because a probe that
 * depends on its neighbor restarts a healthy app when the other one is down
 * (architecture.md §7, _doc-lib/tanstack-start.md#guide/server-routes).
 */
export const Route = createFileRoute('/health-check')({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          { status: 'ok' },
          { headers: { 'Cache-Control': 'no-store' } },
        ),
    },
  },
})
