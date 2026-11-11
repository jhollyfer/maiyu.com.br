import { defineConfig, drivers } from '@adonisjs/core/hash'

/**
 * Passwords in Argon2id (DECISIONS.md #314). `scrypt` stays in `list` until every old hash is
 * redone, but being listed is not enough: `hash.verify` always uses the default driver and does
 * not detect the algorithm, so the scrypt hashes are read through `#core/legacy-aware-hash-driver`
 * (DECISIONS.md #370). Parameters from the page's example (_doc-lib/adonisjs.md#guides/security/hashing,
 * https://docs.adonisjs.com/guides/security/hashing, "Migrating between algorithms").
 */
const hashConfig = defineConfig({
  default: 'argon',

  list: {
    argon: drivers.argon2({
      variant: 'id',
      iterations: 3,
      memory: 65536,
      parallelism: 4,
      saltSize: 16,
      hashLength: 32,
    }),

    scrypt: drivers.scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }),
  },
})

export default hashConfig

declare module '@adonisjs/core/types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- declaration merging requires `interface`, which adds no members here
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
