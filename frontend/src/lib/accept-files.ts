/**
 * The files the `accept` of an `<input type="file">` would allow, applied to what arrives by drop or
 * paste: the picker honours `accept` by itself, but a drop and a paste do not go through it, so
 * without this a PDF dragged onto an images-only field would upload.
 *
 * `accept` is the attribute's own syntax, a comma list of `.ext`, `type/subtype` and `type/*`
 * (https://html.spec.whatwg.org/multipage/input.html#attr-input-accept); the browser's check of
 * the picker is the reference, and the server's refusal still is the one that counts.
 */
export type AcceptedFiles = {
  readonly accepted: Array<File>
  readonly rejected: Array<File>
}

function acceptsFile(file: File, token: string): boolean {
  const pattern = token.trim().toLowerCase()
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  if (pattern.startsWith('.')) return name.endsWith(pattern)
  if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1))

  return type === pattern
}

/** Splits `files` by `accept`; no `accept` (or an empty one) accepts everything. */
export function splitByAccept(
  files: ReadonlyArray<File>,
  accept: string | undefined,
): AcceptedFiles {
  const tokens = (accept ?? '')
    .split(',')
    .filter((token) => token.trim() !== '')

  if (tokens.length === 0) return { accepted: [...files], rejected: [] }

  const accepted: Array<File> = []
  const rejected: Array<File> = []

  for (const file of files) {
    if (tokens.some((token) => acceptsFile(file, token))) accepted.push(file)
    else rejected.push(file)
  }

  return { accepted, rejected }
}
