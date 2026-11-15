/** O que a entrada respondeu: o status e o `Retry-After` (segundos) que o limiter manda no 429. */
export type SignInAnswer = {
  readonly status: number
  readonly retryAfter: string | undefined
}

export type SignInRetryOptions = {
  /** Injetado para o teste não esperar de verdade. */
  readonly sleep?: (milliseconds: number) => Promise<void>
  readonly maxAttempts?: number
  /** Teto de uma espera: acima disso a rodada falha em vez de ficar parada. */
  readonly maxWaitSeconds?: number
}

/**
 * A entrada do `auth.setup.ts` respeitando o 429 do limiter (DECISIONS.md #742): o limiter de
 * produção não se afrouxa nem se desvia, então quando ele recusa o setup espera o que a própria
 * resposta manda (`Retry-After`, que `app/exceptions/handler.ts` emite em segundos) e tenta de
 * novo. Teto de tentativas e de espera; estourou, a mensagem diz qual conta e quanto faltava.
 * `@adonisjs/limiter` expõe o tempo restante no erro de limite estourado
 * (_doc-lib/adonisjs.md#guides/security/rate-limiting, https://docs.adonisjs.com/guides/security/rate-limiting).
 */
export class SignInRetry {
  static readonly MAX_ATTEMPTS = 3
  /** `signInThrottle` bloqueia por 10 minutos depois do teto; sobra uma folga. */
  static readonly MAX_WAIT_SECONDS = 660
  private static readonly THROTTLED = 429

  static async run(
    label: string,
    attempt: () => Promise<SignInAnswer>,
    options: SignInRetryOptions = {},
  ): Promise<SignInAnswer> {
    const {
      sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      maxAttempts = SignInRetry.MAX_ATTEMPTS,
      maxWaitSeconds = SignInRetry.MAX_WAIT_SECONDS,
    } = options

    for (let tried = 1; ; tried++) {
      const answer = await attempt()

      if (answer.status !== SignInRetry.THROTTLED) return answer

      const seconds = Number(answer.retryAfter)

      if (!Number.isFinite(seconds) || seconds < 0) {
        throw new Error(`entrada de ${label}: 429 sem Retry-After válido`)
      }
      if (tried >= maxAttempts || seconds > maxWaitSeconds) {
        throw new Error(
          `entrada de ${label}: limiter recusou (429, Retry-After ${seconds}s) na tentativa ${tried} de ${maxAttempts}; teto de espera ${maxWaitSeconds}s`,
        )
      }

      await sleep(seconds * 1000)
    }
  }
}
