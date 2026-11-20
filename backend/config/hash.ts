import { defineConfig, drivers } from '@adonisjs/core/hash'

/**
 * Passwords in Argon2id, the only driver (DECISIONS.md #314, #796). Parameters from the page's
 * example (_doc-lib/adonisjs.md#guides/security/hashing,
 * https://docs.adonisjs.com/guides/security/hashing).
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
  },
})

export default hashConfig

declare module '@adonisjs/core/types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- declaration merging requires `interface`, which adds no members here
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
