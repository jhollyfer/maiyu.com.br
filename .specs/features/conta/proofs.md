# conta proofs

**HEAD**: 7ec19eb
**Tree**: clean
**Result**: 21 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --test` | 1 | - | pass |
| C2 | `cd backend && node ace test functional --files="app/repositories/user/user.repository.e2e.spec.ts" --tests="sa` | 2 | - | pass |
| C3 | `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --test` | 1 | - | pass |
| C4 | `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --test` | 1 | - | pass |
| C5 | `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --test` | 1 | - | pass |
| C6 | `cd backend && node ace test functional --files="app/repositories/user/user.repository.e2e.spec.ts" --tests="a ` | 2 | - | pass |
| C7 | `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --test` | 1 | - | pass |
| C8 | `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --test` | 1 | - | pass |
| C9 | `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --test` | 1 | - | pass |
| C13 | `cd backend && node ace test unit --files="app/features/account/profile/update/update.unit.spec.ts" --tests="th` | 1 | - | pass |
| C15 | `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --test` | 1 | - | pass |
| C11 | `cd backend && node ace test functional --files="app/features/account/profile/show/show.e2e.spec.ts" --tests="s` | 1 | - | pass |
| C12 | `cd backend && node ace test functional --files="app/features/account/profile/show/show.e2e.spec.ts" --tests="w` | 1 | - | pass |
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
| save + revokeAll fora da unidade de trabalho no use case | `backend/app/features/account/profile/update/update.use-case.ts:90` | yes |
| troca de nome ou senha sem conferir o hash de currentPassword | `backend/app/features/account/profile/update/update.use-case.ts:74` | yes |
| troca so de nome derruba a sessao e limpa os cookies | `backend/app/features/account/profile/update/update.controller.ts:39` | yes |
