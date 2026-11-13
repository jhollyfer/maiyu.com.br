-- Runs once, on the first start of an empty volume (`/docker-entrypoint-initdb.d`
-- of the postgres image; `_standards/tooling.md` §8.4). The suite database sits next
-- to the dev one, with the `_test` suffix that `tests/database-guard.ts` demands;
-- `app` is the POSTGRES_USER of the compose, the owner of both.
CREATE DATABASE app_test OWNER app;
