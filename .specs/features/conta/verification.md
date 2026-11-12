# Conta verification

**Verdict**: FAIL
**Mutations**: 3 - probed C2 (unidade de trabalho no use case), C4 (senha atual na troca de e-mail), C10 (e-mail igual e cookies)
**Proofs**: `proofs.md` at 1245da1 (HEAD ca96937 só muda `.specs/`)
**Verifier**: independent sub-agent (author != verifier)

## Mutations injected

Rodadas com `mutate.py` na árvore real; os três arquivos voltaram byte a byte.

| Mutation | Location | Killed |
| --- | --- | --- |
| save + revokeAll fora da unidade de trabalho no use case | `backend/app/features/account/profile/update/update.use-case.ts:81` | no |
| troca de e-mail sem conferir o hash de currentPassword | `backend/app/features/account/profile/update/update.use-case.ts:72` | no |
| 200 limpa os cookies mesmo com o e-mail igual | `backend/app/features/account/profile/update/update.controller.ts:39` | no |

## Own examples

Rodados em HEAD como teste descartável (`node ace test functional`), apagado depois.

- E-mail atual em caixa alta (`DONO@...` para `dono@...`): 200, grava o e-mail em caixa alta, derruba as sessões, e entrar com o e-mail de antes passa a responder 401.
- Senha nova igual à atual: 200, regrava o hash e derruba as sessões; o adacaibs recusa com `PASSWORD_SAME_AS_CURRENT`.
- Troca de e-mail com `currentPassword` errada: 422 em HEAD (correto), mas nenhum teste cobre (mutação 2 viva).

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C2 (ACCOUNT-01 AC 2, ACCOUNT-02 AC 2) não está provado no caminho real: o use case pode chamar `save` fora da `UnitOfWork` e tudo fica verde | mutação 1 viva; a prova de C2 (`user.repository.e2e.spec.ts:99`) e o teste de transação (`:188`) embrulham o `unitOfWork.run` no próprio teste, nunca pelo use case | no `update.unit.spec.ts`, um `UnitOfWork` de teste que registra a chamada e afirma que o `save` correu dentro dele (ou uma falha do `revokeAll` depois da linha gravada, pelo use case, mantendo a senha antiga) | dfa60b0 (C13, unitário da unidade de trabalho) |
| A troca de e-mail com senha atual errada não tem teste: o `hash.verify` pode ser pulado para o e-mail e nada reprova (`backend.md` §7 item 7, assumption "toda troca exige currentPassword") | mutação 2 viva; C4 (`update.e2e.spec.ts:97`) e o unit (`update.unit.spec.ts:113`) só trocam a senha; o unit de `:137` só cobre `currentPassword` ausente | caso e2e e unit com `{ email, currentPassword: 'Errada@123' }` afirmando 422 em `currentPassword`, e-mail intacto e sessão viva | 2ed7beb (troca de e-mail fora da entrega, regente; mutação 2 reapontada ao nome, C9) |
| ACCOUNT-02 AC 4 vale só para o banco: com o `if` do controller apagado, o 200 do e-mail igual limpa os cookies (o navegador sai) e C10 segue verde | mutação 3 viva; `update.e2e.spec.ts:186` reenvia o cookie original no `GET`, sem ler o `Set-Cookie` da resposta | em C10, afirmar que a resposta 200 não traz `Set-Cookie` vazio para `SESSION_TOKEN.ACCESS` e `SESSION_TOKEN.REFRESH` | 2ed7beb (C8: troca só do nome sem Set-Cookie e cookie antigo vivo; mutação 3 reapontada) |
| E-mail igual ao atual com outra caixa conta como troca: grava a caixa nova, derruba as sessões e tranca o login pelo endereço de antes (ACCOUNT-02 AC 4) | exemplo próprio acima; `Rule.email()` (`backend/app/core/validator.ts:157`) só faz `trim`, e `User.update` (`user.entity.ts:77`) compara com `!==` | normalizar o e-mail (minúsculas) no `Rule.email()` do kit e do shared, pelo upstream, com critério novo no spec e teste do caso | 3f62ca5 (sync do upstream a8462c8: Rule.email baixa a caixa nos dois lados) |
| Desvio da régua sem registro: `backend.md` §7 item 7 manda que e-mail novo só valha depois de confirmado por link, com aviso ao antigo; o spec e o `ARCHITECTURE.md` dizem "fora, por decisão do dono" e não há linha em `docs/DECISIONS.md` | `docs/DECISIONS.md` sem entrada; `AGENTS.md` ("Divergência deliberada vai para o JSDoc e para `docs/DECISIONS.md`", e projeto segue a régua sem exceção local) | levar ao dono: implementar a confirmação por link e o aviso, ou mudar a regra no upstream; até lá, entrada em `docs/DECISIONS.md` | 2ed7beb (troca de e-mail fora da entrega, regente; ACCOUNT-02 bloqueada no spec) |
| Desvio (a): `accountUpdateThrottle` duplica o `accountThrottle` do kit, feito para esta mesma rota (`PUT /account`, por usuário, `blockFor` 15 min), mudando só o teto de 10 para 5 | `backend/start/limiter.ts:41` contra `backend/start/limiter.base.ts:121`; "zero duplicidade" e "regra que não serve muda no upstream" (`AGENTS.md`); sem entrada em `docs/DECISIONS.md` | usar `accountThrottle` do `limiter.base.ts` na rota; se o dono mantém 5, levar o teto (ou um parâmetro) ao kit no upstream, com o teste da borda de 429 ajustado | 3c6f649 (accountThrottle do kit, 10 por 15 minutos) |
| Desvio (b), parte aceita e parte não: `passwordConfirmation` está certo (vem do `.confirmed` do `Rule.password()` do kit, igual ao adacaibs); a ausência de `name` diverge do irmão (`adacaibs/backend/app/validators/account/profile.validator.ts`, que edita `name`) e a senha igual à atual é aceita onde o irmão responde `PASSWORD_SAME_AS_CURRENT` | exemplo próprio acima; nenhum dos dois está no spec nem em `docs/DECISIONS.md` | alinhar ao adacaibs (aceitar `name` e recusar senha igual, com critério e teste) ou registrar a divergência em `docs/DECISIONS.md` com o motivo | 2ed7beb (name entra no PUT) e 940a25f (PASSWORD_SAME_AS_CURRENT) |
