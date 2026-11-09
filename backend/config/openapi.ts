/**
 * OpenAPI document configuration (extension point, KIT.md §3.4).
 *
 * Only what cannot be derived from the code lives here. Route, method, path parameters,
 * authentication requirement and roles come from the router itself at generation time
 * (`scripts/openapi/emit.ts`); payload and response come from the Zod schemas of
 * `@maiyu/shared` (`app/core/openapi/response.ts` points to each one). What is left is the
 * document identity and the human label of a tag.
 */
import { COOKIE_TOKEN } from '#config/session-token'

/**
 * Name of the security scheme referenced by every authenticated operation.
 *
 * It is `apiKey` in a cookie, not `bearer`: the guard reads the token from the access
 * cookie and has no fallback to the `Authorization` header
 * (`app/guards/cookie-access-tokens.guard.ts`). Documenting bearer here would make
 * Scalar's "Test Request" always fail.
 */
export const SECURITY_SCHEME = 'cookieAuth'

/** Cookie that carries the access token: the same name the guard reads. */
export const SECURITY_COOKIE = COOKIE_TOKEN.ACCESS

/**
 * Label of a group of operations in Scalar's sidebar, matched by **path** prefix and not
 * by route name. The prefixes are disjoint: every registered route matches exactly one
 * rule, and the generator warns about any that matches none.
 */
export type TagRule = {
  prefix: string
  name: string
  description: string
  /**
   * The resource noun, used to build the summary of each operation:
   * `create` + `anexo` -> "Criar anexo". Writing the pair once per group covers all its
   * operations, instead of one summary per controller.
   */
  singular?: string
  plural?: string
}

const tags: TagRule[] = [
  {
    prefix: '/authentication',
    name: 'Autenticação',
    description:
      'Entrada, saída e renovação da sessão do dono. O par de tokens viaja em cookie ' +
      '`httpOnly` e não no corpo, então estas rotas respondem `204` sem corpo: o que ' +
      'importa é o `Set-Cookie`.',
    singular: 'sessão',
    plural: 'sessões',
  },
  {
    prefix: '/storages',
    name: 'Anexos',
    description:
      'Upload em três passos, porque o binário não atravessa esta aplicação: o `POST` ' +
      'abre e devolve URLs assinadas, o navegador sobe as partes direto no bucket, e o ' +
      '`complete` confirma contra o objeto real.',
    singular: 'anexo',
    plural: 'anexos',
  },
]

const openapi = {
  info: {
    title: 'API Maiyu',
    version: '1.0.0',
  },
  /**
   * The variable, and not the value of `APP_SERVER_URL`: the document is generated and
   * committed, and writing the address of whoever generated it would make `--check`
   * report divergence on every machine with another `.env` (`_standards/openapi.md`).
   */
  servers: [
    {
      url: '{APP_SERVER_URL}',
      variables: { APP_SERVER_URL: { default: 'http://localhost:3333' } },
    },
  ],
  /** Paths that never enter the document: they are not API operations. */
  ignore: ['/documentation', '/openapi.json', '/health-check'],
  tags,
}

/**
 * A fixed summary for the action that needs a sentence other than the generic one. The
 * key is the controller file name without the suffix, and the value beats the mechanism
 * table of `scripts/openapi/emit.ts` and the group noun.
 */
export const ACTION_OVERRIDES: Readonly<Record<string, string>> = {
  // None: all actions are mechanism ones.
}

export default openapi
