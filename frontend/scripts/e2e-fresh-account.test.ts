import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { IncomingHttpHeaders, Server } from 'node:http'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FreshAccountOptions } from '../e2e/support/fresh-account'

/**
 * The fresh account of a spec (`E2eFreshAccount`, DECISIONS.md #819): a NEW account by sign-up, one
 * sign-in with it, the login the `e2e:cleanup` recognizes. A local server stands for the API: the
 * helper does the real HTTP, with the real `request` of Playwright.
 */
type Call = { path: string; headers: IncomingHttpHeaders; body: string }

describe('E2eFreshAccount (DECISIONS.md #819)', () => {
  let server: Server
  let calls: Call[]
  let signInStatuses: number[]

  beforeEach(async () => {
    calls = []
    signInStatuses = []
    server = createServer((request, response) => {
      const chunks: Buffer[] = []
      request.on('data', (chunk: Buffer) => chunks.push(chunk))
      request.on('end', () => {
        calls.push({
          path: request.url ?? '',
          headers: request.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        })
        if (request.url === '/authentication/sign-in') {
          const status = signInStatuses.shift() ?? 204
          const headers: Record<string, string> = {
            'set-cookie': 'session=abc; Path=/',
          }
          if (status === 429) headers['retry-after'] = '1'
          response.writeHead(status, headers)
        } else {
          response.writeHead(201)
        }
        response.end()
      })
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (typeof address !== 'object' || address === null)
      throw new Error('the test server has no port')
    const { port } = address
    vi.resetModules()
    vi.stubEnv('E2E_BASE_URL', 'http://localhost:3000')
    vi.stubEnv('E2E_API_URL', `http://127.0.0.1:${port}`)
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await new Promise((resolve) => server.close(resolve))
  })

  async function load() {
    return await import('../e2e/support/fresh-account')
  }

  it('the login is the one e2e:cleanup deletes by, and each call is a new account', async () => {
    const { E2E_ACCOUNT_EMAIL_PATTERN, E2eFreshAccount } = await load()
    const pattern = new RegExp(E2E_ACCOUNT_EMAIL_PATTERN, 'i')

    for (const label of ['reporter', 'non-staff', 'councilorA'])
      expect(E2eFreshAccount.identityOf(label).login).toMatch(pattern)
    const first = E2eFreshAccount.identityOf('reporter')
    const second = E2eFreshAccount.identityOf('reporter')
    expect(first.login).not.toBe(second.login)
    expect(first.password).not.toBe(second.password)
  })

  it('the phone login is the one e2e:cleanup deletes by and passes the users_phone_e164 check', async () => {
    const { E2E_ACCOUNT_PHONE_PATTERN, E2eFreshAccount } = await load()

    for (let each = 0; each < 200; each++) {
      const { login } = E2eFreshAccount.identityOf('resident', 'phone')

      expect(login).toMatch(new RegExp(E2E_ACCOUNT_PHONE_PATTERN))
      expect(login).toMatch(/^\+55[1-9][1-9]9[0-9]{8}$/)
    }
  })

  it('refuses a label the cleanup would not find', async () => {
    const { E2eFreshAccount } = await load()

    for (const label of ['', 'a b', 'a@b', 'a.b', 'x_y'])
      expect(() => E2eFreshAccount.identityOf(label), label).toThrow(
        /fora do padrão/,
      )
  })

  it('the pattern is the same text as the backend one', async () => {
    const { E2E_ACCOUNT_EMAIL_PATTERN, E2E_ACCOUNT_PHONE_PATTERN } =
      await load()
    const backend = '../backend/tests/e2e-identity.ts'
    if (!existsSync(backend)) return

    // The backend file holds the patterns as source text, with the backslash escaped.
    const source = readFileSync(backend, 'utf8')
    for (const pattern of [
      E2E_ACCOUNT_EMAIL_PATTERN,
      E2E_ACCOUNT_PHONE_PATTERN,
    ])
      expect(source).toContain(`'${pattern.replaceAll('\\', '\\\\')}'`)
  })

  it('signs up first, signs in once with the same account and from its own address, and returns the signed context', async () => {
    const { E2eFreshAccount } = await load()
    const signUp = vi.fn<FreshAccountOptions['signUp']>(
      async (identity, context) => {
        await context.post(
          `${process.env.E2E_API_URL}/authentication/sign-up`,
          {
            data: { email: identity.login },
          },
        )
      },
    )

    const { identity, context } = await E2eFreshAccount.create({
      label: 'buyer',
      signUp,
    })

    expect(signUp).toHaveBeenCalledTimes(1)
    expect(calls.map((call) => call.path)).toEqual([
      '/authentication/sign-up',
      '/authentication/sign-in',
    ])
    const signIn = calls[1]
    expect(JSON.parse(signIn?.body ?? '{}')).toEqual({
      login: identity.login,
      password: identity.password,
    })
    expect(signIn?.headers['x-forwarded-for']).toMatch(/^198\.1[89]\./)
    expect(signIn?.headers.origin).toBe('http://localhost:3000')
    // The cookie of the session is in the context the spec gets.
    expect((await context.storageState()).cookies.map((c) => c.name)).toEqual([
      'session',
    ])
    await context.dispose()
  })

  it('waits the 429 of the limiter and does not sign in again once it is 204', async () => {
    const { E2eFreshAccount } = await load()
    signInStatuses.push(429)
    const sleep = vi.fn(() => Promise.resolve())

    const { context } = await E2eFreshAccount.create({
      label: 'buyer',
      signUp: () => Promise.resolve(),
      retry: { sleep },
    })

    expect(sleep).toHaveBeenCalledWith(1000)
    expect(
      calls.filter((c) => c.path === '/authentication/sign-in'),
    ).toHaveLength(2)
    await context.dispose()
  })

  it('does not sign in when the sign-up fails, and fails when the sign-in is not 204', async () => {
    const { E2eFreshAccount } = await load()

    await expect(
      E2eFreshAccount.create({
        label: 'buyer',
        signUp: () => Promise.reject(new Error('sign-up recusado')),
      }),
    ).rejects.toThrow('sign-up recusado')
    expect(calls).toHaveLength(0)

    signInStatuses.push(401)
    await expect(
      E2eFreshAccount.create({
        label: 'buyer',
        signUp: () => Promise.resolve(),
      }),
    ).rejects.toThrow('esperava 204, veio 401')
  })
})
