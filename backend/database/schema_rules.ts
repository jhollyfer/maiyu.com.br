import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * What the `database/schema.ts` generator cannot read from the database. `serializeAs: null`
 * declared on the model would not survive the next generation; here it does. Only what is
 * equivalent to a credential goes in: the response shape is each presenter's job.
 */
export default {
  tables: {
    auth_access_tokens: {
      columns: {
        hash: {
          tsType: 'string',
          decorators: [{ name: '@column', args: { serializeAs: null } }],
        },
      },
    },
    users: {
      columns: {
        password: {
          tsType: 'string',
          decorators: [{ name: '@column', args: { serializeAs: null } }],
        },
      },
    },
  },
} satisfies SchemaRules
