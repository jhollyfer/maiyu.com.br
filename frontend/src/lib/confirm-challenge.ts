/** A number in `[0, 1)`, as `Math.random`: injected so a test can fix the question. */
export type ChallengeRandom = () => number

export type ConfirmChallengeQuestion = Readonly<{
  /** The question as shown ("7 + 2"): digits and a sign, the same in every language. */
  question: string
  expected: number
}>

const MIN_OPERAND = 1
const MAX_OPERAND = 9

/**
 * The sum or subtraction asked before an irreversible action (`ConfirmDialogChallenge`).
 *
 * It is not anti-bot, and the arithmetic is trivial on purpose: what it prevents is the
 * distracted click, on an action that has no trash behind it. Randomness comes in by parameter
 * and never from `Math.random` inside, which is what makes the test deterministic.
 */
export class ConfirmChallenge {
  private static operand(random: ChallengeRandom): number {
    return Math.floor(random() * (MAX_OPERAND - MIN_OPERAND + 1)) + MIN_OPERAND
  }

  /** Two draws for the operands and one for the sign: `random() < 0.5` adds, else subtracts. */
  static create(random: ChallengeRandom): ConfirmChallengeQuestion {
    const first = ConfirmChallenge.operand(random)
    const second = ConfirmChallenge.operand(random)
    const high = Math.max(first, second)
    const low = Math.min(first, second)

    if (random() < 0.5)
      return { question: `${first} + ${second}`, expected: first + second }

    // The larger minus the smaller: the answer is never negative.
    return { question: `${high} - ${low}`, expected: high - low }
  }

  /** The typed text answers it: a whole number equal to `expected`, spaces aside. */
  static isSolved(answer: string, expected: number): boolean {
    const trimmed = answer.trim()

    return trimmed.length > 0 && Number(trimmed) === expected
  }
}
