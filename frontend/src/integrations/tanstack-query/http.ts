/**
 * A única porta do frontend para a API: o espelho do `HTTPException` do backend (o
 * mesmo corpo, os mesmos status, os mesmos `code`s) e o único lugar onde o corpo
 * `unknown` vira tipo.
 *
 * O transporte é o Tuyau (`_doc-lib/tuyau.md`, "Quando adotar a biblioteca";
 * https://docs.adonisjs.com/guides/frontend/api-client, "Error handling"): URL por
 * padrão de rota do registro, `params`/`query`/`body` tipados e CSRF por
 * `credentials: 'include'`. Ele **não** tipa a resposta em runtime, então todo
 * retorno passa pelo schema `...Response` de `@maiyu/shared` antes de sair
 * daqui (`frontend.md` §3.3). E nenhum erro do Tuyau sai daqui: `TuyauHTTPError` e
 * `TuyauNetworkError` viram `HTTPError`, e quem trata erro nunca precisa conhecer o
 * transporte. O Ky entra só como dependência do Tuyau.
 *
 * Base: `interclasse/frontend/src/integrations/tanstack-query/http.ts` (corpo de
 * erro campo a campo, renovação deduplicada por escopo, cookie no SSR), com o
 * `fetch` trocado pelo cliente do Tuyau.
 */

import { createIsomorphicFn } from '@tanstack/react-start'
import { createTuyau } from '@tuyau/core/client'

import { env } from '#/env'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'
import { registry } from '@maiyu/backend/registry'
import type { z } from '@maiyu/shared'

import * as server from './http.server'

/**
 * O corpo de erro que toda rota da API devolve (`ErrorEnvelope` do backend).
 *
 * `errors` é `Record<string, string>` e não lista: o handler do backend guarda só a
 * primeira mensagem de cada campo. Tratar como lista faria a tela imprimir
 * `[object Object]`.
 */
export type HTTPErrorBody = {
  message: string
  status: number
  code: string
  errors?: Record<string, string>
}

/** Os status que mudam o comportamento da tela; o resto cai na faixa `>= 500`. */
export const HTTPStatus = {
  /** Não houve resposta: DNS, CORS, backend fora, requisição abortada. */
  NETWORK: 0,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

/**
 * Os `code`s que mudam o que a tela faz. Compare por `code`, nunca pela mensagem: a
 * mensagem é texto de interface e muda.
 */
export const HTTPErrorCode = {
  /** 401 do sign-in: credencial errada. **Não** merece refresh. */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  /** Sessão ausente ou vencida, vinda do guard. É o único 401 que merece refresh. */
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ACCESS_DENIED: 'ACCESS_DENIED',
  /** `DELETE /storages/:id` 409: alguém referencia o arquivo. */
  STORAGE_IN_USE: 'STORAGE_IN_USE',
  /** `POST /storages/:id/complete` 422: o objeto no bucket não confere. */
  STORAGE_SIZE_MISMATCH: 'STORAGE_SIZE_MISMATCH',
  /** Local: falha de rede normalizada. */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** Local: resposta de erro sem corpo JSON válido (proxy, HTML de erro). */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  /** Local: o corpo de sucesso não confere com o schema `...Response` de `shared/`. */
  INVALID_RESPONSE: 'INVALID_RESPONSE',
} as const

export class HTTPError extends Error {
  readonly status: number
  readonly code: string
  readonly errors?: Record<string, string>

  constructor(body: HTTPErrorBody) {
    super(body.message)
    this.name = 'HTTPError'
    this.status = body.status
    this.code = body.code
    this.errors = body.errors
  }

  /** Erro atribuível a campos do payload: 422 com `errors` preenchido. */
  get isFieldError(): boolean {
    return Boolean(this.errors && Object.keys(this.errors).length > 0)
  }

  /** Culpa do servidor ou da rede: 5xx e o status sintético 0. */
  get isServerError(): boolean {
    return this.status >= 500 || this.status === HTTPStatus.NETWORK
  }

  /** A sessão foi recusada: 401 de sessão (não o de credencial errada). */
  get isSessionRefusal(): boolean {
    return (
      this.status === HTTPStatus.UNAUTHORIZED &&
      this.code === HTTPErrorCode.AUTHENTICATION_REQUIRED
    )
  }

  /**
   * O que o Tuyau lançou (ou qualquer outra coisa) como `HTTPError`. Lido por
   * estrutura, sem `instanceof` das classes do Tuyau: `kind === 'network'` é falha de
   * transporte, sem `status` nem `response`; o resto traz o status real e o corpo.
   */
  static from(error: unknown): HTTPError {
    if (error instanceof HTTPError) return error

    if (!isTuyauError(error) || error.kind === 'network') {
      return new HTTPError({
        message: m.kit_error_network(),
        status: HTTPStatus.NETWORK,
        code: HTTPErrorCode.NETWORK_ERROR,
      })
    }

    const body = errorBody(error.response)

    return new HTTPError({
      message: body.message ?? m.kit_error_unknown(),
      status: body.status ?? error.status ?? HTTPStatus.INTERNAL_SERVER_ERROR,
      code: body.code ?? HTTPErrorCode.UNKNOWN_ERROR,
      errors: body.errors,
    })
  }
}

type TuyauErrorShape = {
  kind: string
  status?: number
  response?: unknown
}

function isTuyauError(value: unknown): value is TuyauErrorShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof value.kind === 'string'
  )
}

/**
 * O corpo de erro como chegou, campo a campo: o que não tem o tipo esperado fica de
 * fora e cai no fallback de `HTTPError.from`. Proxy e HTML de erro não seguem o
 * envelope da API.
 */
function errorBody(value: unknown): Partial<HTTPErrorBody> {
  if (typeof value !== 'object' || value === null) return {}

  const body: Partial<HTTPErrorBody> = {}

  if ('message' in value && typeof value.message === 'string')
    body.message = value.message
  if ('status' in value && typeof value.status === 'number')
    body.status = value.status
  if ('code' in value && typeof value.code === 'string') body.code = value.code
  if (
    'errors' in value &&
    typeof value.errors === 'object' &&
    value.errors !== null
  ) {
    body.errors = Object.fromEntries(
      Object.entries(value.errors).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  }

  return body
}

/**
 * A raiz **pública** da API: a que o navegador de quem visita alcança. Exportada
 * porque nem tudo passa por `request()`: o `href` de um download e o `src` de uma
 * imagem são o navegador buscando direto, e precisam do endereço público mesmo
 * quando o HTML nasce no SSR.
 */
export const BASE_URL = env.VITE_API_URL

/**
 * A raiz da API para quem está fazendo a requisição agora. No SSR quem chama é o
 * Nitro, e `SERVER_API_URL` (sem `VITE_`, nunca no bundle) evita a volta pela
 * internet. `process.env` é lido dentro de `.server()`, nunca no escopo do módulo:
 * no edge a variável chega por requisição.
 */
const baseUrl = createIsomorphicFn()
  .client((): string => BASE_URL)
  .server((): string => process.env.SERVER_API_URL ?? BASE_URL)

/** No navegador o `credentials: 'include'` leva o cookie; no SSR o repasse é obrigatório. */
const inboundCookie = createIsomorphicFn()
  .client((): string | undefined => undefined)
  .server(server.inboundCookie)

// `.server()` first: it fixes the `(cookie, response)` signature, and the browser side,
// which does not read the response, declares only what it uses.
const applySetCookie = createIsomorphicFn()
  .server(server.applySetCookie)
  .client((cookie: string | undefined) => cookie)

/**
 * O prazo de uma requisição. O `signal` do TanStack Query só aborta quando o
 * componente desmonta; sem teto, um servidor que aceita a conexão e não responde
 * prende o HTML inteiro do SSR. 15s é para a patologia; o ritmo normal é o `retry`
 * de `query-context.ts`.
 */
const TIMEOUT = 15_000

type CallOptions = {
  /** O `signal` de quem chama (TanStack Query, upload cancelável). */
  readonly signal?: AbortSignal
}

/** O que só o próprio `http.ts` passa: o cookie da renovação e a trava dela. */
type Retry = {
  readonly cookie?: string
  readonly skipRefresh?: boolean
  readonly onSetCookie?: (cookie: string | undefined) => void
}

function createClient(options: CallOptions, retry: Retry) {
  const cookie = retry.cookie ?? inboundCookie()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // O idioma da tela vai junto (`_standards/i18n.md` §2): a API responde a mensagem
    // de erro e o 422 nele. É cabeçalho da lista segura do CORS, sem preflight.
    'Accept-Language': getLocale(),
  }
  if (cookie) headers.cookie = cookie

  return createTuyau({
    baseUrl: baseUrl(),
    registry,
    credentials: 'include',
    headers,
    timeout: TIMEOUT,
    signal: options.signal,
    // Quem repete é o `retry` de `query-context.ts`, com a regra de 4xx nunca; o do
    // Ky repetiria um POST por conta própria.
    retry: 0,
    hooks: {
      afterResponse: [
        (_request: Request, _options: unknown, response: Response) => {
          // Repassar `Set-Cookie` ao navegador vale para toda resposta, não só a do refresh.
          retry.onSetCookie?.(applySetCookie(cookie, response))
        },
      ],
    },
  })
}

/** O cliente que a chamada recebe: `api.get('/rota/:id', { params })`, `api.post(...)`. */
export type Api = ReturnType<typeof createClient>

/** Uma chamada do Tuyau sobre o cliente: o que `request` e `send` recebem. */
export type ApiCall = (api: Api) => PromiseLike<unknown>

/**
 * Uma renovação por vez. O backend rotaciona o refresh token, então cinco queries que
 * levam 401 juntas e disparam cinco refreshes gastariam o mesmo token cinco vezes. No
 * navegador o dono é o processo; no SSR é a **requisição** (`runInRequestScope` de
 * `http.server.ts`, aberto pelo middleware de `src/start.ts`).
 */
let clientRenewal: Promise<string | undefined> | null = null

const pendingRenewal = createIsomorphicFn()
  .client((): Promise<string | undefined> | null => clientRenewal)
  .server(() => server.requestScope()?.renewal ?? null)

const setPendingRenewal = createIsomorphicFn()
  .client((pending: Promise<string | undefined> | null) => {
    clientRenewal = pending
  })
  .server((pending: Promise<string | undefined> | null) => {
    const scope = server.requestScope()
    // Fora de um ciclo de requisição (teste, script) a renovação só não é compartilhada.
    if (scope) scope.renewal = pending
  })

async function renew(cookie: string | undefined): Promise<string | undefined> {
  let pending = pendingRenewal()

  if (!pending) {
    pending = refresh(cookie)
    setPendingRenewal(pending)
  }

  try {
    return await pending
  } finally {
    if (pendingRenewal() === pending) setPendingRenewal(null)
  }
}

async function refresh(
  cookie: string | undefined,
): Promise<string | undefined> {
  let renewed: string | undefined

  await perform(
    (api) => api.post('/authentication/refresh', {}),
    {},
    {
      cookie,
      skipRefresh: true,
      onSetCookie: (next) => {
        renewed = next
      },
    },
  )

  return renewed
}

/**
 * A chamada com duas garantias a mais: toda falha sai como `HTTPError` com `status`,
 * e a sessão vencida é renovada sem a tela perceber (só no 401 com
 * `AUTHENTICATION_REQUIRED`, uma vez, e a repetição já leva o cookie novo).
 *
 * Não há token em `localStorage` nem em `document.cookie`: os cookies do backend são
 * `httpOnly`, e quem está logado se descobre perguntando à API.
 */
async function perform(
  call: ApiCall,
  options: CallOptions,
  retry: Retry,
): Promise<unknown> {
  const cookie = retry.cookie ?? inboundCookie()

  try {
    return await call(createClient(options, { ...retry, cookie }))
  } catch (error) {
    const failure = HTTPError.from(error)

    if (failure.isSessionRefusal && !retry.skipRefresh) {
      // Se o refresh falhar, o `HTTPError` dele sobe daqui e a guarda da rota trata
      // como não autenticado, que é o que é.
      const renewed = await renew(cookie)
      return await perform(call, options, {
        cookie: renewed,
        skipRefresh: true,
      })
    }

    throw failure
  }
}

/**
 * Uma requisição que devolve registro: o corpo `unknown` vira tipo aqui, e só aqui,
 * pelo schema `...Response` de `@maiyu/shared`. Corpo fora do contrato é falha
 * do servidor (`BAD_GATEWAY` com `INVALID_RESPONSE`), nunca dado torto que estoura na
 * tela.
 *
 * ```ts
 * request(PostsShowResponse, (api) => api.get('/posts/:id', { params: { id } }), { signal })
 * ```
 */
export async function request<TSchema extends z.ZodType>(
  schema: TSchema,
  call: ApiCall,
  options: CallOptions = {},
): Promise<z.output<TSchema>> {
  const parsed = schema.safeParse(await perform(call, options, {}))

  if (!parsed.success) {
    throw new HTTPError({
      message: m.kit_error_unknown(),
      status: HTTPStatus.BAD_GATEWAY,
      code: HTTPErrorCode.INVALID_RESPONSE,
    })
  }

  return parsed.data
}

/** Uma requisição sem retorno (204): sign-in, sign-out, arquivar, excluir. */
export async function send(
  call: ApiCall,
  options: CallOptions = {},
): Promise<void> {
  await perform(call, options, {})
}
