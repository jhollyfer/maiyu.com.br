/**
 * What never goes into the log, even if someone passes the whole object (`config/logger.ts`).
 *
 * The paths follow Pino's syntax (_doc-lib/adonisjs.md#guides/digging-deeper/logger,
 * https://docs.adonisjs.com/guides/digging-deeper/logger; Pino "Redaction",
 * https://github.com/pinojs/pino/blob/main/docs/redaction.md, "Path Syntax"): `*` is a wildcard
 * for one level, a hyphenated key goes in brackets, and there is no `**`. So every secret key is
 * listed at the root and under one, two and three levels of any key: `*.password` alone covered
 * `user.password` and let `payload.user.password` through, and `res.headers["set-cookie"]` (the
 * session tokens the sign-in and the refresh write) was not covered at all.
 *
 * Three levels reach `req.headers.cookie`, `res.headers["set-cookie"]` and a payload nested twice
 * inside what was logged. Deeper than that the net does not reach: log the identifier, never the
 * object (`_standards/backend.md` §5.5). Wildcards cost more than fixed paths (the same Pino page,
 * "Overhead"), which is acceptable on a logger that records decisions, not traffic.
 */
export default class LogRedact {
  /**
   * Explicit, so the field shows up redacted instead of vanishing: an absent field reads as "did
   * not come", not as "was hidden".
   */
  static readonly CENSOR = '[redigido]'

  /** Each secret key as the accessor Pino reads after a prefix (brackets for the hyphenated one). */
  static readonly #ACCESSORS = [
    '.password',
    '.currentPassword',
    '.passwordConfirmation',
    '.token',
    '.accessToken',
    '.refreshToken',
    '.authorization',
    '.cookie',
    '["set-cookie"]',
    '.cpf',
    '.cnpj',
  ] as const

  /** The root and one, two and three levels of any key above the secret one. */
  static readonly #PREFIXES = ['', '*', '*.*', '*.*.*'] as const

  /** The paths for `redact.paths`: a new array per call, since Pino's type is mutable. */
  static paths(): Array<string> {
    return LogRedact.#PREFIXES.flatMap((prefix) =>
      LogRedact.#ACCESSORS.map((accessor) =>
        // At the root there is no prefix, and the accessor loses its leading dot.
        `${prefix}${accessor}`.replace(/^\./, ''),
      ),
    )
  }
}
