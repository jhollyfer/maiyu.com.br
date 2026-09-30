import { readFileSync } from 'node:fs'

import { describe, expect, test } from 'vitest'

import { locales } from '#/paraglide/runtime'

import * as validator from './validator'
import { FIELD_LABELS, RULE_MESSAGES } from './validator-messages'

/** O schema, como texto: é nele que a regra chamada aparece. */
const source = readFileSync(new URL('./validator.ts', import.meta.url), 'utf8')

/**
 * As regras nativas do VineJS que produzem mensagem e que este site pode
 * chamar. A lista do academy é maior; aqui entram só as que um formulário de
 * vitrine usa, e regra nova no schema sem linha aqui é pega pelo teste de
 * "regras usadas".
 */
const BUILTIN_RULES = [
  'required',
  'string',
  'enum',
  'email',
  'url',
  'minLength',
  'maxLength',
]

type Introspectable = { toJSONSchema: () => unknown }

/** Um ramo do JSON Schema, sempre como lista, provado a cada acesso. */
function branch(node: unknown, key: string): Array<unknown> {
  if (typeof node !== 'object' || node === null) return []
  if (!(key in node)) return []

  const value: unknown = Reflect.get(node, key)

  if (Array.isArray(value)) return value

  return [value]
}

function isValidator<T>(value: T): value is T & Introspectable {
  if (typeof value !== 'object' || value === null) return false
  if (!('toJSONSchema' in value)) return false

  return typeof value.toJSONSchema === 'function'
}

/** Todo caminho de campo do schema. */
function walk(schema: unknown): Array<string> {
  const paths: Array<string> = []

  for (const each of branch(schema, 'anyOf')) paths.push(...walk(each))

  for (const properties of branch(schema, 'properties')) {
    if (typeof properties !== 'object' || properties === null) continue

    paths.push(...Object.keys(properties))
  }

  return paths
}

const validators = Object.values(validator).filter(isValidator)

const fields = new Set(validators.flatMap((each) => walk(each.toJSONSchema())))

describe('rótulos', () => {
  test.each(locales)('todo campo dos validators tem nome em %s', (locale) => {
    const labels = FIELD_LABELS[locale]
    const semRotulo = [...fields].filter((field) => !(field in labels)).sort()

    expect(semRotulo).toEqual([])
  })

  test.each(locales)('não sobra rótulo morto em %s', (locale) => {
    const orfaos = Object.keys(FIELD_LABELS[locale])
      .filter((key) => !fields.has(key))
      .sort()

    expect(orfaos).toEqual([])
  })
})

describe('mensagens', () => {
  test('os três idiomas têm as mesmas chaves', () => {
    // Uma regra traduzida em dois idiomas e esquecida no terceiro cai na
    // mensagem em inglês do VineJS justamente para quem escolheu espanhol.
    const [base, ...rest] = locales.map((locale) =>
      Object.keys(RULE_MESSAGES[locale]).sort(),
    )

    for (const keys of rest) expect(keys).toEqual(base)
  })

  test('as regras que os validators usam têm mensagem', () => {
    const used = BUILTIN_RULES.filter((rule) => source.includes(`.${rule}(`))
    const faltando = used.filter((rule) => !(rule in RULE_MESSAGES['pt-BR']))

    expect(faltando).toEqual([])
  })

  test('nenhuma mensagem sobrou de uma regra que ninguém chama', () => {
    // `required` é implícita: todo campo sem `.optional()` a carrega, e
    // `string` é o que o VineJS reporta quando o valor chega nulo.
    const orfas = Object.keys(RULE_MESSAGES['pt-BR']).filter((key) => {
      if (key === 'required' || key === 'string') return false

      return !source.includes(`.${key}(`)
    })

    expect(orfas).toEqual([])
  })
})

describe('todo campo de texto tem teto', () => {
  test('nenhum `vine.string()` fica sem `maxLength`', () => {
    // Sem teto, um formulário aceita o texto de um livro colado por engano, e
    // o backend que vier depois vai recusar o que a tela deixou passar.
    const chains = source.match(/vine\s*\.string\(\)[^\n,}]*/g) ?? []
    const semTeto = chains.filter((chain) => !chain.includes('.maxLength('))

    expect(semTeto).toEqual([])
  })
})
