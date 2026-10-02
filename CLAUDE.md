# Maiyu

Site institucional da Maiyu: consultoria, tecnologia, desenvolvimento e design,
de Benjamin Constant, no Alto Solimões. Três idiomas (português, inglês e
espanhol), sem backend.

Um projeto só, `frontend/`, no mesmo padrão do `frontend/` de `academy`,
`simple-hub` e `adacaibs`: o próprio `package.json`, lockfile e Dockerfile.
**Não há workspace na raiz**, e é de propósito, como nos irmãos.

| Diretório   | O que é                                      |
| ----------- | -------------------------------------------- |
| `frontend/` | TanStack Start (React 19) sobre Vite e Nitro |

## A regra zero

**A referência é a régua, e o código dela vence a documentação sobre ela.**
Antes de escrever um arquivo, abra o equivalente em `../academy/frontend` (o
irmão mais próximo: também é vitrine pública da Maiyu) ou em
`../simple-hub/frontend` e leia inteiro.

Divergência deliberada vai para o JSDoc do arquivo, não só para o commit. As
que existem hoje, todas pelo mesmo par de motivos (o site fala três línguas e
não tem API):

- o paraglide é usado de verdade, com o idioma na URL (`src/server.ts`, o
  `rewrite` de `router.tsx`, `lib/i18n.ts`);
- não há `integrations/tanstack-query/http.ts`, `queries.ts` nem `mutations.ts`,
  e o conteúdo mora em `lib/` (`projects.ts`, `articles.ts`, `team.ts`, `jobs.ts`);
- não há `start.ts`: o dos irmãos existe para o escopo por requisição do
  cliente HTTP e para o CSRF das server functions, e aqui não há nenhum dos dois;
- os formulários confirmam na tela e não enviam nada, como o site anterior.

## Comandos

```bash
# raiz
pnpm dev:frontend     pnpm test:frontend     pnpm check:frontend  # lint + typecheck

# frontend
pnpm dev              # porta 3000
pnpm build            # regenera routeTree.gen.ts (commitado) e src/paraglide (não)
pnpm lint             pnpm typecheck         pnpm test
pnpm check            # prettier --check
pnpm check-cycles     # lê .output/, então roda depois do build
node scripts/generate-icons.mjs  # favicon.ico, apple-touch e ícones do manifesto
```

## Frontend

- **Rotas em par**: `rota.tsx` com `head`, `loader` e `validateSearch`;
  `rota.lazy.tsx` com a tela. `$.tsx` fica sem `.lazy`, como no academy.
- **`getRouteApi('/rota')` no escopo do módulo**, nunca importar o `Route` de
  volta do arquivo de rota: o ciclo de chunk devolve `undefined` no primeiro SSR,
  e `check-chunk-cycles.mjs` reprova.
- **Estado de listagem na URL**: o filtro do diário é `?category=`, validado à
  mão em `lib/blog-search.ts` (o `validateSearch` é síncrono, o VineJS não).
- **404 de negócio é `notFound()` no loader**, e a rota de detalhe declara o
  `notFoundComponent` próprio (`blog/$slug`).
- **Formulários**: react-hook-form + VineJS, `mode: 'onTouched'`, `Controller`
  e nunca `register`. Todo campo usa `{...invalidProps(fieldState.invalid, name)}`
  e `<FieldError id={errorId(name)}>`.
- **Idioma**: mensagem de interface em `messages/{locale}.json`, lida como
  `m.chave()` no render. Conteúdo de registro (título de artigo, resumo de
  projeto) mora no próprio registro como `LocalizedText`. Rótulo de valor
  fechado é função em `lib/labels.ts`, nunca string resolvida no módulo.
- **Animação é CSS**: `REVEAL` e `STAGGER` de `_public/-components/reveal.ts`,
  com `motion-reduce:` em tudo. O `motion` fica no `package.json` por paridade
  com o academy, e nada o importa.
- **`components/common/` mede o ancestral comum dos consumidores**, não o nível
  hierárquico. O critério está em `src/components/common/CLAUDE.md`.
- **`components/ui/` é território do shadcn**: nunca editar à mão.

## Estilo de código

Quatro regras cobradas pelo ESLint, iguais nos irmãos: `no-ternary`,
`no-explicit-any`, `consistent-type-assertions: never` (nada de `as`),
`consistent-type-definitions: type` (nunca `interface`). Combine tipos com
`Merge`, não com `&`. Prefira lookup object a cadeia de `if`. O resto está na
skill `code-pattern`.

Comentário explica **por quê**, não o quê, e de preferência com o defeito que
ele evita.

## Redes que cobram o que ninguém lembra

| Teste | O que reprova |
| --- | --- |
| `lib/messages.test.ts` | chave faltando num idioma, mensagem vazia, chave que nada usa |
| `lib/validator-messages.test.ts` | campo sem rótulo em algum idioma, regra sem mensagem, texto sem teto |
| `routes/_public/composition.test.ts` | a home fora da ordem que ela defende |
| `routes/_public/vitrine-contract.test.ts` | `motion-reduce` apagado, `motion` de volta, painel do celular mudo |
| `check-chunk-cycles.mjs` | ciclo de chunk que quebra o SSR |

## Produção

O que a plataforma faz e o repositório não:

- **A aplicação no Coolify é a imagem Nitro na porta 3000**, e não mais o nginx
  estático da porta 80 do site anterior.
- **O healthcheck no painel precisa apontar para `/health`.** O painel sobrepõe
  o `HEALTHCHECK` do `Dockerfile-production`, e em `/` ele mediria a renderização
  da home inteira.
- **Secrets do repositório**: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` e
  `COOLIFY_TOKEN`.

O deploy sai por `POST` no Coolify com `curl -fsS`, e o smoke test espera
`https://maiyu.com.br/revision.txt` responder o sha do commit. **Não volte para
`GET`**: a rota responde 405 desde a v4.2.

## Autoria e escrita

Regras que valem para todo commit, PR, documento e comentário de código deste
repositório, as mesmas do simple-hub.

**Autoria é sempre do dono do repositório**: `jhollyfer <jhollyfer.fr@gmail.com>`.
Nunca criar commit autorado por assistente, nunca acrescentar `Co-Authored-By`
de assistente, nunca assinar PR ou documento com rodapé de ferramenta.

Commits em Conventional Commits, **em português**, com escopo de domínio:
`feat(vitrine):`, `fix(idioma):`, `ci(frontend):`. O assunto diz o efeito, não o
arquivo. Sempre `git commit -- <pathspec>` explícito.

**Sem emoji** e **sem travessão** em texto versionado. Trocar travessão por
hífen não resolve: reescreva com vírgula, dois-pontos, ponto ou parênteses.
