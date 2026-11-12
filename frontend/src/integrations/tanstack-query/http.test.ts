import type * as StartServer from '@tanstack/react-start/server'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { env } from '#/env'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'
import { z } from '@maiyu/shared'

import {
  BASE_URL,
  HTTPError,
  HTTPErrorCode,
  HTTPStatus,
  request,
  send,
} from './http'
import { runInRequestScope } from './http.server'

/**
 * The cookie the browser sent to Nitro. Outside a test that sets it, there is no
 * inbound request, as in a script.
 */
const inbound = vi.hoisted(() => ({ cookie: '' }))

vi.mock('@tanstack/react-start/server', async (importOriginal) => ({
  ...(await importOriginal<typeof StartServer>()),
  getRequestHeader: () => inbound.cookie || undefined,
  appendResponseHeader: () => undefined,
}))

/** The schema that accepts everything: what is measured here is the transport. */
const ANY = z.unknown()

const RECORD = z.object({ id: z.string() })

type Reply = { status: number; body?: unknown; headers?: HeadersInit }

/** Ky hands `fetch` a `Request`; a string only shows up if that ever changes. */
function toRequest(input: RequestInfo | URL): Request {
  if (input instanceof Request) return input
  return new Request(input)
}

function jsonResponse(reply: Reply): Response {
  let payload: string | null = null
  if (reply.body !== undefined) payload = JSON.stringify(reply.body)

  const headers = new Headers(reply.headers)
  if (payload !== null) headers.set('Content-Type', 'application/json')

  return new Response(payload, { status: reply.status, headers })
}

/** The body of each request as it reached `fetch`: Ky consumes the stream afterwards. */
const bodies = new WeakMap<Request, string>()

/**
 * Replaces `fetch` with a router over the path: each call goes to the first rule whose
 * path is in the URL. Returns the requests in the order they arrived.
 */
function serve(routes: Record<string, (call: number) => Reply>) {
  const requests: Array<Request> = []
  const counts = new Map<string, number>()

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const incoming = toRequest(input)
    requests.push(incoming)
    bodies.set(incoming, await incoming.clone().text())
    const path = new URL(incoming.url).pathname
    const handler = routes[path]

    if (!handler) throw new TypeError('Failed to fetch')

    const call = counts.get(path) ?? 0
    counts.set(path, call + 1)

    return jsonResponse(handler(call))
  })

  return requests
}

function respond(reply: Reply) {
  return serve({
    '/storages': () => reply,
    '/authentication/sign-in': () => reply,
  })
}

const SESSION_EXPIRED: Reply = {
  status: 401,
  body: {
    message: 'Sessão expirada',
    status: 401,
    code: HTTPErrorCode.AUTHENTICATION_REQUIRED,
  },
}

const CREDENTIALS_INVALID: Reply = {
  status: 401,
  body: {
    message: 'Credenciais inválidas',
    status: 401,
    code: HTTPErrorCode.INVALID_CREDENTIALS,
  },
}

/** Captures the already typed rejection; anything that is not an `HTTPError` fails. */
async function rejection(promise: Promise<unknown>): Promise<HTTPError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof HTTPError) return error

    throw new Error('expected an HTTPError, got '.concat(String(error)))
  }

  throw new Error('expected a rejection, the promise resolved')
}

const readStorages = () => request(ANY, (api) => api.get('/storages', {}))

const signIn = () =>
  send((api) =>
    api.post('/authentication/sign-in', {
      body: { login: 'ana@escola.br', password: 'segredo' },
    }),
  )

function pathsOf(requests: ReadonlyArray<Request>): Array<string> {
  return requests.map((entry) => new URL(entry.url).pathname)
}

beforeEach(() => {
  inbound.cookie = ''
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete process.env.SERVER_API_URL
})

test('returns the body parsed by the schema', async () => {
  respond({ status: 200, body: { id: 'a', extra: true } })

  await expect(
    request(RECORD, (api) => api.get('/storages', {})),
  ).resolves.toEqual({ id: 'a' })
})

test('a 200 outside the schema becomes 502 INVALID_RESPONSE', async () => {
  respond({ status: 200, body: { id: 1 } })

  const error = await rejection(
    request(RECORD, (api) => api.get('/storages', {})),
  )

  expect(error.status).toBe(HTTPStatus.BAD_GATEWAY)
  expect(error.code).toBe(HTTPErrorCode.INVALID_RESPONSE)
  expect(error.isServerError).toBe(true)
})

test('a 204 where a record was expected becomes 502 INVALID_RESPONSE', async () => {
  respond({ status: 204 })

  const error = await rejection(
    request(RECORD, (api) => api.get('/storages', {})),
  )

  expect(error.status).toBe(HTTPStatus.BAD_GATEWAY)
  expect(error.code).toBe(HTTPErrorCode.INVALID_RESPONSE)
})

test('a 422 becomes a field error', async () => {
  respond({
    status: 422,
    body: {
      message: 'Dados inválidos',
      status: 422,
      code: HTTPErrorCode.VALIDATION_ERROR,
      errors: { name: 'x' },
    },
  })

  const error = await rejection(signIn())

  expect(error.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY)
  expect(error.code).toBe(HTTPErrorCode.VALIDATION_ERROR)
  expect(error.isFieldError).toBe(true)
  expect(error.isServerError).toBe(false)
  expect(error.errors).toEqual({ name: 'x' })
})

test('drops error fields of the wrong type', async () => {
  respond({
    status: 422,
    body: { message: 42, status: 422, errors: [{ field: 'name' }] },
  })

  const error = await rejection(signIn())

  expect(error.errors).toEqual({})
  expect(error.isFieldError).toBe(false)
  expect(error.message).toBe(m.kit_error_unknown())
  expect(error.code).toBe(HTTPErrorCode.UNKNOWN_ERROR)
  expect(error.status).toBe(422)
})

test('an unreadable error body keeps the real status', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('<html>502 Bad Gateway</html>', {
      status: 502,
      headers: { 'Content-Type': 'text/html' },
    }),
  )

  const error = await rejection(readStorages())

  expect(error.status).toBe(502)
  expect(error.code).toBe(HTTPErrorCode.UNKNOWN_ERROR)
  expect(error.message).toBe(m.kit_error_unknown())
  expect(error.isServerError).toBe(true)
})

test('a network failure becomes status 0 NETWORK_ERROR', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(
    new TypeError('Failed to fetch'),
  )

  const error = await rejection(readStorages())

  expect(error.status).toBe(HTTPStatus.NETWORK)
  expect(error.code).toBe(HTTPErrorCode.NETWORK_ERROR)
  expect(error.message).toBe(m.kit_error_network())
  expect(error.isServerError).toBe(true)
})

test('aborts after 15000 ms without a response', async () => {
  vi.useFakeTimers()
  const requests: Array<Request> = []

  vi.spyOn(globalThis, 'fetch').mockImplementation(
    (input) =>
      new Promise<Response>((_resolve, reject) => {
        const incoming = toRequest(input)
        requests.push(incoming)
        incoming.signal.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      }),
  )

  const pending = rejection(readStorages())

  await vi.advanceTimersByTimeAsync(14_999)
  expect(requests[0]?.signal.aborted).toBe(false)

  await vi.advanceTimersByTimeAsync(1)
  const error = await pending

  expect(requests[0]?.signal.aborted).toBe(true)
  expect(error.status).toBe(HTTPStatus.NETWORK)
  expect(error.code).toBe(HTTPErrorCode.NETWORK_ERROR)
})

test('the caller signal reaches the Request', async () => {
  const requests: Array<Request> = []

  vi.spyOn(globalThis, 'fetch').mockImplementation(
    (input) =>
      new Promise<Response>((_resolve, reject) => {
        const incoming = toRequest(input)
        requests.push(incoming)
        incoming.signal.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      }),
  )

  const controller = new AbortController()
  const pending = rejection(
    request(ANY, (api) => api.get('/storages', {}), {
      signal: controller.signal,
    }),
  )

  await vi.waitFor(() => expect(requests).toHaveLength(1))
  expect(requests[0]?.signal.aborted).toBe(false)

  controller.abort()
  const error = await pending

  expect(requests[0]?.signal.aborted).toBe(true)
  expect(error).toBeInstanceOf(HTTPError)
})

test.each([
  { status: 400, body: { message: 'x', status: 400, code: 'BAD_REQUEST' } },
  CREDENTIALS_INVALID,
  { status: 403, body: { message: 'x', status: 403, code: 'ACCESS_DENIED' } },
  { status: 404, body: { message: 'x', status: 404, code: 'NOT_FOUND' } },
  { status: 409, body: { message: 'x', status: 409, code: 'CONFLICT' } },
  {
    status: 422,
    body: { message: 'x', status: 422, code: 'VALIDATION_ERROR' },
  },
  { status: 500, body: { message: 'x', status: 500, code: 'ACCOUNT_ERROR' } },
  { status: 503, body: { message: 'x', status: 503, code: 'UNAVAILABLE' } },
])('every failure leaves as HTTPError ($status)', async (reply) => {
  respond(reply)

  const fromRequest = await rejection(readStorages())
  const fromSend = await rejection(signIn())

  expect(fromRequest.status).toBe(reply.status)
  expect(fromSend.status).toBe(reply.status)
  expect(fromRequest.name).toBe('HTTPError')
})

test('every failure leaves as HTTPError (network)', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))

  const fromRequest = await rejection(readStorages())
  const fromSend = await rejection(signIn())

  expect(fromRequest.status).toBe(HTTPStatus.NETWORK)
  expect(fromSend.status).toBe(HTTPStatus.NETWORK)
})

test('never retries on its own', async () => {
  const unavailable: Reply = {
    status: 503,
    body: { message: 'x', status: 503, code: 'UNAVAILABLE' },
  }
  const requests = respond(unavailable)

  await rejection(signIn())
  expect(requests).toHaveLength(1)

  // Ky would repeat a GET on 503 by default; the POST above alone would not show it.
  await rejection(readStorages())
  expect(requests).toHaveLength(2)
})

test('send resolves undefined on 204', async () => {
  const requests = respond({ status: 204 })

  await expect(signIn()).resolves.toBeUndefined()
  expect(requests).toHaveLength(1)
})

test('a session 401 refreshes once and replays once', async () => {
  const requests = serve({
    '/storages': (call) => {
      if (call === 0) return SESSION_EXPIRED
      return { status: 200, body: { id: 'a' } }
    },
    '/authentication/refresh': () => ({ status: 204 }),
  })

  await expect(
    runInRequestScope(() => request(RECORD, (api) => api.get('/storages', {}))),
  ).resolves.toEqual({ id: 'a' })

  expect(pathsOf(requests)).toEqual([
    '/storages',
    '/authentication/refresh',
    '/storages',
  ])
  expect(requests[1]?.method).toBe('POST')
})

test('a session 401 on the replay does not refresh again', async () => {
  const requests = serve({
    '/storages': () => SESSION_EXPIRED,
    '/authentication/refresh': () => ({ status: 204 }),
  })

  const error = await runInRequestScope(() => rejection(readStorages()))

  expect(error.isSessionRefusal).toBe(true)
  expect(pathsOf(requests)).toEqual([
    '/storages',
    '/authentication/refresh',
    '/storages',
  ])
})

test('a credentials 401 does not refresh', async () => {
  const requests = respond(CREDENTIALS_INVALID)

  const error = await rejection(signIn())

  expect(error.code).toBe(HTTPErrorCode.INVALID_CREDENTIALS)
  expect(requests).toHaveLength(1)
})

test('one refresh per request scope', async () => {
  const requests = serve({
    '/storages': () => SESSION_EXPIRED,
    '/authentication/refresh': () => ({ status: 204 }),
  })
  const refreshes = () =>
    pathsOf(requests).filter((path) => path === '/authentication/refresh')

  await runInRequestScope(() =>
    Promise.all(Array.from({ length: 5 }, () => rejection(readStorages()))),
  )
  expect(refreshes()).toHaveLength(1)

  await Promise.all([
    runInRequestScope(() => rejection(readStorages())),
    runInRequestScope(() => rejection(readStorages())),
  ])
  expect(refreshes()).toHaveLength(3)
})

test('forwards the inbound cookie and replays with the renewed one', async () => {
  inbound.cookie = 'a=1'
  const requests = serve({
    '/storages': (call) => {
      if (call === 0) return SESSION_EXPIRED
      return { status: 200, body: { id: 'a' } }
    },
    '/authentication/refresh': () => ({
      status: 204,
      headers: { 'Set-Cookie': 'session=new; Path=/; HttpOnly' },
    }),
  })

  await runInRequestScope(() => readStorages())

  expect(requests.map((entry) => entry.headers.get('cookie'))).toEqual([
    'a=1',
    'a=1',
    'a=1; session=new',
  ])
})

test('sends credentials, Accept and Accept-Language', async () => {
  const requests = respond({ status: 200, body: { id: 'a' } })

  await readStorages()
  await signIn()

  for (const entry of requests) {
    expect(entry.credentials).toBe('include')
    expect(entry.headers.get('Accept')).toBe('application/json')
    expect(entry.headers.get('Accept-Language')).toBe(getLocale())
  }
  expect(requests).toHaveLength(2)
})

test('Content-Type only with a body', async () => {
  const requests = respond({ status: 200, body: { id: 'a' } })

  await readStorages()
  await signIn()

  expect(requests[0]?.headers.get('Content-Type')).toBeNull()
  expect(requests[1]?.headers.get('Content-Type')).toBe('application/json')
  const sent = requests[1]
  if (!sent) throw new Error('expected the POST to reach fetch')
  expect(JSON.parse(bodies.get(sent) ?? 'null')).toEqual({
    login: 'ana@escola.br',
    password: 'segredo',
  })
})

test('the server base URL is SERVER_API_URL when set, VITE_API_URL when not', async () => {
  const requests = respond({ status: 200, body: { id: 'a' } })

  process.env.SERVER_API_URL = 'http://backend.internal:3333'
  await readStorages()

  delete process.env.SERVER_API_URL
  await readStorages()

  expect(requests[0]?.url).toBe('http://backend.internal:3333/storages')
  expect(requests[1]?.url).toBe(new URL('/storages', env.VITE_API_URL).href)
  expect(BASE_URL).toBe(env.VITE_API_URL)
})
