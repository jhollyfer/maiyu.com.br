import { describe, expect, it } from 'vitest'

import { RelativeRedirect } from './relative-redirect'

const REQUEST = new Request('http://app.example.com/')

function redirect(location: string, status = 307): Response {
  return new Response(null, { status, headers: { Location: location } })
}

describe('RelativeRedirect.apply', () => {
  it('when the 307 points to the request origin over http, Location loses the origin', () => {
    const response = RelativeRedirect.apply(
      REQUEST,
      redirect('http://app.example.com/pt-br'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('Location')).toBe('/pt-br')
  })

  it('when the Location carries query and hash, both survive', () => {
    const response = RelativeRedirect.apply(
      REQUEST,
      redirect('http://app.example.com/pt-br/login?redirect=%2Fpainel#top'),
    )

    expect(response.headers.get('Location')).toBe(
      '/pt-br/login?redirect=%2Fpainel#top',
    )
  })

  it('when the Location is already relative, it stays', () => {
    const response = RelativeRedirect.apply(REQUEST, redirect('/en/about', 302))

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/en/about')
  })

  it('when the Location is another origin, the response is untouched', () => {
    const original = redirect('https://accounts.example.org/oauth')

    expect(RelativeRedirect.apply(REQUEST, original)).toBe(original)
  })

  it('when the same-origin path starts with //, it stays absolute (no protocol-relative escape)', () => {
    const original = redirect('http://app.example.com//evil.com/x')

    const response = RelativeRedirect.apply(REQUEST, original)

    expect(response.headers.get('Location')).toBe(
      'http://app.example.com//evil.com/x',
    )
  })

  it('when the response is not a redirect, it is untouched', () => {
    const original = new Response('ok', {
      status: 200,
      headers: { Location: 'http://app.example.com/x' },
    })

    expect(RelativeRedirect.apply(REQUEST, original)).toBe(original)
  })

  it('when a redirect has no Location, it is untouched', () => {
    const original = new Response(null, { status: 304 })

    expect(RelativeRedirect.apply(REQUEST, original)).toBe(original)
  })

  it('when it rewrites, the other headers and the body go on', async () => {
    const response = RelativeRedirect.apply(
      REQUEST,
      new Response('moved', {
        status: 307,
        headers: {
          Location: 'http://app.example.com/pt-br',
          'Set-Cookie': 'a=1',
        },
      }),
    )

    expect(response.headers.get('Set-Cookie')).toBe('a=1')
    expect(await response.text()).toBe('moved')
  })
})
