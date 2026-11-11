import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

import env from '#start/env'

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: 'pg',

  connections: {
    /**
     * PostgreSQL connection.
     */
    pg: {
      client: 'pg',
      connection: {
        connectionString: env.get('DATABASE_URL'),

        /**
         * Turned on by `DATABASE_SSL`, not by `NODE_ENV`: what decides is where the
         * database is, not in which environment the application runs. A database on the same
         * private network as the application usually does not speak TLS - and requiring TLS there brings down
         * the connection at boot.
         */
        ssl: (function () {
          if (env.get('DATABASE_SSL')) return { rejectUnauthorized: true }

          return false
        })(),
      },
      migrations: {
        /**
         * Sorts the migration files by name. The timestamp at the start of the
         * name is what decides the order, and without this the lexicographic sort
         * scrambles files with different digit counts.
         */
        naturalSort: true,
        paths: ['database/migrations'],

        /**
         * In production a migration only moves forward (`DECISIONS.md` #291):
         * `rollback`, `reset` and `refresh` refuse to run with
         * `NODE_ENV=production`, even with `--force`. Undoing an applied migration is
         * a new migration that reverts it (_standards/backend.md §4.13;
         * _doc-lib/lucid.md#migrations, https://lucid.adonisjs.com/docs/migrations).
         */
        disableRollbacksInProduction: true,
      },

      schemaGeneration: {
        /**
         * `database/schema.ts` is regenerated on every `migration:run` from the
         * live connection, and it is from it that the Lucid models inherit the columns.
         */
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },

      // `db:query` only fires with `debug`; the query-count fixture of the tests listens to it
      // (_doc-lib/lucid.md#debugging, https://lucid.adonisjs.com/docs/debugging).
      debug: app.inDev || app.inTest,
    },
  },
})

export default dbConfig
