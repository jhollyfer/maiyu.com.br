/**
 * The message of any caught error, for a log line or a report. `catch` hands over
 * `unknown`, and interpolating a non-`Error` straight into a template comes out
 * `[object Object]`. Lives in `core/` because commands and services both need it
 * (_standards/architecture.md §6, DECISIONS #340).
 */
export default class ErrorMessage {
  static of(error: unknown): string {
    if (error instanceof Error) return error.message

    return String(error)
  }
}
