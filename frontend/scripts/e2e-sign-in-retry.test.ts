import { describe, expect, it, vi } from 'vitest'

import { SignInRetry } from '../e2e/support/sign-in-retry'
import type { SignInAnswer } from '../e2e/support/sign-in-retry'

const ok: SignInAnswer = { status: 204, retryAfter: undefined }
const throttled = (retryAfter: string | undefined): SignInAnswer => ({
  status: 429,
  retryAfter,
})

/** Respostas em fila, uma por chamada. */
const queue = (answers: SignInAnswer[]) =>
  vi.fn(() => Promise.resolve(answers.shift() ?? ok))

describe('SignInRetry (DECISIONS.md #742)', () => {
  it('without 429 it answers at once and never waits', async () => {
    const sleep = vi.fn(async () => {})

    await expect(
      SignInRetry.run('staff', queue([ok]), { sleep }),
    ).resolves.toBe(ok)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('waits the Retry-After of the 429 and tries again', async () => {
    const sleep = vi.fn(async () => {})
    const attempt = queue([throttled('42'), ok])

    await expect(SignInRetry.run('staff', attempt, { sleep })).resolves.toBe(ok)
    expect(sleep).toHaveBeenCalledExactlyOnceWith(42_000)
    expect(attempt).toHaveBeenCalledTimes(2)
  })

  it('gives up after the attempt ceiling, naming the account', async () => {
    const sleep = vi.fn(async () => {})
    const attempt = queue([throttled('1'), throttled('1'), throttled('1')])

    await expect(SignInRetry.run('staff', attempt, { sleep })).rejects.toThrow(
      /entrada de staff.*429.*tentativa 3 de 3/,
    )
    expect(attempt).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
  })

  it('does not wait longer than the ceiling', async () => {
    const sleep = vi.fn(async () => {})

    await expect(
      SignInRetry.run('staff', queue([throttled('5000')]), { sleep }),
    ).rejects.toThrow(/teto de espera 660s/)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('a 429 without a usable Retry-After fails with a clear message', async () => {
    await expect(
      SignInRetry.run('staff', queue([throttled(undefined)])),
    ).rejects.toThrow(/sem Retry-After válido/)
  })

  it('other statuses are the caller to judge, not a retry', async () => {
    const wrong: SignInAnswer = { status: 401, retryAfter: undefined }

    await expect(SignInRetry.run('staff', queue([wrong]))).resolves.toBe(wrong)
  })
})
