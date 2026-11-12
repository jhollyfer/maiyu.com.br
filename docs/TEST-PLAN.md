# Plano de testes

**Maiyu** · o que se testa, em que nível, com que critério

> Onde cada teste mora e o que cada camada leva: `_standards/architecture.md` §8; como se escreve:
> `_standards/domain.md` §10 e `_standards/backend.md` §7. Aqui fica só o que é deste projeto: os
> fluxos críticos, a matriz requisito × teste e o que conta como pronto.

## 1. Níveis

| Nível | Ferramenta | Onde | Roda em |
|---|---|---|---|
| Unitário do backend | Japa (`pnpm --filter ./backend test:unit`) | `backend/app/**/*.unit.spec.ts` | hook local e sessão do agente antes do PR |
| E2E do backend | Japa, suíte `functional` (`test:e2e`), contra o banco `maiyu_test` e o bucket de teste | `backend/app/**/*.e2e.spec.ts` | sessão do agente, uma vez, antes do PR |
| `shared/` | Vitest (`test:unit`) | `shared/src/**/*.test.ts` | hook local |
| Unitário do frontend | Vitest (`pnpm test:unit`) | `frontend/src/**/*.test.ts` | hook local |
| Ciclo de chunk | `check-chunk-cycles.mjs` (`pnpm check-cycles`) | `frontend/scripts/` | depois do build |
| E2E do frontend | Playwright com axe (`frontend/e2e/`), as páginas públicas nos três idiomas | `frontend/e2e/*.spec.ts` | sessão do agente, antes do PR |

## 2. Fluxos críticos

| Fluxo | Caminho feliz | Caminhos de erro | Teste |
|---|---|---|---|
| Home na ordem que defende | hero, trabalho no ar, convite final | seção fora de ordem | `routes/_public/composition.test.ts` |
| Vitrine acessível | `motion-reduce` presente, painel do celular com texto | `motion` importado, painel mudo | `routes/_public/vitrine-contract.test.ts` |
| Três idiomas | toda chave nos três | chave faltando, mensagem vazia, chave sem uso | `lib/messages.test.ts` |
| Idioma na URL | prefixo e `localized()` | idioma desconhecido | `lib/i18n.test.ts` |
| Contato e carreiras sem formulário | aviso e canais (e-mail, WhatsApp) nas três línguas | campo, botão de envio ou texto de "enviado" na página | `routes/_public/-components/channels-notice.test.tsx` |
| Filtro do diário | `?category=` válido | valor fora da lista cai para "tudo" | `lib/blog-search.test.ts` |
| SEO | JSON-LD com `areaServed`, sitemap bem formado | escape de XML | `lib/structured-data.test.ts`, `lib/sitemap.test.ts` |

## 3. Matriz requisito × teste

Os requisitos do `PRD.md` §4 ainda não têm id EARS; a linha usa o número da funcionalidade.

| Requisito | Critério | Nível | Teste |
|---|---|---|---|
| PRD-1 | A home abre pelo hero e fecha pelo convite | unitário | `composition.test.ts` |
| PRD-6 | Toda chave de mensagem existe em pt-BR, en e es | unitário | `messages.test.ts` |
| PRD-7 | O JSON-LD lista Brasil, Peru e Colômbia em `areaServed` | unitário | `structured-data.test.ts` |
| PRD-7 | O sitemap escapa os cinco caracteres do XML | unitário | `sitemap.test.ts` |
| PRD-4 | A página de carreiras não tem formulário e leva aos canais | unitário | `channels-notice.test.tsx` |
| PRD-5 | A página de contato mostra o aviso e os canais, sem formulário | unitário | `channels-notice.test.tsx` |

### 3.1 Join de cobertura

| Conjunto | Membro | Teste |
|---|---|---|
| `ARTICLE_CATEGORIES` | `tech` | `blog-search.test.ts` |
| | `design` | `blog-search.test.ts` |
| | `marketing` | `blog-search.test.ts` |
| Idiomas | `pt-BR`, `en`, `es` | `messages.test.ts`, `i18n.test.ts` |
| Rotas de `_public` | `/`, `/portfolio`, `/blog`, `/career`, `/contact` | lacuna: sem teste de rota; entra com o E2E |

## 4. Toda rota de API cobre

O que a régua pede de toda rota da API (`_standards/backend.md` §7) vale para as do kit: `authentication/sessions`, `storages/files` e `documentation`. O site não expõe rota de dados.

## 5. Dados de teste

Frontend: os registros de `lib/` e valores literais. Backend: banco `maiyu_test` e bucket `maiyu-test` locais, com os fixtures de `backend/tests/` (`ENV.md` §4).

## 6. Critério de pronto

A definição de pronto da casa vale aqui sem cópia: `_standards/tooling.md` §10.1. Deste projeto:

- `pnpm lint`, `pnpm typecheck` e `pnpm test` verdes no `HEAD`, com as mensagens compiladas antes.
- `pnpm build` seguido de `pnpm check-cycles` quando mexer em rota ou em chunk.
- Cobertura: o join do §3.1 sem lacuna nova. Percentual mínimo: não exigido.

## 7. Teste manual antes do release

- [ ] Home, portfólio, diário, carreiras e contato nos três idiomas, em claro e escuro.
- [ ] Celular a 320 px sem rolagem horizontal.
- [ ] `/health-check` responde `{"status":"ok"}` e `/sitemap.xml` abre.
- [ ] Troca de idioma preserva a rota.
