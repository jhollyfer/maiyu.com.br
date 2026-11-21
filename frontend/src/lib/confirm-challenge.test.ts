import { describe, expect, it } from 'vitest'

import { ConfirmChallenge } from './confirm-challenge'
import type { ChallengeRandom } from './confirm-challenge'

/** A `random` that returns the given values in order. */
function sequence(...values: Array<number>): ChallengeRandom {
  let index = 0

  return () => {
    const value = values[index] ?? 0
    index += 1

    return value
  }
}

describe('ConfirmChallenge', () => {
  it('builds the same question from the same random, and adds below 0.5', () => {
    // operands 1 + floor(0.5 * 9) = 5 and 1 + floor(0.99 * 9) = 9; sign draw 0.1 -> add
    const question = ConfirmChallenge.create(sequence(0.5, 0.99, 0.1))

    expect(question).toEqual({ question: '5 + 9', expected: 14 })
    expect(ConfirmChallenge.create(sequence(0.5, 0.99, 0.1))).toEqual(question)
  })

  it('subtracts the smaller from the larger on 0.5 or above, never negative', () => {
    const question = ConfirmChallenge.create(sequence(0, 0.99, 0.5))

    expect(question).toEqual({ question: '9 - 1', expected: 8 })
  })

  it('accepts only the expected whole number, spaces aside', () => {
    expect(ConfirmChallenge.isSolved(' 14 ', 14)).toBe(true)
    expect(ConfirmChallenge.isSolved('13', 14)).toBe(false)
    expect(ConfirmChallenge.isSolved('', 0)).toBe(false)
    expect(ConfirmChallenge.isSolved('abc', 14)).toBe(false)
  })
})
