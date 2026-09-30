import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { baseLocale, locales } from '#/paraglide/runtime'

/**
 * As mensagens do paraglide, nos três idiomas.
 *
 * O paraglide não reclama de chave faltando num idioma: ele cai no idioma
 * base, e a página em espanhol ganha uma frase em português no meio sem erro
 * nenhum. E chave sem uso não avisa que está morta, e é a que ninguém revisa
 * quando o texto muda.
 */
const root = join(import.meta.dirname, '..', '..')

function messages(locale: string): Record<string, string> {
  const raw: unknown = JSON.parse(
    readFileSync(join(root, 'messages', `${locale}.json`), 'utf8'),
  )
  if (typeof raw !== 'object' || raw === null) return {}

  return Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [string, string] =>
        entry[0] !== '$schema' && typeof entry[1] === 'string',
    ),
  )
}

/** Todo arquivo `.ts`/`.tsx` de `src/`, fora o que o paraglide gera. */
function sources(dir: string): Array<string> {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name === 'paraglide') return []
    if (statSync(path).isDirectory()) return sources(path)
    if (!/\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name)) return []

    return [readFileSync(path, 'utf8')]
  })
}

const base = messages(baseLocale)
const code = sources(join(root, 'src')).join('\n')

describe('mensagens', () => {
  it.each(locales)('%s tem exatamente as chaves do idioma base', (locale) => {
    expect(Object.keys(messages(locale)).sort()).toEqual(
      Object.keys(base).sort(),
    )
  })

  it.each(locales)('%s não tem mensagem vazia', (locale) => {
    const vazias = Object.entries(messages(locale))
      .filter(([, text]) => !text.trim())
      .map(([key]) => key)

    expect(vazias).toEqual([])
  })

  it('toda chave é usada no código', () => {
    const mortas = Object.keys(base).filter(
      (key) => !code.includes(`m.${key}(`),
    )

    expect(mortas).toEqual([])
  })
})
