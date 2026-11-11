import { UPLOAD_STATUS } from '@maiyu/shared'
import type { Paginated, SortDirection } from '@maiyu/shared'

import {
  StorageRepository,
  type StorageFileRead,
  type StorageListCriteria,
} from './storage.repository.ts'

import MemoryRows from '#core/memory-rows'
import { Storage, type StorageProps } from '#domain/storage/storage.entity'

/** The sign of the comparison by sort direction. */
const SIGN = { asc: 1, desc: -1 } satisfies Record<SortDirection, number>

/**
 * The second real implementation, for the use case unit test
 * (`_standards/domain.md` §5.3). It keeps copies that keep the class (`MemoryRows.copy`):
 * the test does not change the "database" by reference.
 */
export class StorageMemoryRepository extends StorageRepository {
  private readonly rows = new Map<string, StorageProps>()
  private readonly uses = new Map<string, string[]>()

  /** Test arrangement: the file is in use under these labels. */
  markUsed(id: string, labels: string[]): this {
    this.uses.set(id, labels)
    return this
  }

  async findById(id: string): Promise<Storage | null> {
    const props = this.rows.get(id)
    if (!props || props.deletedAt) return null

    return Storage.restore(MemoryRows.copy(props))
  }

  async detail(id: string): Promise<StorageFileRead | null> {
    const props = this.rows.get(id)
    if (!props || props.deletedAt) return null

    return this.toResponse(props)
  }

  async detailsOf(ids: ReadonlyArray<string>): Promise<StorageFileRead[]> {
    return [...new Set(ids)].flatMap((id) => {
      const props = this.rows.get(id)

      if (!props || props.deletedAt) return []

      return [this.toResponse(props)]
    })
  }

  async areAttachable(ids: ReadonlyArray<string>): Promise<boolean> {
    return [...new Set(ids)].every((id) => {
      const props = this.rows.get(id)

      return (
        props !== undefined &&
        !props.deletedAt &&
        props.status === UPLOAD_STATUS.UPLOADED
      )
    })
  }

  async usedBy(id: string): Promise<string[]> {
    return this.uses.get(id) ?? []
  }

  async save(storage: Storage): Promise<void> {
    this.rows.set(storage.id, MemoryRows.copy(storage.snapshot()))
  }

  async delete(storage: Storage): Promise<void> {
    this.rows.delete(storage.id)
  }

  async claimCompletion(storage: Storage): Promise<Storage | null> {
    const row = this.rows.get(storage.id)
    if (!row || row.status !== UPLOAD_STATUS.PENDING) return null

    await this.save(storage)

    return storage
  }

  async deletePending(id: string): Promise<boolean> {
    const row = this.rows.get(id)
    if (!row || row.status !== UPLOAD_STATUS.PENDING) return false

    return this.rows.delete(id)
  }

  async findAbandoned(before: Date): Promise<Storage[]> {
    return this.live()
      .filter((row) => row.status === UPLOAD_STATUS.PENDING)
      .filter((row) => this.isBefore(row.createdAt, before))
      .sort((a, b) => this.time(a.createdAt) - this.time(b.createdAt))
      .map((row) => Storage.restore(MemoryRows.copy(row)))
  }

  async findOrphans(before: Date): Promise<Storage[]> {
    return this.live()
      .filter((row) => row.status === UPLOAD_STATUS.UPLOADED)
      .filter((row) => this.isBefore(row.updatedAt, before))
      .filter((row) => (this.uses.get(row.id) ?? []).length === 0)
      .sort((a, b) => this.time(a.updatedAt) - this.time(b.updatedAt))
      .map((row) => Storage.restore(MemoryRows.copy(row)))
  }

  async paginate(
    criteria: StorageListCriteria,
  ): Promise<Paginated<StorageFileRead>> {
    const search = criteria.search?.toLowerCase()
    const sign = SIGN[criteria.direction]
    const all = [...this.rows.values()]
      .filter((row) => !row.deletedAt)
      .filter((row) => !criteria.status || row.status === criteria.status)
      .filter((row) => !criteria.mimetype || row.mimetype === criteria.mimetype)
      .filter(
        (row) =>
          !search ||
          [row.originalName, row.filename, row.mimetype].some((value) =>
            value.toLowerCase().includes(search),
          ),
      )
      .sort(
        (a, b) =>
          sign * (this.compare(a, b, criteria.sort) || this.compareIds(a, b)),
      )
    const page = MemoryRows.slice(all, criteria.page, criteria.perPage)

    return {
      meta: page.meta,
      data: page.data.map((row) => this.toResponse(row)),
    }
  }

  private live(): StorageProps[] {
    return [...this.rows.values()].filter((row) => !row.deletedAt)
  }

  /** A row without the stamp never counts as old: SQL `NULL < x` is not true either. */
  private isBefore(date: Date | null, before: Date): boolean {
    return date !== null && date.getTime() < before.getTime()
  }

  private time(date: Date | null): number {
    return date?.getTime() ?? 0
  }

  private compare(
    a: StorageProps,
    b: StorageProps,
    sort: StorageListCriteria['sort'],
  ): number {
    if (sort === 'size') return a.size - b.size
    if (sort === 'createdAt')
      return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)

    return a[sort].localeCompare(b[sort])
  }

  /**
   * The `id` tie-break the Lucid side also applies (DECISIONS #347). Code-unit order,
   * not `localeCompare`: it is the order Postgres gives a lowercase UUID.
   */
  private compareIds(a: StorageProps, b: StorageProps): number {
    if (a.id === b.id) return 0
    if (a.id < b.id) return -1
    return 1
  }

  private toResponse(props: StorageProps): StorageFileRead {
    return {
      id: props.id,
      filename: props.filename,
      originalName: props.originalName,
      mimetype: props.mimetype,
      size: props.size,
      path: props.path,
      status: props.status,
      uploadId: props.uploadId,
      partSize: props.partSize,
      createdAt: props.createdAt?.toISOString() ?? null,
      updatedAt: props.updatedAt?.toISOString() ?? null,
      deletedAt: props.deletedAt?.toISOString() ?? null,
    }
  }
}
