import { describe, expect, it } from 'vitest'

import { REVEAL } from './reveal'

describe('REVEAL', () => {
  it('when applied, it animates the entrance and switches itself off for reduced motion', () => {
    // The delayed entrance leaves the block invisible in the initial state: without
    // `motion-reduce:animate-none` whoever asked for less motion would not see it.
    const classes = REVEAL.split(' ')

    expect(classes).toContain('animate-in')
    expect(classes).toContain('motion-reduce:animate-none')
  })
})
