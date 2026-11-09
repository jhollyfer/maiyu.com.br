import { defineConfig, drivers } from '@adonisjs/core/hash'

/**
 * Passwords in Argon2id (DECISIONS.md #314). `scrypt` stays in `list` until every old hash is
 * redone: without it there, `hash.verify` does not recognize the hash of whoever has not signed
 * in since the switch (_doc-lib/adonisjs.md#guides/security/hashing,
 * https://docs.adonisjs.com/guides/security/hashing; official page not checked in this
 * extraction, parameters from the doc's example).
 */
const hashConfig = defineConfig({
  default: 'argon',

  list: {
    argon: drivers.argon2({
      version: 0x13,
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
