import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

import { UPLOAD_STATUS, z } from '@maiyu/shared'
import type { Paginated } from '@maiyu/shared'

import { STORAGE_REFERENCES } from './storage.references.ts'
import {
  StorageRepository,
  type StorageFileRead,
  type StorageListCriteria,
} from './storage.repository.ts'

import { TransactionContext } from '#core/transaction-context'
import { Storage } from '#domain/storage/storage.entity'
import StorageModel from '#models/storage'
import CustomerScoped from '#repositories/shared/customer-scoped'
import LucidMapping from '#repositories/shared/lucid-mapping'

/**
 * The rows of a `count('* as total')`, typed `any` by the query builder. Postgres `count` is
 * `bigint` and the driver delivers it as a string, hence the coercion.
 */
const CountRows = z.array(z.object({ total: z.coerce.number() }))

@inject()
export class StorageLucidRepository extends StorageRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async findById(id: string): Promise<Storage | null> {
    const row = await CustomerScoped.readable(
      StorageModel.query({ client: this.transaction.client() }),
    )
      .where('id', id)
      .withScopes((scopes) => scopes.notDeleted())
      .first()
    if (!row) return null

    return this.toEntity(row)
  }

  async findWritable(id: string): Promise<Storage | null> {
    const row = await CustomerScoped.writable(
      StorageModel.query({ client: this.transaction.client() }),
    )
      .where('id', id)
      .withScopes((scopes) => scopes.notDeleted())
      .first()
    if (!row) return null

    return this.toEntity(row)
  }

  async detail(id: string): Promise<StorageFileRead | null> {
    const row = await CustomerScoped.readable(
      StorageModel.query({ client: this.transaction.client() }),
    )
      .where('id', id)
      .withScopes((scopes) => scopes.notDeleted())
      .first()
    if (!row) return null

    return this.toResponse(row)
  }

  async detailsOf(ids: ReadonlyArray<string>): Promise<StorageFileRead[]> {
    if (ids.length === 0) return []

    const rows = await CustomerScoped.readable(
      StorageModel.query({ client: this.transaction.client() }),
    )
      .whereIn('id', [...new Set(ids)])
      .withScopes((scopes) => scopes.notDeleted())

    return rows.map((row) => this.toResponse(row))
  }

  async areAttachable(
    ids: ReadonlyArray<string>,
    uploadedBy: string,
  ): Promise<boolean> {
    const unique = [...new Set(ids)]
    if (unique.length === 0) return true

    const rows = await CustomerScoped.writable(
      StorageModel.query({ client: this.transaction.client() }),
    )
      .whereIn('id', unique)
      .where('uploadedBy', uploadedBy)
      .where('status', UPLOAD_STATUS.UPLOADED)
      .withScopes((scopes) => scopes.notDeleted())

    return rows.length === unique.length
  }

  async usedBy(id: string): Promise<string[]> {
    const client = this.transaction.client()
    const counts = await Promise.all(
      STORAGE_REFERENCES.map(async (reference) => {
        const rows: unknown = await client
          .from(reference.table)
          .where(reference.column, id)
          .count('* as total')

        const [row] = CountRows.parse(rows)
        return { label: reference.label, total: row?.total ?? 0 }
      }),
    )

    return counts.filter((count) => count.total > 0).map((count) => count.label)
  }

  /**
   * Find, then insert or update: never `updateOrCreate` (`_standards/domain.md`
   * §5.2, `DECISIONS.md` #332). The existing row is written by the query builder
   * and not by `merge().save()`: both of those run the auto-timestamp, and
   * `autoUpdate` on `updatedAt` would overwrite the instant the entity stamped,
   * which is the age `findOrphans` reads. The query builder `update` skips hooks
   * and auto-timestamps (_doc-lib/lucid.md#crud-operations,
   * https://lucid.adonisjs.com/docs/crud-operations, "Updating in bulk with the
   * query builder"); `create` keeps a value already set.
   */
  async save(storage: Storage): Promise<void> {
    const client = this.transaction.client()
    const { id, createdAt, updatedAt, deletedAt, ...columns } =
      storage.snapshot()
    const existing = await StorageModel.find(id, { client })

    if (!existing) {
      await StorageModel.create(
        {
          id,
          ...columns,
          // `open` always stamps the birth; `undefined` lets the column default it.
          createdAt: this.dateOrNull(createdAt) ?? undefined,
          updatedAt: this.dateOrNull(updatedAt),
          deletedAt: this.dateOrNull(deletedAt),
        },
        { client },
      )
      return
    }

    await StorageModel.query({ client })
      .where('id', id)
      .update({ ...columns, updatedAt, deletedAt })
  }

  async delete(storage: Storage): Promise<void> {
    await StorageModel.query({ client: this.transaction.client() })
      .where('id', storage.id)
      .delete()
  }

  /**
   * The status filter in the same `UPDATE` is the claim: Postgres takes the row
   * lock to write it, so the second writer re-evaluates the `WHERE` after the
   * first commits and matches nothing. `returning('id')` makes the result the
   * claimed rows instead of a driver-specific count
   * (_doc-lib/lucid.md#update-and-delete-queries,
   * https://lucid.adonisjs.com/docs/update-and-delete-queries).
   */
  async claimCompletion(storage: Storage): Promise<Storage | null> {
    const { id, status, uploadId, updatedAt } = storage.snapshot()
    const claimed: ReadonlyArray<unknown> = await StorageModel.query({
      client: this.transaction.client(),
    })
      .where('id', id)
      .where('status', UPLOAD_STATUS.PENDING)
      .update({ status, uploadId, updatedAt })
      .returning('id')

    if (claimed.length === 0) return null

    return storage
  }

  /** The same row lock as `claimCompletion`: whichever writes first wins, and the other matches nothing. */
  async deletePending(id: string): Promise<boolean> {
    const deleted: ReadonlyArray<unknown> = await StorageModel.query({
      client: this.transaction.client(),
    })
      .where('id', id)
      .where('status', UPLOAD_STATUS.PENDING)
      .delete()
      .returning('id')

    return deleted.length > 0
  }

  async findAbandoned(before: Date): Promise<Storage[]> {
    const rows = await StorageModel.query({ client: this.transaction.client() })
      .where('status', UPLOAD_STATUS.PENDING)
      .where('createdAt', '<', before)
      .withScopes((scopes) => scopes.notDeleted())
      .orderBy('createdAt', 'asc')

    return rows.map((row) => this.toEntity(row))
  }

  /**
   * One `NOT IN` per entry of `STORAGE_REFERENCES`: a column added there is
   * covered here too, by the same list that guards the deletion.
   */
  async findOrphans(before: Date): Promise<Storage[]> {
    const client = this.transaction.client()
    const query = StorageModel.query({ client })
      .where('status', UPLOAD_STATUS.UPLOADED)
      .where('updatedAt', '<', before)
      .withScopes((scopes) => scopes.notDeleted())

    for (const reference of STORAGE_REFERENCES) {
      query.whereNotIn(
        'id',
        client
          .from(reference.table)
          .select(reference.column)
          .whereNotNull(reference.column),
      )
    }

    const rows = await query.orderBy('updatedAt', 'asc')

    return rows.map((row) => this.toEntity(row))
  }

  async paginate(
    criteria: StorageListCriteria,
  ): Promise<Paginated<StorageFileRead>> {
    const query = CustomerScoped.readable(
      StorageModel.query({ client: this.transaction.client() }),
    ).withScopes((scopes) => scopes.notDeleted())

    if (criteria.status) query.where('status', criteria.status)
    if (criteria.mimetype) query.where('mimetype', criteria.mimetype)

    // The `OR` goes inside a subquery: chained directly it would escape the
    // previous `AND`, and the search would cancel the status filter.
    if (criteria.search) {
      const search = LucidMapping.contains(criteria.search)

      query.where((builder) => {
        builder
          .whereILike('originalName', search)
          .orWhereILike('filename', search)
          .orWhereILike('mimetype', search)
      })
    }

    return LucidMapping.page(query, criteria, (row) => this.toResponse(row))
  }

  private toEntity(row: StorageModel): Storage {
    return Storage.restore({
      id: row.id,
      tenantId: row.tenantId,
      customerId: row.customerId,
      uploadedBy: row.uploadedBy,
      filename: row.filename,
      originalName: row.originalName,
      mimetype: row.mimetype,
      size: row.size,
      path: row.path,
      status: row.status,
      uploadId: row.uploadId,
      partSize: row.partSize,
      createdAt: row.createdAt?.toJSDate() ?? null,
      updatedAt: row.updatedAt?.toJSDate() ?? null,
      deletedAt: row.deletedAt?.toJSDate() ?? null,
    })
  }

  /** The `url` does not come out of here: the use case signs it, through the bucket contract, on every read. */
  private toResponse(row: StorageModel): StorageFileRead {
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.originalName,
      mimetype: row.mimetype,
      size: row.size,
      path: row.path,
      status: row.status,
      uploadId: row.uploadId,
      partSize: row.partSize,
      createdAt: row.createdAt?.toISO() ?? null,
      updatedAt: row.updatedAt?.toISO() ?? null,
      deletedAt: row.deletedAt?.toISO() ?? null,
    }
  }

  private dateOrNull(date: Date | null): DateTime | null {
    if (!date) return null

    return DateTime.fromJSDate(date)
  }
}
