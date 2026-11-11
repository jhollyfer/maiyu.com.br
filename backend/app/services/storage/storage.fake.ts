import {
  StorageContract,
  type StorageDownload,
  type StorageMetadata,
} from '#services/storage/storage.contract'

const PNG_HEAD = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

/**
 * The in-memory bucket, for the unit test. It honors the same contract as
 * `StorageService`: the test arranges what the bucket "received" with `put` and reads
 * what was deleted in `discarded`.
 */
export class StorageFake extends StorageContract {
  readonly discarded: string[] = []
  private readonly objects = new Map<string, StorageMetadata>()
  private readonly heads = new Map<string, Uint8Array>()
  private keys = 0

  /**
   * Test arrangement: the object the client uploaded. Without `head`, the content is a
   * PNG, the type of the test files.
   */
  put(
    path: string,
    metadata: StorageMetadata,
    head: Uint8Array = PNG_HEAD,
  ): this {
    this.objects.set(path, metadata)
    this.heads.set(path, head)
    return this
  }

  head(path: string): Promise<Uint8Array> {
    const head = this.heads.get(path)
    if (!head)
      return Promise.reject(
        new Error(`object missing from the bucket: ${path}`),
      )

    return Promise.resolve(head)
  }

  key(): string {
    this.keys += 1

    return `fake-${this.keys}.bin`
  }

  metadata(path: string): Promise<StorageMetadata> {
    const metadata = this.objects.get(path)
    if (!metadata)
      return Promise.reject(
        new Error(`object missing from the bucket: ${path}`),
      )

    return Promise.resolve(metadata)
  }

  discard(path: string): Promise<void> {
    this.discarded.push(path)
    this.objects.delete(path)

    return Promise.resolve()
  }

  signedUrl(path: string): Promise<string> {
    return Promise.resolve(`https://bucket.test/${path}?signed`)
  }

  signedDownload(file: StorageDownload): Promise<string> {
    return Promise.resolve(
      `https://bucket.test/${file.path}?download=${encodeURIComponent(file.originalName)}`,
    )
  }

  contentDisposition(originalName: string): string {
    return `attachment; filename="${originalName}"`
  }
}
