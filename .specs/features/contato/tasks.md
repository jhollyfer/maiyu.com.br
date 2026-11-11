# Contato Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/contato/design.md`
**Status**: Approved
**Approved**: 2026-11-11 - user: "o dono APROVOU o R2.10 como recomendado" (via regente; respostas 1 a 7 como recomendado, T8 entra, aviso por e-mail fora)
**Mutations**: 3
**Build**: `pnpm --filter ./shared check; cd backend && pnpm typecheck; cd backend && pnpm lint; cd backend && pnpm format:check; cd backend && pnpm openapi:check; cd backend && pnpm pattern:check; cd backend && pnpm authz:check; cd backend && pnpm validators:check`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `_standards/architecture.md` §8, `_standards/backend.md` §7, `backend/adonisrc.ts` (suítes `unit` e `functional`), `shared/vitest.config.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| shared validator e response | unit | todo limite e recusa do spec | `shared/src/**/*.test.ts` | `pnpm --filter ./shared test:unit` |
| entidade | unit | toda transição e recusa | `backend/app/domain/**/*.unit.spec.ts` | `cd backend && node ace test unit` |
| use-case | unit | 1:1 com os ACs, com repository em memória | `backend/app/features/**/*.unit.spec.ts` | `cd backend && node ace test unit` |
| repository | e2e | contrato igual em Lucid e memória; filtros; queries travadas | `backend/app/repositories/**/*.e2e.spec.ts` | `cd backend && node ace test functional` |
| rota | e2e | matriz de `backend.md` §7 por tipo de ação | `backend/app/features/**/*.e2e.spec.ts` | `cd backend && node ace test functional` |
| comando | e2e | expurgo, `--dry-run`, duas execuções | `backend/commands/_*.command.e2e.spec.ts` | `cd backend && node ace test functional` |
| migration, model, factory | none | build gate | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | tarefa só com unitário | `pnpm --filter ./shared test:unit; cd backend && node ace test unit` |
| Full | tarefa com e2e | `cd backend && node ace test unit && node ace test functional` |
| Build | fim de fase | o `**Build**` acima e o Full |

---

## Execution Plan

### Phase 1: Contrato e dados

```
T1 → T2 → T3 → T4
```

### Phase 2: Rotas

```
T5 → T6 → T7 → T8
```

### Phase 3: Guarda e entrega

```
T9 → T10
```

---

## Task Breakdown

### T1: Validators e respostas do contato no shared

**What**: schemas Zod de criação e de listagem do contato e as respostas, com os testes de limite.
**Where**: `shared/src/validators/contacts/contacts.validator.ts`
**Depends on**: None
**Reuses**: `Rule`, `PageValidator`, `LOCALES`, `ResponseRule.paginated`
**Requirement**: CONTACT-01, CONTACT-02

**Done when**:

- [ ] `StorefrontContactCreateValidator`, `AdministratorContactPaginateValidator` e `ContactShowResponse` exportados pelo `index.ts`
- [ ] limites do spec (nome 1 a 120, e-mail 254, mensagem 10 a 5000, idioma) recusados e aceitos em teste
- [ ] Gate check passes: `pnpm --filter ./shared test:unit`

**Tests**: unit
**Gate**: quick

---

### T2: Migration, model e factory de contatos

**What**: tabela `contacts` com índices em `created_at` e `answered_at`, model Lucid e factory.
**Where**: `backend/database/migrations/1700000000100_create_contacts_table.ts`
**Depends on**: T1
**Reuses**: forma das migrations e factories do kit

**Done when**:

- [ ] `node ace migration:run` gera `database/schema.ts` com `ContactSchema`
- [ ] `app/models/contact.ts` e `database/factories/contact.factory.ts` compilam
- [ ] Gate check passes: build

**Tests**: none
**Gate**: build

---

### T3: Entidade Contact com a transição de resposta

**What**: `Contact.create`, `restore`, `answer(at)` com o fato `CONTACT_ALREADY_ANSWERED`.
**Where**: `backend/app/domain/contact/contact.entity.ts`
**Depends on**: T2
**Reuses**: `domain/storage/storage.entity.ts`

**Done when**:

- [ ] responder pendente grava o instante; responder respondido devolve o fato sem mudar nada
- [ ] Gate check passes: `cd backend && node ace test unit`

**Tests**: unit
**Gate**: quick

---

### T4: ContactRepository nas duas implementações

**What**: contrato, Lucid e memória com create, findById, paginate (status, busca, ordem), save condicional, delete e expurgo por data.
**Where**: `backend/app/repositories/contact/contact.repository.ts`
**Depends on**: T3
**Reuses**: `LucidMapping.page`, `MemoryRows`, `PageCriteria`, `QueryCount`

**Done when**:

- [ ] o mesmo spec de contrato passa nas duas implementações
- [ ] listagem com número de queries travado
- [ ] bind no `providers/repository.provider.ts`
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

---

### T5: POST /storefront/contacts

**What**: validator VineJS par do Zod, use-case com honeypot, controller, `contactThrottle` e rota pública.
**Where**: `backend/app/features/storefront/contacts/create/create.use-case.ts`
**Depends on**: T4
**Reuses**: `core/validator.ts`, `start/limiter.ts`

**Done when**:

- [ ] e2e: 201 e gravado; 422 por campo e nada gravado; honeypot 201 sem gravar; 429 no sexto; 403 de origem
- [ ] `validators:check` com o par novo
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

---

### T6: GET /administrator/contacts e GET :id

**What**: `ContactPolicy`, use-cases, controllers, presenter e rotas do painel com `auth` e `role`.
**Where**: `backend/app/features/administrator/contacts/paginate/paginate.use-case.ts`
**Depends on**: T5
**Reuses**: `session-scoped-policy.base.ts`, `ResponseRule.paginated`

**Done when**:

- [ ] e2e: página, filtros `pending` e `answered`, busca, detalhe, 404, 401 e 403 de papel `MEMBER`
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

---

### T7: POST /administrator/contacts/:id/answer

**What**: use-case e controller da resposta, com refusal do fato.
**Where**: `backend/app/features/administrator/contacts/answer/answer.use-case.ts`
**Depends on**: T6
**Reuses**: `_shared.refusal.base.ts`, `Clock`

**Done when**:

- [ ] e2e: 200 com `answeredAt`; 409 na segunda e `answered_at` igual; dois em paralelo dão um 200 e um 409
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

---

### T8: DELETE /administrator/contacts/:id

**What**: apagar de vez um contato, para pedido de exclusão da LGPD.
**Where**: `backend/app/features/administrator/contacts/delete/delete.use-case.ts`
**Depends on**: T7
**Requirement**: CONTACT-05
**Reuses**: forma do delete de storages

**Done when**:

- [ ] e2e: 204 e a linha some; 404; 401; 403
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

---

### T9: Comando contacts:prune

**What**: comando e use-case que apagam contato criado há mais de 12 meses, com `--dry-run`.
**Where**: `backend/commands/contacts-prune.command.ts`
**Depends on**: T8
**Reuses**: `commands/storages-prune.command.ts`, `Clock`

**Done when**:

- [ ] e2e: apaga o de 13 meses, mantém o de 11; `--dry-run` não apaga; duas execuções deixam o mesmo estado
- [ ] Gate check passes: `cd backend && node ace test unit && node ace test functional`

**Tests**: e2e
**Gate**: full

---

### T10: Contrato e documentos

**What**: `openapi.json`, baseline de autorização, tags e respostas, mensagens nos três idiomas e `docs/SECURITY.md` §8, `ENV.md`, `ARCHITECTURE.md`.
**Where**: `backend/openapi.json`
**Depends on**: T9
**Reuses**: `node ace openapi:generate`, `authz:check --write`

**Done when**:

- [ ] `openapi:check`, `authz:check` e o spec de mensagens verdes
- [ ] SECURITY §8 com finalidade, base legal, guarda de 12 meses e exclusão
- [ ] ARCHITECTURE §9.1 com a tarefa agendada do Coolify que roda `node ace contacts:prune`
- [ ] Gate check passes: build

**Tests**: none
**Gate**: build

**Commit**: `docs(contato): contrato, guarda e finalidade do dado`

---

## Checks

**C1** - Envio válido responde 201 e grava com `answered_at` nulo (CONTACT-01, AC 1)
Proof: `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --tests="a valid message is saved pending"`

**C2** - Campo inválido responde 422 com o campo e não grava (CONTACT-01, AC 2)
Proof: `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --tests="an invalid field answers 422 and saves nothing"`

**C3** - Honeypot preenchido responde 201 e não grava (CONTACT-01, AC 3)
Proof: `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --tests="a filled honeypot answers 201 and saves nothing"`

**C4** - Sexto envio do mesmo IP na hora responde 429 (CONTACT-01, AC 4)
Proof: `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --tests="the sixth message from the same address in an hour answers 429"`

**C5** - Origem fora da lista responde 403 e não grava (CONTACT-01, AC 5)
Proof: `cd backend && node ace test functional --files="app/features/storefront/contacts/create/create.e2e.spec.ts" --tests="a write from another origin answers 403 and saves nothing"`

**C6** - Listagem traz 20 por página, recente primeiro (CONTACT-02, AC 1)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec.ts" --tests="lists 20 per page from the newest"`

**C7** - Filtro pending traz só sem resposta (CONTACT-02, AC 2)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec.ts" --tests="status pending lists only unanswered"`

**C8** - Filtro answered traz só respondidos (CONTACT-02, AC 3)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec.ts" --tests="status answered lists only answered"`

**C9** - Busca casa nome ou e-mail sem caixa (CONTACT-02, AC 4)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec.ts" --tests="search matches name or email ignoring case"`

**C10** - Detalhe devolve o contato inteiro (CONTACT-02, AC 5)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/show/show.e2e.spec.ts" --tests="shows the whole contact"`

**C11** - Responder pendente grava `answered_at` e responde 200 (CONTACT-02, AC 6)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/answer/answer.e2e.spec.ts" --tests="answering a pending contact stamps answered_at"`

**C12** - Responder de novo responde 409 sem mudar `answered_at` (CONTACT-02, AC 7)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/answer/answer.e2e.spec.ts" --tests="answering twice answers 409 and keeps answered_at"`

**C13** - Id inexistente responde 404 CONTACT_NOT_FOUND (CONTACT-02, AC 8)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/show/show.e2e.spec.ts" --tests="an unknown id answers 404"`

**C14** - Sem sessão responde 401 (CONTACT-02, AC 9)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec.ts" --tests="without a session answers 401"`

**C15** - Papel fora do staff responde 403 (CONTACT-02, AC 10)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/paginate/paginate.e2e.spec.ts" --tests="a member answers 403"`

**C16** - Listagem com número de queries fixo (CONTACT-02, AC 11)
Proof: `cd backend && node ace test functional --files="app/repositories/contact/contact.repository.e2e.spec.ts" --tests="paginate runs a fixed number of queries"`

**C17** - Expurgo apaga o criado há mais de 12 meses (CONTACT-04, AC 1)
Proof: `cd backend && node ace test functional --files="commands/_contacts-prune.command.e2e.spec.ts" --tests="deletes contacts older than 12 months"`

**C18** - Expurgo mantém o de 12 meses ou menos (CONTACT-04, AC 2)
Proof: `cd backend && node ace test functional --files="commands/_contacts-prune.command.e2e.spec.ts" --tests="keeps contacts of 12 months or less"`

**C19** - `--dry-run` não apaga (CONTACT-04, AC 3)
Proof: `cd backend && node ace test functional --files="commands/_contacts-prune.command.e2e.spec.ts" --tests="dry run counts and deletes nothing"`

**C20** - Duas execuções deixam o mesmo estado (CONTACT-04, AC 4)
Proof: `cd backend && node ace test functional --files="commands/_contacts-prune.command.e2e.spec.ts" --tests="running twice leaves the same state"`

**C21** - Apagar responde 204 e a linha some (CONTACT-05, AC 1)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/delete/delete.e2e.spec.ts" --tests="deleting removes the contact for good"`

**C22** - Apagar id inexistente responde 404 (CONTACT-05, AC 2)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/delete/delete.e2e.spec.ts" --tests="deleting an unknown id answers 404"`

**C23** - Apagar sem sessão responde 401 (CONTACT-05, AC 3)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/delete/delete.e2e.spec.ts" --tests="deleting without a session answers 401"`

**C24** - Apagar com papel fora do staff responde 403 e não apaga (CONTACT-05, AC 4)
Proof: `cd backend && node ace test functional --files="app/features/administrator/contacts/delete/delete.e2e.spec.ts" --tests="a member cannot delete"`

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** batch worker 1 (T1-T10) at HEAD 0654281
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3
T4 → T5 (fim da fase 1 para o início da fase 2)
T8 → T9 (fim da fase 2 para o início da fase 3)
```

CONTACT-03 (aviso por e-mail) fica fora, decisão do dono.
