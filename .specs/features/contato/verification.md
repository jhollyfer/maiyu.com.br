# Contato verification

**Verdict**: FAIL
**Mutations**: 3 - probed C17 (guarda de 12 meses), C24 (policy do papel), edge case de dois `answer` juntos
**Proofs**: `proofs.md` at 2af11bb (HEAD 7d400b4 só acrescenta `.specs/`)
**Verifier**: independent sub-agent (author != verifier)

## Mutações

| Mutação | Prova | Morta |
| --- | --- | --- |
| `CONTACT_RETENTION_MONTHS = 12` -> `13` | C17 | sim |
| `ContactPolicy.manage` deixa o MEMBER passar | C24 | não |
| `claimAnswer` sem `whereNull('answeredAt')` | teste "two answers at once give one 200 and one 409" | sim (pela C12 sobrevive: a entidade barra o caso sequencial) |

Fora da conta das três, sondada à parte: o VineJS do `message` de `10..5000` para `1..50000` sobrevive à C2.

## Exemplos próprios (em HEAD, descartados)

Passaram: `website: ""` e `website: null` gravam (201, uma linha); `?search=%` casa só o nome com `%` literal;
`?search=bia&status=answered` não traz o pendente com o mesmo nome; `?search=` vazio lista todos.

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| A regra "só staff" mora em dois lugares, e a segunda nunca é alcançada pela rota | mutação da policy não morta na C24; `backend/app/policies/contact.policy.ts:21` repete o `middleware.role(STAFF_USER_ROLES)` de `backend/start/routes.ts:148`, que responde 403 antes; `backend.md` §4.6 ("cada regra mora numa só"; policy só quando a regra é mais que posse) e CANONICAS §A.7; o irmão `adacaibs/backend/app/features/administrator/contacts` não tem policy nem leitura no controller | tirar `ContactPolicy`, o spec dela e o `findById` + `bouncer` de `show`, `answer` e `delete` `.controller.ts` (o 404 fica no use case, como no adacaibs); trocar a mutação 2 por uma no `role()` do grupo, provada pela C24 | |
| O edge case "dois `answer` juntos" não tem check | `spec.md`, Edge Cases; o teste existe em `answer.e2e.spec.ts` ("two answers at once give one 200 and one 409") e é o único que mata a mutação 3 | acrescentar a check C25 com esse teste como prova | |
| C2 não segura os limites do validator do backend: o teto e o piso de `message` (e o teto de `email`) só são provados no Zod do `shared/`, que é outro schema | `backend/app/features/storefront/contacts/create/create.e2e.spec.ts:47`; mutação `minLength(10).maxLength(5000)` -> `minLength(1).maxLength(50000)` em `backend/app/validators/storefront/contacts.validator.ts:18` não morta | provar no backend `message` com 9 e 5001 caracteres e `email` com 255 (spec unitário do validator VineJS ou e2e próprio, fora do teto de 5 por hora) | |
