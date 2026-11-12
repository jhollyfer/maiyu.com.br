import { describe, expect, it } from 'vitest'

import { REVEAL } from './reveal'

describe('REVEAL', () => {
  it('when applied, it animates the entrance and switches itself off for reduced motion', () => {
    // A entrada atrasada deixa o bloco invisível no estado inicial: sem o
    // `motion-reduce:animate-none` quem pediu menos movimento não o veria.
    const classes = REVEAL.split(' ')

    expect(classes).toContain('animate-in')
    expect(classes).toContain('motion-reduce:animate-none')
  })
})
