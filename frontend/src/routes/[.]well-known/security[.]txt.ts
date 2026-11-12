import { createFileRoute } from '@tanstack/react-router'

import { SecurityTxt } from '#/lib/security-txt'
import { readRuntimeEnv } from '#/lib/server-env'

/**
 * A server route like `robots.txt`: the contact comes from `SECURITY_CONTACT`, read inside the
 * handler, so the same image serves every environment. Without the variable it answers 404,
 * which is what a scanner already gets from a site that publishes none
 * (_doc-lib/tanstack-start.md#guide/server-routes).
 */
export const Route = createFileRoute('/.well-known/security.txt')({
  server: {
    handlers: {
      GET: () => {
        const { securityContact } = readRuntimeEnv(process.env)
        if (!securityContact) return new Response('Not found', { status: 404 })

        return new Response(
          SecurityTxt.render({
            contact: securityContact,
            now: new Date(),
          }),
          {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, max-age=86400',
            },
          },
        )
      },
    },
  },
})
