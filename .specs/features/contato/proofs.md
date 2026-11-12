# contato proofs

**HEAD**: 7ec19eb
**Tree**: clean
**Result**: 33 pass, 0 fail; mutations 3 killed, 0 not

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
| C25 | `cd backend && node ace test functional --files="app/features/administrator/contacts/answer/answer.e2e.spec.ts"` | 1 | - | pass |
| Build | `pnpm --filter ./shared check` | - | - | pass |
| Build | `cd backend && pnpm typecheck` | - | - | pass |
| Build | `cd backend && pnpm lint` | - | - | pass |
| Build | `cd backend && pnpm format:check` | - | - | pass |
| Build | `cd backend && pnpm openapi:check` | - | - | pass |
| Build | `node -e "const r=require('child_process').spawnSync('pnpm',['-s','pattern:check'],{cwd:'backend',encoding:'utf` | - | - | pass |
| Build | `cd backend && pnpm authz:check` | - | - | pass |
| Build | `cd backend && pnpm validators:check` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| C17: guarda de 12 meses vira 13 | `backend/app/features/administrator/contacts/prune/prune.use-case.ts:13` | yes |
| C24: o grupo administrator sem o role() deixa o MEMBER passar | `backend/start/routes.ts:171` | yes |
| edge case: claimAnswer sem o answered_at IS NULL regrava answered_at | `backend/app/repositories/contact/contact.lucid.repository.ts:84` | yes |
