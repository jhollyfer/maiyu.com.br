# Conta do dono Specification

**Approved**: 2026-11-11 - user: "o dono APROVOU o R2.10 como recomendado" (via regente; respostas 1 a 7 como recomendado, T8 entra, aviso por e-mail fora)

## Problem Statement

O dono entra com a senha do seeder e não tem como trocá-la nem trocar o e-mail sem mexer no banco. A
régua manda que trocar senha, e-mail, papel ou status derrube as sessões da conta na mesma unidade de
trabalho (`backend.md` §4.10), e o roteiro validado pede prova de 200 seguido de 401.

## Goals

- [ ] O dono troca a própria senha e o próprio e-mail pela API.
- [ ] Depois da troca, nenhuma sessão antiga da conta vale.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Recuperação de senha por e-mail | não pedida; o kit ainda não traz `passwords/` |
| Gestão de outras contas | o site tem uma conta só |
| Tela da conta no frontend | frente F |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Rotas | `GET /account/profile` e `PUT /account/profile` | rota em inglês (#383), módulo `account`, recurso `profile` como no adacaibs | y |
| Prova de identidade | toda troca de senha ou e-mail exige `currentPassword` | a sessão prova o cookie, não a pessoa | y |
| Política da senha nova | a regra de senha do `Rule` do shared (a mesma do kit) | uma regra só nos dois lados | y |
| Sessão depois da troca | todas as sessões da conta caem, inclusive a da requisição; a resposta 200 limpa os cookies e o dono entra de novo | o roteiro exige 200 seguido de 401 | y |
| E-mail em uso | 409 `EMAIL_IN_USE` | o dono já está autenticado: não há enumeração de conta | y |
| Limite | limiter por usuário na troca de conta (`backend.md` §4.10), 5 por 15 minutos | rota sensível | y |

**Open questions:** none - resolved by the owner on 2026-11-11 (respostas 5 e 6: senha atual exigida também para o e-mail; a sessão atual cai).

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

**Independent Test**: entrar, trocar a senha (200), repetir o `GET` com o cookie antigo (401), entrar com a senha nova (204).

---

### P1: Trocar o e-mail ⭐ MVP

**User Story**: As a dono, I want trocar o e-mail da conta so that o acesso siga o endereço que eu uso.

**Why P1**: o e-mail do seeder pode não ser o definitivo.

**Acceptance Criteria**:

1. WHEN o dono envia `PUT /account/profile` com `currentPassword` certa e `email` novo THEN the system SHALL gravar o e-mail e responder 200 com o perfil  <!-- event-driven -->
2. WHEN a troca de e-mail responde 200 THEN the system SHALL apagar todos os tokens de sessão da conta na mesma transação  <!-- event-driven -->
3. IF o e-mail já é de outra conta THEN the system SHALL responder 409 `EMAIL_IN_USE` e não mudar nada  <!-- unwanted -->
4. WHEN o `email` enviado é igual ao atual THEN the system SHALL responder 200 sem derrubar as sessões  <!-- event-driven -->

**Independent Test**: trocar o e-mail (200), cookie antigo em `GET` (401), entrar com o e-mail novo (204).

---

### P2: Ver o perfil

**User Story**: As a dono, I want ver nome, e-mail e papel da conta so that a tela da conta mostre o que vou trocar.

**Why P2**: o frontend precisa ler antes de editar.

**Acceptance Criteria**:

1. WHEN o dono chama `GET /account/profile` com sessão THEN the system SHALL responder 200 com id, nome, e-mail e papel, sem senha nem hash  <!-- event-driven -->
2. IF não há sessão THEN the system SHALL responder 401  <!-- unwanted -->

---

## Edge Cases

- IF o corpo não traz `email` nem `password` THEN the system SHALL responder 422
- IF a mesma conta troca a senha duas vezes em paralelo THEN the system SHALL aplicar as duas em sequência e deixar zero sessões antigas válidas
- IF passa de 5 trocas em 15 minutos THEN the system SHALL responder 429

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ACCOUNT-01 | P1: Trocar a senha | Design | Pending |
| ACCOUNT-02 | P1: Trocar o e-mail | Design | Pending |
| ACCOUNT-03 | P2: Ver o perfil | Design | Pending |

**Coverage:** 3 total, 3 mapped to tasks

---

## Sources

- Mensagem da regente de 2026-11-11 (R2.10 aprovado pelo dono) - escopo da conta
- `_standards/backend.md` §4.10 - sessão morre no servidor em troca de senha, e-mail ou papel
- `CANONICAS.md` §C - troca de senha com revogação, referência adacaibs

---

## Success Criteria

- [ ] Funcional prova 200 seguido de 401 para senha e para e-mail
