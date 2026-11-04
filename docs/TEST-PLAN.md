# Plano de testes

**Maiyu** · o que se testa, em que nível, com que critério

> Onde cada teste mora e o que cada camada leva: `_standards/architecture.md` §8; como se escreve:
> `_standards/domain.md` §10 e `_standards/backend.md` §7. Aqui fica só o que é deste projeto: os
> fluxos críticos, a matriz requisito × teste e o que conta como pronto.

## 1. Níveis

| Nível | Ferramenta | Onde | Roda em |
|---|---|---|---|
| Unitário do backend | Não se aplica: sem backend | | |
| E2E do backend | Não se aplica: sem backend | | |
| `shared/` | Não se aplica: sem `shared/` | | |
| Unitário do frontend | Vitest (`pnpm test`) | `frontend/src/**/*.test.ts` | todo PR (`ci.yml`) |
| Ciclo de chunk | `check-chunk-cycles.mjs` (`pnpm check-cycles`) | `frontend/scripts/` | depois do build |
| E2E do frontend | Não se aplica: ainda não há Playwright (pendente) | | |

## 2. Fluxos críticos

| Fluxo | Caminho feliz | Caminhos de erro | Teste |
|---|---|---|---|
| Home na ordem que defende | hero, trabalho no ar, convite final | seção fora de ordem | `routes/_public/composition.test.ts` |
| Vitrine acessível | `motion-reduce` presente, painel do celular com texto | `motion` importado, painel mudo | `routes/_public/vitrine-contract.test.ts` |
| Três idiomas | toda chave nos três | chave faltando, mensagem vazia, chave sem uso | `lib/messages.test.ts` |
| Idioma na URL | prefixo e `localized()` | idioma desconhecido | `lib/i18n.test.ts` |
| Contato e candidatura | campos válidos aceitos | mensagem curta, URL ruim, vaga fora da lista | `lib/validator.test.ts`, `lib/validator-messages.test.ts` |
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
| PRD-4 | A candidatura recusa vaga fora da lista | unitário | `validator.test.ts` |
| PRD-5 | O contato recusa mensagem com menos de dez caracteres | unitário | `validator.test.ts` |

### 3.1 Join de cobertura

| Conjunto | Membro | Teste |
|---|---|---|
| `ARTICLE_CATEGORIES` | `tech` | `blog-search.test.ts` |
| | `design` | `blog-search.test.ts` |
| | `marketing` | `blog-search.test.ts` |
| Idiomas | `pt-BR`, `en`, `es` | `messages.test.ts`, `i18n.test.ts` |
| Rotas de `_public` | `/`, `/portfolio`, `/blog`, `/career`, `/contact` | lacuna: sem teste de rota; entra com o E2E |

## 4. Toda rota de API cobre

Não se aplica: sem API.

## 5. Dados de teste

Não se aplica: sem banco. Os testes usam os registros de `lib/` e valores literais.

## 6. Critério de pronto

A definição de pronto da casa vale aqui sem cópia: `_standards/tooling.md` §10.1. Deste projeto:

- `pnpm lint`, `pnpm typecheck` e `pnpm test` verdes no `HEAD`, com as mensagens compiladas antes.
- `pnpm build` seguido de `pnpm check-cycles` quando mexer em rota ou em chunk.
- Cobertura: o join do §3.1 sem lacuna nova. Percentual mínimo: não exigido.

## 7. Teste manual antes do release

- [ ] Home, portfólio, diário, carreiras e contato nos três idiomas, em claro e escuro.
- [ ] Celular a 320 px sem rolagem horizontal.
- [ ] `/health` responde `ok` e `/sitemap.xml` abre.
- [ ] Troca de idioma preserva a rota.
