import type {
  QueryClientContract,
  TransactionClientContract,
} from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

import {
  left,
  right,
  type Either,
  type Paginated,
  type PaginationMeta,
  type SortDirection,
  type StoragesFileShowResponse,
} from '@maiyu/shared'

import type { PageCriteria } from '#core/page-criteria'
import { UNIQUE_CONFLICT, type UniqueConflict } from '#core/unique-conflict'
import type Storage from '#models/storage'
import { PROJECT_UNIQUE_TARGET } from '#repositories/shared/unique-targets'

/**
 * The unique indexes `insertUnlessUnique` tolerates, as the SQL `ON CONFLICT` takes them. A closed
 * list, not a free string: a target typed by hand in a repository is how a clash on the wrong
 * index gets read as "the value is taken". The kit's own indexes are here; the project's (a
 * member's `(tenant_id, document)`) go in `unique-targets.ts`, its extension point.
 */
export const UNIQUE_TARGET = {
  USER_EMAIL: '(lower(email))',
  USER_PHONE: '(phone)',
  ...PROJECT_UNIQUE_TARGET,
} as const

export type UniqueTarget = (typeof UNIQUE_TARGET)[keyof typeof UNIQUE_TARGET]

/** The file without the signed `url`, which only the presenter derives. */
type StorageFileShowResponse = Omit<StoragesFileShowResponse, 'url'>
/**
 * What `page` uses of the model query: ordering (twice, the column and the `id`
 * tie-break) and paginating. Structural because Lucid's `paginate` response is a
 * conditional type over the row, which does not resolve in a generic.
 */
type PageableQuery<Row> = {
  orderBy(column: string, direction: SortDirection): PageableQuery<Row>
  paginate(
    page: number,
    perPage: number,
  ): Promise<{ getMeta(): PaginationMeta; all(): Row[] }>
}

/** What `count` uses of the model query: the aliased `count`. */
type CountableQuery = {
  count(
    column: string,
  ): Promise<ReadonlyArray<{ $extras: Record<string, unknown> }>>
}

/**
 * What every Lucid repository implementation converts the same way: the
 * preloaded `storages` file (cover, photo, audio, gallery), the time
 * columns and the paginator page.
 *
 * It lives here, and not as a private method of each `*.lucid.repository.ts`
 * (`_standards/domain.md` §5.2), because the shape is the same in all: the `storages`
 * mapper was the testimonial's `toAvatar` and would be copied into each resource
 * with a file (task 2.7, `docs/DECISIONS.md` #22). What belongs to each entity
 * (`toEntity`, `toRow`) stays private in its implementation.
 *
 * A class with only `static`, like `WireDate` in `core/response.ts`: it keeps no
 * state and talks to nothing outside, so there is nothing to inject.
 */
export default class LucidMapping {
  /** The `storages` row with the keys the panel reads, by allowlist. */
  static file(storage: Storage | null): StorageFileShowResponse | null {
    if (!storage) return null

    return {
      id: storage.id,
      filename: storage.filename,
      originalName: storage.originalName,
      mimetype: storage.mimetype,
      size: storage.size,
      path: storage.path,
      status: storage.status,
      partSize: storage.partSize,
      uploadId: storage.uploadId,
      createdAt: LucidMapping.iso(storage.createdAt),
      updatedAt: LucidMapping.iso(storage.updatedAt),
      deletedAt: LucidMapping.iso(storage.deletedAt),
    }
  }

  /** The gallery (`manyToMany`), in the order Lucid returned it. */
  static files(storages: ReadonlyArray<Storage>): StorageFileShowResponse[] {
    const files: StorageFileShowResponse[] = []

    for (const storage of storages) {
      const file = LucidMapping.file(storage)
      if (file) files.push(file)
    }

    return files
  }

  static date(value: DateTime | null): Date | null {
    if (!value) return null
    return value.toJSDate()
  }

  static dateTime(value: Date | null): DateTime | null {
    if (!value) return null
    return DateTime.fromJSDate(value)
  }

  /**
   * `date` column as `YYYY-MM-DD` text, the same as Lucid's `serialize`
   * put on the wire. A calendar day is not an instant: as text, it does not move with the
   * reader's time zone.
   */
  static calendarDate(value: DateTime): string {
    // The `date` column comes from the database: Luxon only hydrates it valid, and `toFormat`
    // does not throw even for an invalid `DateTime`.
    return value.toFormat('yyyy-LL-dd')
  }

  /**
   * Whether the error the database returned is a violation of the `UNIQUE` index
   * (`unique_violation`, SQLSTATE `23505`).
   */
  static isUniqueViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false
    if (!('code' in error)) return false

    return error.code === '23505'
  }

  /**
   * The write, or the `UniqueConflict` fact when the `UNIQUE` index blocked it.
   * Any other database failure is rethrown: it is infrastructure, not a domain fact, and
   * rises to the use-case's `catch`, which logs it and answers `500` (`DECISIONS.md` #352).
   */
  static async unlessUnique<Value>(
    work: Promise<Value>,
  ): Promise<Either<UniqueConflict, Value>> {
    try {
      return right(await work)
    } catch (error) {
      if (LucidMapping.isUniqueViolation(error)) return left(UNIQUE_CONFLICT)

      throw error
    }
  }

  /**
   * The insert of a table that holds personal data (DECISIONS.md #408). A `UNIQUE` violation makes
   * Postgres write the offending value in the `DETAIL` of its log (`Key (cpf)=(123...) already
   * exists`), and the log outlives the row. `ON CONFLICT DO NOTHING RETURNING id` raises no error:
   * zero rows back is the unique fact, and nothing reaches the log. The row is the table's
   * columns as the database names them, already prepared (a password hashed), because the
   * model hooks do not run on this path.
   *
   * `target` names the unique index the insert tolerates, one of `UNIQUE_TARGET`: `(phone)` for
   * a column, `(lower(email))` for an expression index. Without a target the
   * `DO NOTHING` would also swallow a primary-key clash, a bug dressed as "the value is taken";
   * with it, a conflict on any other constraint raises as usual.
   */
  static async insertUnlessUnique(
    client: QueryClientContract,
    table: string,
    row: Record<string, unknown>,
    target: UniqueTarget,
  ): Promise<Either<UniqueConflict, null>> {
    const inserted: ReadonlyArray<unknown> = await client
      .knexQuery()
      .table(table)
      .insert(row)
      .onConflict(client.knexRawQuery(target))
      .ignore()
      .returning('id')

    if (inserted.length === 0) return left(UNIQUE_CONFLICT)

    return right(null)
  }

  /**
   * The update side of `insertUnlessUnique`: the "is the value free?" lookup that runs before an
   * `update`, serialized per value. Without the lock, two requests that change two rows to the
   * same value both look, both find it free, and the second `update` raises the unique violation
   * (and the value reaches the Postgres log, DECISIONS.md #408). `pg_advisory_xact_lock` takes a
   * lock keyed by `target` and `value` that lives until the transaction ends, so the second
   * request waits, looks after the first committed, and finds the value taken. The type asks for a
   * transaction on purpose: outside one the lock would be released at once and protect nothing.
   * `value` goes in already normalized the way the index compares it (`lower(email)` is the
   * lowercase text).
   * (https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
   */
  static async findUnderUniqueLock<Row>(
    client: TransactionClientContract,
    target: UniqueTarget,
    value: string,
    find: () => Promise<Row | null>,
  ): Promise<Row | null> {
    await client.rawQuery(
      'select pg_advisory_xact_lock(hashtextextended(?, 0))',
      [`${target}=${value}`],
    )

    return find()
  }

  static fromCalendarDate(value: string): DateTime {
    return DateTime.fromISO(value)
  }

  /**
   * The requested page, ordered by the criterion's column and then by `id`. Built by
   * hand from the paginator (_doc-lib/lucid.md#pagination): `all()` keeps the row
   * type, and the `{ meta, data }` comes out in the shared `Paginated`.
   *
   * The `id` tie-break is what makes the order total: the page asks for an `orderBy`
   * so results stay stable across page boundaries, and rows sharing the requested
   * column's value would otherwise swap pages between one request and the next
   * (_standards/backend.md §4.5, DECISIONS #347).
   */
  static async page<Row, Item>(
    query: PageableQuery<Row>,
    criteria: PageCriteria<string>,
    toItem: (row: Row) => Item,
  ): Promise<Paginated<Item>> {
    const page = await query
      .orderBy(criteria.sort, criteria.direction)
      .orderBy('id', criteria.direction)
      .paginate(criteria.page, criteria.perPage)

    return {
      meta: page.getMeta(),
      data: page.all().map((row) => toItem(row)),
    }
  }

  /**
   * How many rows the query reaches. Postgres `count` comes back as `bigint`,
   * which the driver delivers as a string so as not to lose precision: without the `Number` the
   * response would come out quoted.
   */
  static async count(query: CountableQuery): Promise<number> {
    const [row] = await query.count('* as total')
    return Number(row?.$extras.total ?? 0)
  }

  /**
   * The `whereILike` pattern that finds `term` anywhere in the column, with the
   * client's text taken as text: `%` and `_` are LIKE wildcards, and a search for
   * `50%` would otherwise match every row that has a `50` (_standards/backend.md
   * §4.5, DECISIONS #347). The backslash is escaped first because it is the
   * Postgres default escape character, so a literal one in the term stays literal.
   */
  static contains(term: string): string {
    return `%${term.replace(/[\\%_]/g, '\\$&')}%`
  }

  /** The same text that Luxon's `toJSON()` puts on the wire. */
  private static iso(value: DateTime | null): string | null {
    if (!value) return null
    return value.toISO()
  }
}
