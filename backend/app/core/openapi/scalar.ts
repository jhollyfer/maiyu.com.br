/**
 * The API reference page.
 *
 * Scalar comes in through the standalone CDN bundle, pinned by version. Installing
 * `@scalar/api-reference` as a dependency would bring a frontend tree into
 * the backend build just to serve a `<script>`, and `node ace build`
 * would have to learn to copy it.
 *
 * The version is pinned on purpose: `@latest` would make the documentation change
 * behavior without any commit in the repository.
 */

const SCALAR_VERSION = '1.64.0'

const CDN = `https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}/dist/browser/standalone.js`

/**
 * The CSP of the documentation page. The rest of the API (`config/shield.ts`)
 * refuses everything, and this page needs the Scalar bundle, the inline script
 * that mounts it and the `/openapi.json` of its own origin. Framing stays
 * forbidden. The controller sets it on the response, and the response header
 * wins over the one Shield wrote earlier in the chain.
 */
export const DOCUMENTATION_CSP = [
  "default-src 'none'",
  "script-src https://cdn.jsdelivr.net 'unsafe-inline'",
  "style-src 'unsafe-inline' https://cdn.jsdelivr.net",
  'font-src https://cdn.jsdelivr.net data:',
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
].join('; ')

/** The Scalar reference page, built from the document URL and the API title. */
export class ScalarPage {
  /**
   * The interface chrome stays in English: Scalar translates to `en`, `ru`, `es`,
   * `fr`, `de`, `zh-CN` and `ar`, and Portuguese is not on the list. The content -
   * summary, description and error message - is in English as well.
   */
  static html(specUrl: string, title: string): string {
    const configuration = JSON.stringify({
      url: specUrl,
      theme: 'default',
      hideDownloadButton: false,
      // `components.schemas` exists for the operations to reference and for whoever
      // generates a typed client. As a menu section it only invites reading the API by the
      // shape of the data, which is the opposite of what this documentation describes - the
      // contract is the operation, not the entity.
      hideModels: true,
      // The default fonts come from another host, which the page CSP does not allow.
      withDefaultFonts: false,
    })

    return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title}</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="${CDN}"></script>
    <script>
      Scalar.createApiReference('#app', ${configuration})
    </script>
  </body>
</html>
`
  }
}
