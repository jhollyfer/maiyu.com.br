import { Env } from '@adonisjs/core/env'

import EnvBlocks from '#core/env-blocks'

/**
 * The single environment reader (`_standards/backend.md` §6). Every key read by
 * `env.get()` is declared here, and `pattern:check` enforces that every declared key is read
 * by someone. A dead key goes: declared without a reader, it promises a configuration that
 * does not exist.
 *
 * Required is whatever brings down the boot when missing, and bringing down the boot is the
 * desired behavior: better for the application not to start than to start with a
 * default hidden in the code. Secrets and credentials have no default.
 *
 * The blocks follow the standard's order, the same as `.env.example`.
 *
 * `sync-to-project.mjs --check` holds this file to the model: `EnvBlocks.assert` stays, and a key
 * the model declares as required is never made optional here.
 *
 * One catalog for every project (DECISIONS.md #417): every key of `.env.example` the application
 * reads is declared here (`MINIO_ROOT_*` are read by `infra/minio/minio-setup.sh`), and the ones of a block the project does not use are optional, because empty is the right value
 * of a block that is off. A block that is on must be complete: `EnvBlocks.assert` below stops the
 * boot naming the empty key (_doc-lib/adonisjs.md#configuration,
 * https://docs.adonisjs.com/configuration: `Env.schema.string.optional()`).
 */
const env = await Env.create(new URL('../', import.meta.url), {
  /*
  |----------------------------------------------------------------------------
  | Node
  |----------------------------------------------------------------------------
  |
  | `PORT` and `HOST` are read from `process.env` by the framework itself, and
  | `NODE_ENV` by the loader, before the env service exists. `TZ` is read
  | by Node: when absent, the process inherits the host time zone, and the same query
  | answers different dates depending on the machine. `America/Eirunepe` in every
  | environment, the zone of every Maiyu system and of the database session (#393).
  */
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  TZ: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------------------------
  | App
  |----------------------------------------------------------------------------
  */
  LOG_LEVEL: Env.schema.string(),
  APP_KEY: Env.schema.secret(),
  APP_SERVER_URL: Env.schema.string({ format: 'url', tld: false }),

  /*
  | The public origin of the web app. Optional because it is only needed when the app and the
  | API live on different sites: it decides the session cookie `sameSite` (`config/session-token.ts`).
  | Absent, the cookie is `lax`: a missing configuration never becomes `none`.
  */
  APP_CLIENT_URL: Env.schema.string.optional({ format: 'url', tld: false }),

  /*
  | The reverse proxies whose `X-Forwarded-For` is trusted: addresses, CIDR
  | ranges and the words `loopback`, `linklocal` and `uniquelocal`, separated by
  | comma (the http-server's `trustProxy`, via proxy-addr). Optional because
  | with no proxy in front the right value is none; when absent only `loopback` holds, the
  | framework's own default. Never `true`: the client would forge the IP, and with
  | it the key of every limit.
  */
  TRUSTED_PROXIES: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------------------------
  | Session
  |----------------------------------------------------------------------------
  |
  | `COOKIE_DOMAIN` is the session cookie domain, when the app and the API are
  | on different hosts of the same parent domain. Without it the cookie is born host-only and
  | the frontend SSR never receives it: every F5 on a private route becomes 401. In
  | development it does not show up because cookies ignore ports. Optional because
  | empty is the right value when both are on the same host.
  */
  COOKIE_DOMAIN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------------------------
  | CORS
  |----------------------------------------------------------------------------
  |
  | Origins the browser may use to call this API, separated by
  | comma. Optional because in development `config/cors.ts` allows everything;
  | outside it, absent means an empty list, and an empty list refuses every
  | cross-origin request, the right default for a value nobody configured.
  */
  CORS_ORIGINS: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------------------------
  | Database
  |----------------------------------------------------------------------------
  |
  | `DATABASE_SSL` absent means **TLS off**: the database connection
  | goes out in clear text. It is the default because a database on the same private network as the
  | application normally does not speak TLS; a managed database, outside it, requires
  | `true`. The decision is about where the database is, not `NODE_ENV`.
  */
  DATABASE_URL: Env.schema.string(),
  DATABASE_SSL: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------------------------
  | Storage
  |----------------------------------------------------------------------------
  |
  | An S3-compatible bucket: the upload is presigned multipart, and multipart is an
  | S3 API that a local disk does not have. `DRIVE_DISK` picks the disk (`s3` or `fs`),
  | required and without a default, like every choice of the operator. The prefix is
  | `STORAGE_`, and not a vendor name: what the code depends on is the
  | protocol, and vendors swap places by changing the endpoint.
  |
  | Credential and bucket are required: without them the upload would fail on the first
  | request, with an empty bucket in place of the name. `UPLOAD_MAX_SIZE` is the ceiling
  | per file, in bytes, and is also required: how much fits in an upload is
  | the operator's decision, and a default in the code would be a ceiling nobody
  | chose.
  */
  DRIVE_DISK: Env.schema.enum(['s3', 'fs'] as const),
  UPLOAD_MAX_SIZE: Env.schema.number(),
  STORAGE_KEY: Env.schema.string(),
  STORAGE_SECRET: Env.schema.string(),
  STORAGE_BUCKET: Env.schema.string(),
  STORAGE_ENDPOINT: Env.schema.string({ format: 'url', tld: false }),
  STORAGE_FORCE_PATH_STYLE: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------------------------
  | Seeding
  |----------------------------------------------------------------------------
  |
  | Each seed is switched on by its key having a value, in any environment; empty skips that
  | seed with one log line and the rest of `node ace db:seed` runs. The application boots
  | without these: only whoever seeds needs them.
  |
  | The first administrator: the password goes with the e-mail.
  */
  SEED_OWNER_EMAIL: Env.schema.string.optional(),
  SEED_OWNER_PASSWORD: Env.schema.string.optional(),
  SEED_DEMO_PASSWORD: Env.schema.string.optional(),
  /*
  | The first tenant (DECISIONS.md #390): the client the existing data migrates to. No default:
  | a name or a city written here would seed the wrong client in every project. The four go
  | together; the city is the slug of one of the seeded cities, the type one of `TENANT_TYPES`.
  */
  SEED_TENANT_NAME: Env.schema.string.optional(),
  SEED_TENANT_SLUG: Env.schema.string.optional(),
  SEED_TENANT_CITY: Env.schema.string.optional(),
  SEED_TENANT_TYPE: Env.schema.string.optional(),
  /*
  | Single-client mode (DECISIONS.md #399): the slug of the one tenant of a product that by nature
  | has one client. Set, the public routes carry no city or tenant segment and resolve this tenant
  | (404 when it does not exist or is inactive); absent, the segments of #390 apply. No default.
  */
  SINGLE_TENANT_SLUG: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------------------------
  | Mail and queue
  |----------------------------------------------------------------------------
  |
  | The block is on when `SMTP_HOST` has a value, and then `MAIL_FROM` and `SMTP_PORT` are
  | required (`EnvBlocks`). Empty `SMTP_HOST` skips every send (`config/mail.ts`); without
  | `REDIS_URL` the queue uses the database. The code of the block (`@adonisjs/mail`,
  | `@adonisjs/queue`, `@adonisjs/redis`) only reaches the project that has the dependencies;
  | the keys are declared in every one.
  */
  MAIL_FROM: Env.schema.string.optional(),
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  REDIS_URL: Env.schema.string.optional(),
})

EnvBlocks.assert((key) => env.get(key))

export default env
