# Conta do dono Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/conta/design.md`
**Status**: Approved
**Approved**: 2026-11-11 - user: "o dono APROVOU o R2.10 como recomendado" (via regente; respostas 1 a 7 como recomendado, T8 entra, aviso por e-mail fora)
**Mutations**: 3
**Build note**: o `pattern:check` lê o repositório inteiro e acusa 6 achados de `frontend/`, de outra frente (R1.7 e R2/R3); o Build reprova só achado em `backend/` ou `shared/`.
**Build**: `pnpm --filter ./shared check; cd backend && pnpm typecheck; cd backend && pnpm lint; cd backend && pnpm format:check; cd backend && pnpm openapi:check; node -e "const r=require('child_process').spawnSync('pnpm',['-s','pattern:check'],{cwd:'backend',encoding:'utf8'}), t=r.stdout+r.stderr, n=/^ *backend\\//m.test(t)+/^ *shared\\//m.test(t), x=process.exit(n)"; cd backend && pnpm authz:check; cd backend && pnpm validators:check`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `_standards/architecture.md` §8, `_standards/backend.md` §7 e §4.10, `backend/adonisrc.ts`, `shared/vitest.config.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| shared validator e response | unit | todo campo e recusa do spec | `shared/src/**/*.test.ts` | `pnpm --filter ./shared test:unit` |
| entidade | unit | toda troca que marca revogação, e a que não marca | `backend/app/domain/**/*.unit.spec.ts` | `cd backend && node ace test unit` |
| repository | e2e | save com e sem revogação, na mesma transação | `backend/app/repositories/**/*.e2e.spec.ts` | `cd backend && node ace test functional` |
| use-case | unit | 1:1 com os ACs, com repository em memória | `backend/app/features/**/*.unit.spec.ts` | `cd backend && node ace test unit` |
| rota | e2e | 200 seguido de 401, 409, 422, 429, 401 sem sessão | `backend/app/features/**/*.e2e.spec.ts` | `cd backend && node ace test functional` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | tarefa só com unitário | `pnpm --filter ./shared test:unit; cd backend && node ace test unit` |
| Full | tarefa com e2e | `cd backend && node ace test unit && node ace test functional` |
| Build | fim de fase | o `**Build**` acima e o Full |

---

## Execution Plan

### Phase 1: Domínio e persistência

```
T1 → T2 → T3
```

### Phase 2: Rotas

```
T4 → T5
```

---

## Task Breakdown

### T1: Validator e resposta do perfil no shared

**What**: `AccountProfileUpdateValidator` (Rule.partial, `currentPassword` obrigatório) e `AccountProfileShowResponse`.
**Where**: `shared/src/validators/account/profile.validator.ts`
**Depends on**: None
**Reuses**: `Rule.email()`, `Rule.password()`, `Rule.partial`
**Requirement**: ACCOUNT-01, ACCOUNT-02, ACCOUNT-03

**Done when**:

- [ ] corpo sem `email` nem `password` recusado; senha fora da regra recusada
- [ ] Gate check passes: `pnpm --filter ./shared test:unit`

**Tests**: unit
**Gate**: quick

---

### T2: User.update e credentials

**What**: a entidade marca revogação quando muda e-mail ou senha e não marca quando o e-mail é o mesmo.
**Where**: `backend/app/domain/user/user.entity.ts`
**Depends on**: T1
**Reuses**: forma do `User` do adacaibs

**Done when**:

- [ ] unitário cobre e-mail novo, e-mail igual e senha nova
- [ ] Gate check passes: `cd backend && node ace test unit`

**Tests**: unit
**Gate**: quick

---

### T3: UserRepository.save com revogação na mesma transação

**What**: Lucid e memória gravam linha e hash e chamam `SessionRepository.revokeAll` dentro da `UnitOfWork`.
**Where**: `backend/app/repositories/user/user.lucid.repository.ts`
**Depends on**: T2
**Reuses**: `UnitOfWork`, `LucidMapping.unlessUnique`

**Done when**:

- [ ] e2e de contrato: troca de senha apaga os tokens; save sem troca mantém; erro no save mantém tudo
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

---

### T4: GET /account/profile

**What**: use-case, controller, presenter e rota do perfil com `auth()`.
**Where**: `backend/app/features/account/profile/show/show.use-case.ts`
**Depends on**: T3
**Reuses**: `ActorSchema`

**Done when**:

- [ ] e2e: 200 sem senha nem hash; 401 sem sessão
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

---

### T5: PUT /account/profile

**What**: validator VineJS par do Zod, use-case com prova da senha atual, controller que limpa os cookies, `accountThrottle`, mensagens nos três idiomas, `openapi.json` e baseline.
**Where**: `backend/app/features/account/profile/update/update.use-case.ts`
**Depends on**: T4
**Reuses**: `SessionCookie`, `UnitOfWork`, `hash`

**Done when**:

- [ ] e2e: troca de senha 200 e cookie antigo 401; troca de e-mail 200 e cookie antigo 401; 409; 422 da senha atual; 422 da senha nova; 429; e-mail igual não derruba
- [ ] `openapi:check`, `authz:check`, `validators:check` verdes
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

**Commit**: `feat(conta): troca de senha e e-mail com revogação de sessão`

---

## Checks

**C1** - Troca de senha responde 200 e grava o hash novo (ACCOUNT-01, AC 1)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --tests="changing the password answers 200 and the new password signs in"`

**C2** - Troca de senha apaga os tokens na mesma transação (ACCOUNT-01, AC 2)
Proof: `cd backend && node ace test functional --files="app/repositories/user/user.repository.e2e.spec.ts" --tests="save with a new password revokes the sessions in the same transaction"`

**C3** - Cookie de antes da troca de senha responde 401 (ACCOUNT-01, AC 3)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --tests="after a password change the old cookie answers 401"`

**C4** - Senha atual errada responde 422 em currentPassword e não muda nada (ACCOUNT-01, AC 4)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --tests="a wrong current password answers 422 and changes nothing"`

**C5** - Senha nova fora da regra responde 422 em password (ACCOUNT-01, AC 5)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --tests="a weak new password answers 422"`

**C6** - Save que falha mantém senha e sessões (ACCOUNT-01, AC 6)
Proof: `cd backend && node ace test functional --files="app/repositories/user/user.repository.e2e.spec.ts" --tests="a failed save keeps the password and the sessions"`

**C7** - Troca de e-mail responde 200 com o perfil (ACCOUNT-02, AC 1)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --tests="changing the email answers 200 and the new email signs in"`

**C8** - Cookie de antes da troca de e-mail responde 401 (ACCOUNT-02, AC 2)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --tests="after an email change the old cookie answers 401"`

**C9** - E-mail de outra conta responde 409 EMAIL_IN_USE (ACCOUNT-02, AC 3)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --tests="an email in use answers 409"`

**C10** - E-mail igual ao atual não derruba as sessões (ACCOUNT-02, AC 4)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/update/update.e2e.spec.ts" --tests="the same email keeps the session"`

**C11** - Perfil responde 200 sem senha nem hash (ACCOUNT-03, AC 1)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/show/show.e2e.spec.ts" --tests="shows the profile without the password"`

**C12** - Perfil sem sessão responde 401 (ACCOUNT-03, AC 2)
Proof: `cd backend && node ace test functional --files="app/features/account/profile/show/show.e2e.spec.ts" --tests="without a session answers 401"`

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2
T3 → T4 (fim da fase 1 para o início da fase 2)
```
