# Conta do dono Specification

**Approved**: 2026-11-11 - user: "o dono APROVOU o R2.10 como recomendado" (via regente; respostas 1 a 7 como recomendado, T8 entra, aviso por e-mail fora)

## Problem Statement

O dono entra com a senha do seeder e não tem como trocá-la nem mudar o próprio nome sem mexer no
banco. A régua manda que trocar senha, e-mail, papel ou status derrube as sessões da conta na mesma
unidade de trabalho (`backend.md` §4.10), e o roteiro validado pede prova de 200 seguido de 401.

## Goals

- [ ] O dono troca a própria senha e o próprio nome pela API.
- [ ] Depois da troca de senha, nenhuma sessão antiga da conta vale.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Troca de e-mail da conta | Bloqueada: e-mail fora desta entrega (decisão do dono); volta com o bloco de e-mail e o link de confirmação (`backend.md` §7 item 7) |
| Recuperação de senha por e-mail | não pedida; o kit ainda não traz `passwords/` |
| Gestão de outras contas | o site tem uma conta só |
| Tela da conta no frontend | frente F |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Rotas | `GET /account/profile` e `PUT /account/profile` | rota em inglês (#383), módulo `account`, recurso `profile` como no adacaibs | y |
| Prova de identidade | toda troca de senha ou de nome exige `currentPassword` | a sessão prova o cookie, não a pessoa | y |
| Política da senha nova | a regra de senha do `Rule` do shared (a mesma do kit) | uma regra só nos dois lados | y |
| Sessão depois da troca | a troca de senha derruba todas as sessões da conta, inclusive a da requisição; a resposta 200 limpa os cookies e o dono entra de novo. A troca só do nome não derruba sessão nem limpa cookie | o roteiro exige 200 seguido de 401 para a senha; o nome não é credencial | y |
| Corpo do PUT | `name` (1 a 120) e `password`, pelo menos um; o corpo não traz `email` | alinhamento ao irmão adacaibs (regente, 2026-11-11); sem e-mail nesta entrega não há o link de confirmação da `backend.md` §7 item 7 | y |
| Senha igual à atual | 422 `PASSWORD_SAME_AS_CURRENT` no campo `password` | alinhamento ao irmão adacaibs: igual não muda nada e derrubaria as sessões à toa | y |
| Limite | `accountThrottle` do kit (`start/limiter.base.ts`): 10 por 15 minutos por usuário, com bloqueio de 15 minutos (`backend.md` §4.10) | rota sensível; decisão da regente em 2026-11-11: vale o do kit, sem política própria | y |

**Open questions:** none - resolved by the owner on 2026-11-11 (resposta 5: senha atual exigida; resposta 6: a sessão atual cai na troca de senha; troca de e-mail fora desta entrega por decisão do dono).

---

## User Stories

### P1: Trocar a senha ⭐ MVP

**User Story**: As a dono, I want trocar minha senha so that a senha do seeder deixe de valer.

**Why P1**: a senha inicial veio do ambiente de deploy.

**Acceptance Criteria**:

1. WHEN o dono envia `PUT /account/profile` com `currentPassword` certa e `password` nova válida THEN the system SHALL gravar o hash Argon2 da senha nova e responder 200 com o perfil  <!-- event-driven -->
2. WHEN a troca de senha responde 200 THEN the system SHALL apagar todos os tokens de sessão da conta na mesma transação do save  <!-- event-driven -->
3. WHEN o cookie de antes da troca é usado em `GET /account/profile` THEN the system SHALL responder 401  <!-- event-driven -->
4. IF `currentPassword` está errada THEN the system SHALL responder 422 no campo `currentPassword` e não mudar nada  <!-- unwanted -->
5. IF a senha nova não cumpre a regra THEN the system SHALL responder 422 no campo `password`  <!-- unwanted -->
6. IF o save falha THEN the system SHALL manter a senha antiga e as sessões  <!-- unwanted -->
7. IF a senha nova é igual à atual THEN the system SHALL responder 422 `PASSWORD_SAME_AS_CURRENT` no campo `password` e não mudar nada nem derrubar sessão  <!-- unwanted -->

**Independent Test**: entrar, trocar a senha (200), repetir o `GET` com o cookie antigo (401), entrar com a senha nova (204).

---

### P1: Trocar o nome ⭐ MVP

**User Story**: As a dono, I want trocar o nome da conta so that a tela da conta e o painel mostrem como me chamo.

**Why P1**: o nome do seeder é provisório, e o irmão adacaibs edita o nome pela mesma rota.

**Acceptance Criteria**:

1. WHEN o dono envia `PUT /account/profile` com `currentPassword` certa e `name` novo THEN the system SHALL gravar o nome e responder 200 com o perfil  <!-- event-driven -->
2. WHEN a troca só do nome responde 200 THEN the system SHALL manter as sessões da conta e não limpar os cookies  <!-- event-driven -->
3. IF `currentPassword` está errada na troca de nome THEN the system SHALL responder 422 no campo `currentPassword` e não mudar nada  <!-- unwanted -->

**Independent Test**: trocar o nome (200, sem `Set-Cookie` de sessão), repetir o `GET` com o cookie antigo (200 com o nome novo).

---

### Bloqueada: Trocar o e-mail (ACCOUNT-02)

Bloqueada: e-mail fora desta entrega (decisão do dono); volta com o bloco de e-mail e o link de
confirmação. A `backend.md` §7 item 7 manda que o e-mail novo só valha depois de confirmado por
link, com aviso ao endereço antigo, e a entrega não tem o bloco de e-mail. Sem critério nem check
até lá; o `PUT /account/profile` não aceita `email`.

---

### P2: Ver o perfil

**User Story**: As a dono, I want ver nome, e-mail e papel da conta so that a tela da conta mostre o que vou trocar.

**Why P2**: o frontend precisa ler antes de editar.

**Acceptance Criteria**:

1. WHEN o dono chama `GET /account/profile` com sessão THEN the system SHALL responder 200 com id, nome, e-mail e papel, sem senha nem hash  <!-- event-driven -->
2. IF não há sessão THEN the system SHALL responder 401  <!-- unwanted -->

---

## Edge Cases

- IF o corpo não traz `name` nem `password` THEN the system SHALL responder 422
- IF a mesma conta troca a senha duas vezes em paralelo THEN the system SHALL aplicar as duas em sequência e deixar zero sessões antigas válidas
- IF passa de 10 trocas em 15 minutos THEN the system SHALL responder 429

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ACCOUNT-01 | P1: Trocar a senha | Design | Pending |
| ACCOUNT-02 | Bloqueada: Trocar o e-mail | - | Bloqueada: e-mail fora desta entrega (decisão do dono) |
| ACCOUNT-04 | P1: Trocar o nome | Design | Pending |
| ACCOUNT-03 | P2: Ver o perfil | Design | Pending |

**Coverage:** 3 total, 3 mapped to tasks (ACCOUNT-02 bloqueada, fora da entrega)

---

## Sources

- Mensagem da regente de 2026-11-11 (R2.10 aprovado pelo dono) - escopo da conta
- `_standards/backend.md` §4.10 - sessão morre no servidor em troca de senha, e-mail ou papel
- Mensagem da regente de 2026-11-11 - e-mail fora do `PUT`, `name` dentro, alinhamento ao adacaibs
- `CANONICAS.md` §C - troca de senha com revogação, referência adacaibs

---

## Success Criteria

- [ ] Funcional prova 200 seguido de 401 para a senha, e 200 sem derrubar sessão para o nome
