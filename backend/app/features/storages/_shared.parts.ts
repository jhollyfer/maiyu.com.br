import type { PartToSign } from '#services/multipart/multipart.contract'

/**
 * The count of an upload's parts: a pure function over numbers already at hand, used
 * by `create` and `parts` (_standards/typescript.md §6, backend.md §4.9). A class
 * with only `static` because `_shared` never exports a loose function.
 */
export class UploadParts {
  /** Into how many parts a file of this size is sliced. Never fewer than one. */
  static count(size: number, partSize: number): number {
    return Math.max(1, Math.ceil(size / partSize))
  }

  /**
   * The size in bytes of a part: `partSize` for all but the last, which takes
   * what is left. It is what the signed URL pins in `Content-Length`.
   */
  static sizeOf(
    totalSize: number,
    partSize: number,
    partNumber: number,
  ): number {
    const total = UploadParts.count(totalSize, partSize)

    if (partNumber < total) return partSize

    return totalSize - partSize * (total - 1)
  }

  /** The part numbers with the size of each one, in the shape the contract signs. */
  static sized(
    partNumbers: ReadonlyArray<number>,
    totalSize: number,
    partSize: number,
  ): Array<PartToSign> {
    return partNumbers.map((partNumber) => ({
      partNumber,
      size: UploadParts.sizeOf(totalSize, partSize, partNumber),
    }))
  }

  /**
   * The numbers of the parts still missing, at most one batch.
   *
   * It serves both the start (`uploaded` empty, returns `[1, 2, 3, …]`)
   * and the resume (returns the gap). The cut at `batch` (the multipart contract's `PRESIGNED_BATCH`) is what
   * keeps a large file from turning into half a megabyte of URLs in a single response.
   */
  static pending(input: {
    readonly totalParts: number
    readonly uploaded: ReadonlyArray<number>
    readonly batch: number
  }): Array<number> {
    const received = new Set(input.uploaded)
    const pending: Array<number> = []

    for (let partNumber = 1; partNumber <= input.totalParts; partNumber++) {
      if (received.has(partNumber)) continue
      if (pending.length === input.batch) break

      pending.push(partNumber)
    }

    return pending
  }
}
