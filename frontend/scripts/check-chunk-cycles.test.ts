import { describe, expect, it } from 'vitest'

import { eagerOnly } from './check-chunk-cycles.mjs'

/**
 * `eagerOnly` separates what runs **during evaluation** of the module from what
 * only runs later. It is the piece that decides whether the cyclic-chunk guard
 * blocks the pre-PR gate or lets the bug through, and it got both wrong before reaching this point:
 *
 * - `function f({ a }) { ... }` - the destructuring brace was read as the
 *   body, and the whole body became evaluation code. Every component with
 *   destructured props became a false positive.
 * - `loader: () => use(x)` - a block-less arrow has no brace to mark the end,
 *   and without handling it separately every route of the app became a false positive.
 *
 * The contract: the return value has the **same length** as the input and keeps
 * the line breaks, so the finding's line number is the file's.
 */
describe('eagerOnly', () => {
  const eager = (code: string): string => eagerOnly(code)

  it('when it erases code, keeps the length and the line breaks', () => {
    const code = 'var a = 1\nfunction f() {\n  return b\n}\n'

    expect(eager(code)).toHaveLength(code.length)
    expect(eager(code).split('\n')).toHaveLength(code.split('\n').length)
  })

  it('when code runs during evaluation, keeps it', () => {
    expect(eager('var TOTAL = contar(itens)')).toContain('contar')
  })

  it('when a function is declared, erases its body', () => {
    expect(eager('function f() {\n  return contar()\n}')).not.toContain(
      'contar',
    )
  })

  it('when a parameter is destructured, still erases the function body', () => {
    // The brace in `{ className }` is not the body. Confusing them let
    // every component in the bundle through.
    const code =
      'function Overlay({ className, ...props }) {\n  return cn(className)\n}'

    expect(eager(code)).not.toContain('cn(')
  })

  it('when an arrow has a block or an expression body, erases both', () => {
    expect(eager('var f = () => {\n  return contar()\n}')).not.toContain(
      'contar',
    )
    expect(
      eager('var rota = { loader: () => contar(), nome: "x" }'),
    ).not.toContain('contar')
  })

  it('when an expression arrow ends at the comma, counts what comes after again', () => {
    const code = 'var rota = { loader: () => adiado(), chave: agora() }'
    const result = eager(code)

    expect(result).not.toContain('adiado')
    expect(result).toContain('agora')
  })

  it('when code sits in a string, template or comment, does not read it as code', () => {
    expect(eager('var s = "contar()"')).not.toContain('contar')
    expect(eager('var s = `contar()`')).not.toContain('contar')
    expect(eager('// contar()\nvar a = 1')).not.toContain('contar')
    expect(eager('/* contar() */\nvar a = 1')).not.toContain('contar')
  })

  it('when a regular expression literal appears, does not read it as division', () => {
    // Without the cut, the slash would open a "string" that swallowed the rest of
    // the file - and the guard would find nothing, silently.
    expect(eager('var re = /contar()/g\nvar total = somar(1)')).toContain(
      'somar',
    )
  })
})
