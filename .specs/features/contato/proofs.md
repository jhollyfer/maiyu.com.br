# contato proofs

**HEAD**: 2af11bb
**Tree**: clean
**Result**: 32 pass, 0 fail; mutations 0 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --` | 1 | - | pass |
| C2 | `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --` | 1 | - | pass |
| C3 | `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --` | 1 | - | pass |
| C4 | `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --` | 1 | - | pass |
| C5 | `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --` | 1 | - | pass |
| C6 | `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec` | 1 | - | pass |
| C7 | `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec` | 1 | - | pass |
| C8 | `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec` | 1 | - | pass |
| C9 | `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec` | 1 | - | pass |
| C10 | `cd backend && node ace test functional --files="app/features/administrator/contacts/show/show.e2e.spec.ts" --t` | 1 | - | pass |
| C11 | `cd backend && node ace test functional --files="app/features/administrator/contacts/answer/answer.e2e.spec.ts"` | 1 | - | pass |
| C12 | `cd backend && node ace test functional --files="app/features/administrator/contacts/answer/answer.e2e.spec.ts"` | 1 | - | pass |
| C13 | `cd backend && node ace test functional --files="app/features/administrator/contacts/show/show.e2e.spec.ts" --t` | 1 | - | pass |
| C14 | `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec` | 1 | - | pass |
| C15 | `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec` | 1 | - | pass |
| C16 | `cd backend && node ace test functional --files="app/repositories/contact/contact.repository.e2e.spec.ts" --tes` | 1 | - | pass |
| C17 | `cd backend && node ace test functional --files="commands/_contacts-prune.command.e2e.spec.ts" --tests="deletes` | 1 | - | pass |
| C18 | `cd backend && node ace test functional --files="commands/_contacts-prune.command.e2e.spec.ts" --tests="keeps c` | 1 | - | pass |
| C19 | `cd backend && node ace test functional --files="commands/_contacts-prune.command.e2e.spec.ts" --tests="dry run` | 1 | - | pass |
| C20 | `cd backend && node ace test functional --files="commands/_contacts-prune.command.e2e.spec.ts" --tests="running` | 1 | - | pass |
| C21 | `cd backend && node ace test functional --files="app/features/administrator/contacts/delete/delete.e2e.spec.ts"` | 1 | - | pass |
| C22 | `cd backend && node ace test functional --files="app/features/administrator/contacts/delete/delete.e2e.spec.ts"` | 1 | - | pass |
| C23 | `cd backend && node ace test functional --files="app/features/administrator/contacts/delete/delete.e2e.spec.ts"` | 1 | - | pass |
| C24 | `cd backend && node ace test functional --files="app/features/administrator/contacts/delete/delete.e2e.spec.ts"` | 1 | - | pass |
| Build | `pnpm --filter ./shared check` | - | - | pass |
| Build | `cd backend && pnpm typecheck` | - | - | pass |
| Build | `cd backend && pnpm lint` | - | - | pass |
| Build | `cd backend && pnpm format:check` | - | - | pass |
| Build | `cd backend && pnpm openapi:check` | - | - | pass |
| Build | `cd backend && ! pnpm -s pattern:check 2>&1 | grep -E '^\s*(backend|shared)/'` | - | - | pass |
| Build | `cd backend && pnpm authz:check` | - | - | pass |
| Build | `cd backend && pnpm validators:check` | - | - | pass |
