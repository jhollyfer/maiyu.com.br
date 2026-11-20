/**
 * Redirect `Location` as the browser must receive it: path, query and hash, never the origin.
 *
 * Behind the TLS proxy (Traefik, Cloudflare) Nitro sees the request as `http://<host>`, and
 * `paraglideMiddleware` builds its 307 from that URL: `Location: http://<host>/pt-br`, a
 * downgrade the browser follows (or blocks as mixed content). A relative `Location` is valid
 * (RFC 9110 §10.2.2, https://www.rfc-editor.org/rfc/rfc9110#section-10.2.2) and needs no
 * trusted `X-Forwarded-Proto`: the browser resolves it against the URL it really asked for.
 * The middleware's own `effectiveRequestUrl` would need that header
 * (_doc-lib/paraglide.md#/middleware, https://paraglidejs.com/middleware), and `onRedirect`
 * only observes the response.
 *
 * Pure and free of `#/` imports, so a test hands in its own request and response.
 */
export class RelativeRedirect {
  /**
   * The same response when it is not a redirect, has no `Location`, or points to another origin
   * (an OAuth provider, say); otherwise a copy whose `Location` lost the request's origin. The
   * body is passed on unread.
   */
  static apply(request: Request, response: Response): Response {
    const location = response.headers.get('Location')
    if (response.status < 300 || response.status >= 400 || !location) {
      return response
    }

    const requestUrl = new URL(request.url)
    const target = new URL(location, requestUrl)
    if (target.origin !== requestUrl.origin) return response
    // `//host/x` is protocol-relative: the browser would leave for `host`. A same-origin path that
    // starts with two slashes stays absolute.
    if (target.pathname.startsWith('//')) return response

    const headers = new Headers(response.headers)
    headers.set('Location', `${target.pathname}${target.search}${target.hash}`)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}
