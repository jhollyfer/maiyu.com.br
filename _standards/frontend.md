# Padrão de frontend

Base comum para todo frontend React 19 + TanStack Start/Router/Query/Table + React Hook Form +
Zod + shadcn (Base UI) + Tailwind v4. Entidades de exemplo são sempre `User`, `Team`, `Post`,
nunca um domínio real.

Autoridade igual à do backend: `_doc-lib/<lib>.md` (a entrada e a página oficial do link,
`DECISIONS.md` #114) > tipo instalado > este documento > código existente. Quando nem a doc nem o
tipo cobrem o ponto, declare "não coberto" e decida pelo critério daqui. Regra que depende de
página oficial que não foi aberta sai marcada **(página oficial não conferida)**.

Este arquivo diz **como** cada pasta trabalha. **Onde** cada pasta e cada arquivo moram está na
árvore fechada de `architecture.md` §4; o que vem de `@<projeto>/shared` (validators, mensagens,
enums, value objects, tipos de request e response) está em `architecture.md` §9 e §10. Idioma de
código e de texto: `typescript.md` §12. Texto que o usuário vê sai sempre de chave de mensagem
(`m.*()`, `i18n.md`), inclusive nos exemplos daqui.

---

## 1. Rotas e pastas

### 1.1 O que cada pasta guarda

| Pasta | Regra |
|---|---|
| `routes/_public/` | vitrine: SSR completo, indexável (§9.2, §9.7) |
| `routes/_authentication/` | login, cadastro, recuperação; `layout.tsx` é o guard inverso (sessão válida sai para o painel); `noindex` |
| `routes/_private/layout.tsx` | portão único de sessão (§1.3); declara `ssr` (§9.2) e `noindex` |
| `routes/_private/<área>/layout.tsx` | guard de capacidade da área (§3.4) |
| `routes/_private/<área>/<recurso>/` | molde de recurso (§1.2); `<recurso>/layout.tsx` só quando não há área e o papel muda por recurso (lowcodejs, `DECISIONS.md` #356) |
| `routes/_setup/` | grupo de instalação (lowcodejs), opcional |
| `routes/**/-components/` | a tela e as peças dela; ignorada pelo gerador (prefixo `-`) |
| `routes/**/-<nome>.ts` | módulo privado da rota, testável sem a árvore gerada: `-search.ts`, `-redirect.ts`, `-use-<nome>.ts` (hook de uma rota só) |
| `components/ui/` | shadcn (Base UI), editável só como diz §6 |
| `components/common/<peça>/` | kit de negócio (§8), uma pasta por peça, compound (§6.1) |
| `hooks/` | `use-<nome>.ts`, hook usado por 2+ rotas; nunca `.tsx` |
| `hooks/tanstack-query/_query-keys.ts` | a fábrica única de chaves (§2.1) |
| `integrations/tanstack-query/` | cliente HTTP, `queryOptions` e hooks de mutation por módulo, invalidação (§2, §3) |
| `integrations/react-hook-form/app-field.tsx` | binding único de campo (§4) |
| `lib/<tema>.ts` | lógica pura sem casa de domínio, sempre com `<tema>.test.ts` ao lado |

Fora da árvore (desvio): `src/validators/`, `lib/validator.ts`, `lib/entity.ts`,
`lib/interfaces.ts`, `lib/utils.ts`, `lib/utils/`, `lib/constants/`, `stores/`, `locales/`,
componente de negócio dentro de `ui/`, hook fora de `hooks/` ou da rota. Validator, enum e tipo de
resposta vêm de `@<projeto>/shared`; o frontend nunca importa `@vinejs/vine` (nem em projeto
Adonis) e só importa `zod` nos schemas locais que o `shared/` não cobre, nunca para redeclarar
validator (`architecture.md` §6; `tooling.md` §0.1).

`-components/` é ignorado pelo gerador de rotas pelo prefixo `-`; arquivo posto direto em
`routes/<área>/` sem esse prefixo vira rota fantasma. _doc-lib/tanstack-router.md#routing/routing-concepts.

Peça de rota que passa de ~5 arquivos ganha pasta `-components/<peça>/`, sem `index.ts`: quem usa
importa o arquivo da parte direto (§6.1). Import lateral entre rotas (`-components/` de uma rota importado por
outra) é desvio: a peça sobe para `common/` *(opinião da casa)*.

**O que sobe para `components/common/` é decidido por rota alcançada, não por arquivo que
importa** *(opinião da casa)*: a peça sobe quando serve duas ou mais **rotas** com a **mesma
intenção**. Duas telas da mesma rota que importam o mesmo arquivo não é reuso; dois botões
parecidos com propósito diferente ficam separados.

### 1.2 Molde de recurso do painel

```
<recurso>/
├── index.tsx  index.lazy.tsx         # lista
├── new.tsx  new.lazy.tsx             # new.tsx só quando há loader; ver abaixo
├── $id/index.tsx  $id/index.lazy.tsx # detalhe
├── $id/edit.tsx   $id/edit.lazy.tsx  # edição
├── -search.ts
└── -components/{table,columns,filters,row-actions,bulk-actions,detail,
                 form-fields,form-create,form-edit}.tsx
```

**Título do painel vem do breadcrumb** do `_private/layout.tsx`, não de `head` por rota; `head` por
rota fica em `_public/` e `_authentication/`, que precisam do título no HTML do servidor (§9.7). Por
isso `new.tsx` só existe quando a tela tem loader (`DECISIONS.md` #356, revisa a #257): o
`createLazyFileRoute` só aceita `component`, `errorComponent`, `pendingComponent` e
`notFoundComponent` (_doc-lib/tanstack-router.md#guide/code-splitting,
https://raw.githubusercontent.com/tanstack/router/main/docs/router/guide/code-splitting.md, aberta em
2026-10-31), e o que não é componente fica no arquivo crítico; a regra do §1.3 (configuração no
`index.tsx`, UI no `.lazy.tsx`) vale igual.

Detalhe e edição são URLs separadas (`$id` e `$id/edit`), nunca a mesma rota com `?mode=edit`:
cada uma tem `head`, guard e `pendingComponent` próprios (`DECISIONS.md` #113, C8).
_doc-lib/tanstack-router.md#routing/route-trees.

### 1.3 Rota é só rota

`index.tsx` declara a configuração: `validateSearch` (importado de `-search.ts`), `loaderDeps`,
`loader`, `pendingComponent`, `notFoundComponent`, `head`. `index.lazy.tsx` só exporta
`component`, um stub que renderiza a tela de `-components/`. A tela lê a rota por
`getRouteApi('<id>')` no escopo do módulo, nunca importando `Route` do arquivo da rota e nunca
por prop drilling.

**Por quê** (reescrito): com `autoCodeSplitting` ligado o plugin já separa componente e loader em
chunks, e a divisão manual "quase sempre é desnecessária"
(_doc-lib/tanstack-router.md#guide/automatic-code-splitting, #guide/code-splitting). O par
`index.tsx`/`index.lazy.tsx` deixa de ser o mecanismo do chunk e fica como **convenção de forma**
*(opinião da casa)*: o arquivo de configuração cabe numa tela, e a UI desce para `-components/`.
O `getRouteApi()` continua obrigatório por outro motivo: importar `Route` cria aresta estática
entre chunks, e ciclo de chunk derruba o SSR em runtime com o build verde (§9.10).

`_private/layout.tsx` é o único portão: o `beforeLoad` roda o guard e enche o cache da sessão com
`context.queryClient.query()` (`ensureQueryData` está deprecated desde o TanStack Query 5.102,
_doc-lib/tanstack-query.md#guides/query-options). Toda rota nascida ali herda a proteção por
estar no lugar, não por lembrar de repetir o guard. Redireciona para o login só em 401/403, com
`?redirect=` validado (§3.5); o guard de área redireciona o papel errado ao painel do papel, e a tela
de permissão (`AccessDenied`) fica só para o 403 da API dentro de uma tela (§5, `DECISIONS.md` #333); 5xx sobe ao `defaultErrorComponent`, nunca vira "deslogado".
_doc-lib/tanstack-router.md#guide/authenticated-routes.

### 1.4 Router e navegação

```ts
// src/router.tsx
export function getRouter() {
  const { queryClient } = getContext()   // integrations/tanstack-query/query-context.ts, um por chamada
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}
```

- `QueryClient` nasce **dentro** de `getRouter()`, pelo `getContext()` de `query-context.ts`, um por
  requisição (§3.1). O `declare module` do `Register` do router fica em `router.tsx`, o do Query em
  `http.ts` (`DECISIONS.md` #356).
- Gerador de rotas com `routeToken: 'layout'` e `routeFileIgnorePattern` no plugin
  (_doc-lib/tanstack-router.md#routing/file-naming-conventions).
- `defaultPreload: 'intent'` e `defaultPreloadStaleTime: 0`: o router antecipa, o Query decide o
  que está fresco. Prefetch manual em `onMouseEnter` não existe em `<Link>`.
  _doc-lib/tanstack-router.md#guide/preloading, #guide/scroll-restoration.
- Menu e navegação por `linkOptions()`; link interno sempre pelo `Link` tipado, nunca `href`
  literal nem template string em `to` (rota inexistente quebra no typecheck).
  _doc-lib/tanstack-router.md#guide/link-options.
- Tipo de rota sai da árvore registrada: `RouteIds<RegisteredRouter['routeTree']>`,
  `useNavigate({ from })`, wrapper de `Link` por `createLink`.
  _doc-lib/tanstack-router.md#guide/type-utilities, #guide/custom-link.
- Breadcrumb e título de tela saem do segmento de path casado contra um lookup object
  (`{ <segmento>: () => m.<chave>() }`), nunca de `if/else-if` por rota (`typescript.md` §3).
- **Rota de detalhe com estado local remonta a cada param** (`DECISIONS.md` #426). O router
  reaproveita o componente quando só o param muda, e com ele `useState`, `useMutation`, formulário
  e cronômetro: na navegação de um item para o seguinte (aula → próxima aula, registro → próximo),
  a tela mostrava o estado do item anterior. A rota declara `remountDeps: ({ params }) => params`
  (https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType, aberta:
  "By default, a route component will not be remounted if it stays active after a navigation").
  Rota sem estado local, que só lê o `loader`, não precisa. O E2E cobre navegando pelo `Link`, e não
  por `page.goto`, que remonta sempre e esconde o defeito.

---

## 2. Onde cada dado mora

| Origem | Mora em | Nunca em |
|---|---|---|
| Veio do servidor (lista, detalhe, sessão) | TanStack Query (cache) | `useState` + `useEffect` manual, store |
| Filtro, paginação, aba, painel aberto | search params da URL (`validateSearch`) | `useState` local |
| Estado de formulário | React Hook Form | `useState` por campo |
| Valor derivável de props/estado | expressão no render | `useState` + `useEffect` que recalcula |
| Estado efêmero de UI (aberto/fechado) | `useState` local | Query cache, store global |
| Estado cliente que cruza telas (ambiente ativo, tema) | cookie, ou `lib/local-store.ts` + `useSyncExternalStore` | espelho manual de um endpoint |
| Listener global (online, resize, media query) | um `useSyncExternalStore` num `hooks/use-<nome>.ts` | `addEventListener` por componente |

**Por quê**: um `useAuthStore` espelhando `GET /profile` foi a origem de dois bugs reais:
identidade de um visitante vazando para o render de outro no SSR, e perfil cacheado sobrevivendo
ao logout. O cache do Query já é a fonte única; duplicá-lo cria duas verdades que um `invalidate`
só acerta uma. _doc-lib/tanstack-query.md#guides/queries, #guides/does-this-replace-client-state.

Filtro na URL é o que faz back/forward e link copiado reproduzirem a mesma tela.
_doc-lib/tanstack-router.md#guide/search-params. Leitura com seletor
(`Route.useSearch({ select })`) para a tela não re-renderizar por parâmetro que não usa
(_doc-lib/tanstack-router.md#guide/render-optimizations).

`lib/local-store.ts` é a casa única de `localStorage`: chave versionada `<app>:<tema>:v1`, leitura
em `try/catch`, valor `unknown` convertido pelo schema de `@<projeto>/shared` e default quando o
parse falha (`typescript.md` §2). Nunca `localStorage` direto num componente *(opinião da casa)*.

**Efeitos** *(opinião da casa sobre o React, página oficial não conferida)*:

- Reação a interação do usuário fica no handler, não num efeito que observa estado.
- Efeito que assina evento, timer ou observer devolve a limpeza.
- Dependência de efeito é primitiva (`user.id`, não `user`); resultado de `useEffectEvent` nunca
  entra nas deps.
- **"Reset de estado no render" não é espelho de estado**: um rascunho local que se resincroniza
  comparando uma chave "vista" contra a atual, no corpo do componente (nunca em `useEffect`), é a
  técnica do React para resetar estado quando o input muda. Usada em filtro com rascunho antes de
  aplicar; não confundir com o anti-padrão da tabela.

### 2.1 Chaves, `queryOptions` e busca

**Uma** fábrica central, `hooks/tanstack-query/_query-keys.ts`, com seção por módulo e a mesma
forma em todo recurso *(opinião da casa; a doc mostra a fábrica, não o lugar)*:

```ts
export const queryKeys = {
  administrator: {
    posts: {
      all: ['administrator', 'posts'] as const,
      lists: () => [...queryKeys.administrator.posts.all, 'list'] as const,
      list: (search: AdministratorPostListSearch) =>
        [...queryKeys.administrator.posts.lists(), search] as const,
      details: () => [...queryKeys.administrator.posts.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.administrator.posts.details(), id] as const,
    },
  },
} as const
```

Arquivo central porque invalidação cruza módulos; `all` como prefixo é o que invalida a família
inteira (lista, infinite, detalhe) de uma vez; detalhe nunca mora sob o prefixo da lista. Array
literal de chave escrito fora da fábrica é desvio. _doc-lib/tanstack-query.md#guides/query-keys.

`queryOptions` mora **por módulo** em `integrations/tanstack-query/queries/<módulo>.ts`,
espelhando `features/<módulo>/` (`DECISIONS.md` #113, C3): plural para a lista
(`postsQueryOptions(search)`, com `placeholderData: keepPreviousData`), singular para o detalhe
(`postQueryOptions(id)`), `signal` repassado ao `request()`. Toda leitura usa `queryOptions()`,
nunca `queryKey`/`queryFn` soltos no componente: é o que faz `loader`, `beforeLoad` e
`useSuspenseQuery` lerem o mesmo cache. Cobrança por `@tanstack/eslint-plugin-query`
(`prefer-query-options`, `exhaustive-deps`; `tooling.md` §4).
_doc-lib/tanstack-query.md#guides/query-options, #eslint/prefer-query-options.

**Todo loader e todo guard** leem por
`context.queryClient.query({ ...postQueryOptions(id), staleTime: 'static' })`. O `loaderDeps` leva
só o que o loader usa (`DECISIONS.md` #347).

**Lista paginada lê com `useQuery` e `placeholderData: keepPreviousData`**, exceção ao
`useSuspenseQuery` de §2.2: o `useSuspenseQuery` ignora o placeholder e suspende a cada troca de
página, e a tabela pisca (`DECISIONS.md` #347).

**`validateSearch` nunca inline no `createFileRoute`** (C2). Uma rota lê: `-search.ts` ao lado.
Duas ou mais rotas leem: `lib/<tema>-search.ts`. Lista do painel usa a fábrica de
`lib/list-search.ts`: `listValidateSearch(schema)` e `LIST_SEARCH_DEFAULTS`, que lê os tetos
(`page ≥ 1`, `perPage ≤ 100`) do validator de `@<projeto>/shared` em vez de redigitá-los, e
`stripSearchParams` tira o default da URL; `withExtra` sai. O `-search.ts` exporta `validateSearch`
e `to<Recurso>Params`, que converte a busca da URL nos parâmetros da API (`DECISIONS.md` #347). O tipo da busca do recurso mora nesse `-search.ts`, como `z.output` do validator de `@<projeto>/shared`, com o filtro no enum do domínio e nunca `string`; `lib/list-search.ts` guarda só os genéricos (`ListSearch`, `StorefrontSearch`) e o `compactQuery`, que tira o filtro em branco antes do `query` do cliente. _doc-lib/tanstack-router.md#how-to/validate-search-params, #guide/search-params.

**Retry só para erro de servidor ou rede.** `defaultOptions.queries.retry` é uma função nomeada e
testada (`shouldRetryQuery`, em `query-context.ts`) que repete 5xx/rede, devolve `false` para todo
4xx e devolve `false` no servidor: retry no SSR segura a resposta da página (`DECISIONS.md` #352).
_doc-lib/tanstack-query.md#guides/query-retries.

**Combobox com busca no servidor**: um hook por entidade,
`hooks/use-<entidade>-read-paginated-infinite.ts` (`useInfiniteQuery` + `keepPreviousData`),
nunca `useInfiniteQuery` solto no combobox. O debounce é no valor que entra na chave, não na
`queryFn` *(opinião da casa)*. _doc-lib/tanstack-query.md#guides/infinite-queries.

**Job assíncrono por WebSocket** (importação, migração): hook genérico
`useJobSocket<TProgress, TCompleted, TError>` que conecta, entra na sala, ouve
`progress`/`completed`/`error` e limpa ao desmontar; cada job declara namespace e tipos num hook
fino. Polling de status é o fallback (`socket ?? status`) quando o socket cai. Namespace e sala vêm
dos nomes do backend (`backend.md` §3) *(opinião da casa)*.
_doc-lib/socket-io.md; _doc-lib/tanstack-query.md#guides/polling.

**SSE** (Transmit no Adonis): `hooks/use-channel.ts` genérico e um hook fino por canal, com a
mesma regra de limpar ao desmontar (`DECISIONS.md` #351).
O estado inicial se relê **depois** que a assinatura (ou a reassinatura) completa, com o
`subscription.create()` resolvido, nunca antes nem no evento `connected` do cliente, que dispara antes
do `forceCreate()` da reconexão: mensagem publicada na janela entre a leitura e a assinatura se perde,
porque o Transmit não reenvia a quem assina depois. Mensagem que chega antes da releitura fica em buffer
e é aplicada depois dela. Assinatura recusada religa o polling. Toda espera por `onSubscription` ou
`onSubscribeFailed` tem teto nomeado: o `transmit-client` 1.1.0 engole a queda de rede no POST de
reassinatura (`catch {}`) sem chamar nenhum dos dois (achado do academy, live-session, 2026-11-09).

### 2.2 Leitura sem cascata

O `loader` dispara em paralelo tudo que a tela precisa; o componente lê com `useSuspenseQuery` (a lista paginada é a exceção de §2.1).
Nunca o pai busca, renderiza e só então o filho busca.
_doc-lib/tanstack-router.md#guide/external-data-loading; _doc-lib/tanstack-query.md#guides/request-waterfalls.

```ts
loader: async ({ context, params }) => {
  await Promise.all([
    context.queryClient.query({ ...teamQueryOptions(params.id), staleTime: 'static' }),
    context.queryClient.query({ ...teamMembersQueryOptions(params.id), staleTime: 'static' }),
  ])
},
```

- Várias leituras suspensas no mesmo componente usam `useSuspenseQueries`; `useSuspenseQuery` em
  sequência roda em série. _doc-lib/tanstack-query.md#guides/suspense.
- O que entra no `head()` e no primeiro quadro acima da dobra é aguardado no `loader`; o lento
  abaixo da dobra fica fora dele, num `<Suspense>` próprio (§9.3).
- **Vitrine resistente à queda da API**: o `loader` da rota pública usa `Promise.allSettled`, cada
  seção lê o próprio `useQuery` com erro/vazio/lista, e a seção sem dado some em vez de derrubar a
  página *(opinião da casa)*. _doc-lib/tanstack-query.md#guides/ssr.

### 2.3 Mutação e invalidação

Hook de mutation é fino: em `integrations/tanstack-query/mutations/<módulo>.ts`, só `mutationFn` e
`...options` (`MutationProps<TData, TPayload>`). Toast, `navigate` e invalidação ficam com quem
chama (`useResourceForm`, §4) *(opinião da casa)*. _doc-lib/tanstack-query.md#guides/mutations.

- **Um veículo de invalidação**: `useInvalidate()` em `integrations/tanstack-query/invalidate.ts`,
  com o mapa `DEPENDENTS` (recurso → famílias de chave que dependem dele) ao lado. Mutation que não
  invalida o que mudou é defeito.
- O `onSuccess` **devolve a promessa** da invalidação: o `isPending` cobre o refetch e o botão não
  libera com a lista velha. _doc-lib/tanstack-query.md#guides/invalidations-from-mutations.
- Escrita por `mutate(vars, { onSuccess })`. `mutateAsync` só com `await` dentro de `try/catch`;
  nunca `.then/.catch`, nunca `void mutateAsync(...)`: sem `await` a rejeição fica sem dono.
- **Otimista** só em ação de baixo risco (marcar, curtir); pagamento e exclusão esperam o servidor.
  Receita: `cancelQueries` → snapshot → `setQueryData` imutável → rollback no `onError` →
  invalidação no `onSettled`. Sem `!` no `old` (narrowing). `setQueryData` com a resposta só quando
  ela é o registro completo; senão invalida.
  _doc-lib/tanstack-query.md#guides/optimistic-updates, #guides/updates-from-mutation-responses.

---

## 3. Sessão, ambiente e cliente HTTP

### 3.1 Estado por requisição

No SSR, módulo do Nitro é memória do processo, compartilhada entre visitantes. Nada de estado de
requisição em variável de módulo: `QueryClient` nasce em `getRouter()` (§1.4), e o escopo de cada
requisição (dedup de refresh de sessão) abre num request middleware de `start.ts` com
`AsyncLocalStorage`. _doc-lib/tanstack-query.md#guides/ssr (regra 1);
_doc-lib/tanstack-start.md#guide/middleware.

`src/start.ts` é obrigatório e registra, nesta ordem,
`requestMiddleware: [createCsrfMiddleware({ filter: ({ handlerType }) => handlerType === 'serverFn' }), requestScope]`
(_doc-lib/tanstack-start.md, "Middleware e CSRF"; `DECISIONS.md` #336).

### 3.2 Sessão e ambiente sem store

Sessão é dado do servidor: mora no cache do Query, lida pela **mesma** `queryOptions` que o
`beforeLoad` usa. Ambiente/tenant ativo é uma string em **cookie**, nunca `localStorage`: é o único
canal que o navegador manda junto do documento no SSR. Tema claro/escuro também vem de cookie
(§6). _doc-lib/tanstack-start.md#guide/server-functions.

Render do SSR não lê nada que só existe no cliente (`localStorage`, fuso do navegador,
`Date.now()`, aleatório). `suppressHydrationWarning` só no nó que diverge por natureza.
_doc-lib/tanstack-start.md#guide/hydration-errors.

**Sessão vencida no meio do uso**: o layout privado assina o `QueryCache` e o `MutationCache` e
redireciona ao login em 401, com `?redirect=` da tela atual *(opinião da casa)*.

### 3.3 Ambiente e cliente HTTP

- **Segredo nunca vai para o frontend.** Toda `VITE_*` é pública por definição: entra no bundle e
  qualquer pessoa lê pelo navegador. Chave de API de terceiro (IA, pagamento, e-mail, mapa com
  cota) fica no ENV do backend, e a chamada passa por um service de `services/` exposto por uma ação
  (`architecture.md` §3). `VITE_*` só guarda endereço público e identificador que o fornecedor
  declara público. Cobrado pelo `pattern:check` (nome de variável `VITE_*` com `KEY`, `SECRET`,
  `TOKEN` ou `PASSWORD` reprova).
- **Cabeçalhos de segurança no servidor do frontend** *(opinião da casa; página do Nitro não
  conferida)*: o Nitro não manda nenhum por padrão. `routeRules` com `headers` em `'/**'`
  (`_doc-lib/nitro.md#config`) ou middleware em `src/server.ts` enviam `Content-Security-Policy` com
  `frame-ancestors 'none'` e `connect-src`/`img-src` só para a API e, com upload pré-assinado
  (`backend.md` §5.4), a origem pública do storage (`STORAGE_PUBLIC_URL`, lida por requisição em
  `src/server.ts`, nunca fixada no build pelo `vite.config.ts`), nada além, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin` e HSTS sem `preload`. Sem `frame-ancestors`, a
  tela de login pode ser embutida em `iframe` por outro site (clickjacking).
- **Endereço da API sem default de rede.** `src/env.ts` lê `VITE_API_URL` uma vez e o build falha
  sem ela; `http://localhost:3333` como fallback publica um site que manda senha para a máquina de
  quem visita. Em produção ela vem do `frontend/.env.production` versionado, que o build da imagem
  lê e confere (`tooling.md` §8.2); na rodada antes do PR, do `.env.e2e`, com o endereço local.
- **Dado pessoal não fica em `localStorage`**: sem validade, fica para o próximo usuário do
  computador. Guarde o id e busque o resto na API, ou expire.
- **Nome das chaves**: `VITE_API_URL`, `VITE_SITE_URL`, `VITE_UPLOAD_MAX_SIZE`, `SERVER_API_URL`,
  `SITE_ENV`, `STORAGE_PUBLIC_URL` e as `E2E_*`, com regra de nome e significado, estão no catálogo de `backend.md` §6.2; chave nova ou
  sinônimo (`VITE_API_BASE_URL`) não nasce aqui.
- `src/env.ts` lê só `VITE_*`, uma vez, de forma síncrona, validado com Zod (o módulo roda antes do
  router montar), sem default de rede em nenhum ramo, nem no de desenvolvimento (`DECISIONS.md` #335). `SERVER_API_URL` é lida por requisição só no ramo `.server()`.
  _doc-lib/vitejs.md#env-and-mode; _doc-lib/tanstack-start.md#guide/environment-variables.
- Código que diverge entre cliente e servidor (base de URL, leitura de cookie, dedup de refresh)
  usa `createIsomorphicFn()`, nunca `typeof window` no meio da função.
  _doc-lib/tanstack-start.md#guide/environment-functions.
- **Um `request()` só**, em `integrations/tanstack-query/http.ts` (`http.server.ts` para o ramo
  de servidor). Nos projetos Adonis, o `request()` usa o cliente Tuyau como transporte e mantém a
  validação pelo schema; `TuyauError` vira `HTTPError` ali e não sai do arquivo. O lowcodejs
  (Fastify) usa `fetch` (`DECISIONS.md` #324; _doc-lib/tuyau.md). `MutationProps` mora no mesmo
  arquivo (`DECISIONS.md` #356). Ele:
  - lança `HTTPError`, espelho do `ErrorEnvelope` de `@<projeto>/shared`, registrado como
    `Register['defaultError']` (_doc-lib/tanstack-query.md#typescript); a UI compara `code`, nunca
    `message` (`typescript.md` §5). A doc pede `unknown` quando o call site estreita; a casa
    registra `HTTPError` porque todo erro passa por `HTTPError.from` aqui, e o conflito está em
    `DECISIONS.md` #352;
  - converte o corpo `unknown` pelo schema `…Response` de `@<projeto>/shared`
    (`architecture.md` §10). É o **único** ponto onde o corpo vira tipo; `as` espalhado e
    `json()` tratado como `T` são desvio (`typescript.md` §2, §2.1);
  - confere o corpo de erro campo a campo antes de montar o `HTTPError`: `message` e `code` só se
    forem string, `status` só se for número, `errors` só se for objeto de `campo → string`; o que
    não passa fica de fora e cai no padrão (`UNKNOWN_ERROR`, o status da resposta). Corpo de erro
    é dado de fora como qualquer outro: proxy, CDN e pacote do backend respondem no formato deles,
    e um `errors` em lista renderizado como mensagem vira "[object Object]" na tela
    (`DECISIONS.md` #293);
  - deduplica o refresh em 401 por requisição (§3.1);
  - soma o `signal` da query com um teto de tempo, `AbortSignal.any([signal, timeout])`
    *(opinião da casa, API do runtime)*: sem o teto, API que não responde prende a tela ou o SSR;
  - manda `Accept-Language` com o idioma atual (`i18n.md` §2).

### 3.4 Guard de área e capacidade

O guard de capacidade de uma área mora no `layout.tsx` da área (`_private/<área>/layout.tsx`),
nunca num middleware central nem repetido em cada rota *(opinião da casa)*: a área que exige a
capacidade é a que declara o guard. O `_private/layout.tsx` cobre a sessão; o da área, a permissão.

O que decide **o que renderizar dentro** de uma rota já carregada (esconder botão, desabilitar
célula) é hook de permissão (`use<Recurso>Permission`), nunca `if` de papel espalhado pela tela.

### 3.5 Redirect e datas

- **`?redirect=` só aceita caminho interno.** `validateRedirectSearch` em `lib/redirect-search.ts`
  recusa o que não começa com `/` e tudo que começa com `//` ou `/\` (open redirect), caindo na
  home *(opinião da casa; mecanismo em _doc-lib/tanstack-router.md#guide/authenticated-routes)*.
- **Data exibida tem o fuso da cidade**: `DateTime` do Luxon (`tooling.md` §0.1) com `setZone`
  explícito e `setLocale` do idioma atual, num formatador de `lib/i18n.ts`. O fuso é o
  `timeZone` da cidade da página (`useCity()`, `DECISIONS.md` #390), passado ao formatador; nunca
  constante no código, porque cada cidade tem o seu relógio, e nunca o do navegador, que faz SSR e
  hidratação renderizarem strings diferentes *(opinião da casa)*.
- **A cidade é o segmento depois do idioma** (`/pt-br/<cidade>/...`, `DECISIONS.md` #390). O
  `rewrite` do `router.tsx` tira o idioma, então para a árvore de rotas a cidade é o primeiro
  segmento: a rota do projeto é `routes/$city/...`, o `loader` dela resolve a cidade (e o cliente,
  pelo segundo segmento ou pela sessão) e envolve a subárvore no `TenantProvider`
  (`integrations/tenant/tenant-context.tsx`). `CityPath` (`lib/city-path.ts`) lê e troca o
  segmento; `CitySwitcher` e `PlatformOverview` são peças do kit comum e recebem os dados por prop.
  Sem DNS curinga nem certificado por cliente. O slug da cidade nunca colide com prefixo de idioma:
  o backend o recusa no cadastro, e a lista de segmentos fixos (`Rule.RESERVED_SLUGS`, `DECISIONS.md`
  #399) vale também para o slug do cliente. Projeto de **cliente único** (`SINGLE_TENANT_SLUG` no
  backend, `backend.md` §4.14) não monta a rota `$city` nem usa `CityPath`/`CitySwitcher`: a URL é
  `/pt-br/agenda`, sem segmento de cidade.

---

## 4. Formulários

```ts
const form = useForm<AdministratorPostCreatePayload>({
  resolver: zodResolver(AdministratorPostCreateValidator),
  mode: 'onTouched',
})
```

- **Schema e tipo vêm de `@<projeto>/shared`**: `resolver: zodResolver(<Validator>)`
  (`@hookform/resolvers/zod`) e tipo `z.infer<typeof <Validator>>`
  (`<Módulo><Recurso><Ação>Payload`). Nunca schema declarado no componente, nunca `vine.*` no
  frontend. No projeto Fastify é o **mesmo arquivo** que o backend usa; no projeto Adonis o
  backend valida com o par VineJS (mesmo caminho e nome, `app/validators/`) e o spec de paridade
  confere campo, tipo e teto dos dois (`architecture.md` §9, §10): o formulário não aceita o que a
  API rejeita. _doc-lib/zod.md#basics, _doc-lib/react-hook-form.md#docs/useform.
- Mensagem de validação sai do locale do Zod e do mapa por idioma de `shared/src/validator.ts`,
  nunca string no campo (`i18n.md` §2). _doc-lib/zod.md#error-customization.
- `mode: 'onTouched'` (valida ao sair do campo, não a cada tecla). Campo liga por `AppField`
  (`Controller`), inclusive o campo com máscara (abaixo). `shouldFocusError` fica no padrão (ligado).
  _doc-lib/react-hook-form.md#docs/usecontroller/controller.
- Valor observado num filho por `useWatch({ control, name })`; `form.watch` só na raiz que
  precisa. _doc-lib/react-hook-form.md#docs/usewatch.
- **Erro da API no formulário** por uma função central, `applyHTTPErrorToForm` em
  `lib/form-errors.ts`: cada entrada de `error.errors` vai para o campo quando o campo está em
  `X_FIELDS`; o resto vai para `setError('root')` ou para um toast com `id` fixo. Nunca
  `try/catch` por tela. _doc-lib/react-hook-form.md#docs/useform/seterror.
- **"Tentar de novo"** é oferecido em 409, 5xx e falha de rede, mantendo o digitado; nunca em
  401/403/404/422, que reenviar não resolve. Mesmo critério de `shouldRetryQuery` (§2.1)
  (`DECISIONS.md` #113, C16; revisa a #46).
- Máscara (telefone, CPF, moeda) é `FieldMask` (`components/common/field/field-mask.tsx`) sob
  `AppField`, com `useMaskInput({ mask, register: control.ref })` (`control.ref` é o `field.ref` do `Controller`, que o `AppField` repassa): o `ref` do RHF chega ao input
  pela opção `register` da lib, o ponto de integração que ela documenta para lib de formulário, e
  rótulo e erro ficam no `AppField` (_doc-lib/use-mask-input.md#api-reference, `DECISIONS.md` #325,
  que revoga a parte de máscara da #320). Os aliases moram em `lib/mask.ts`. Lê o valor **sem
  máscara** pelas funções dela (`unmaskedValue()` do ref, `getUnmaskedValue` ou `unformatWithMask`) antes de
  submeter, nunca regex tirando caractere. _doc-lib/use-mask-input.md#api-reference.
- **Máscara sem molde à mostra** (`DECISIONS.md` #428). Toda máscara recebe uma constante de módulo
  com `jitMasking: true`, `placeholder: ''`, `showMaskOnFocus: false` e `showMaskOnHover: false` (as
  `Options` são as do Inputmask, _doc-lib/use-mask-input.md#api-reference,
  https://robinherbots.github.io/Inputmask/): a pontuação só entra quando o dígito seguinte chega, e
  o campo nunca mostra `33_.___.___-__`. O wrapper do campo mascarado aplica a constante por padrão.
  Data usa máscara por dígitos (`99/99/9999`), e não o alias `date-br`, que impõe o molde
  `dd/mm/yyyy` mesmo com `placeholder` vazio; quem valida a data é o parser do campo, não a máscara.
  Conferido em Chromium digitando campo a campo *(opinião da casa)*.
- **Formulário dinâmico** (campos definidos em runtime): o resolver recebe o schema montado pelo
  construtor de `@<projeto>/shared` a partir da definição dos campos (`architecture.md` §10);
  `rules` por campo e `resolver` nunca convivem no mesmo form (o RHF ignora `rules` quando há
  `resolver`). _doc-lib/react-hook-form.md#get-started#Applyvalidation.
- **Todo `FormShellContent` tem `method="post"`**: antes da hidratação, o envio nativo não põe o
  digitado (senha, documento) na query string *(opinião da casa, `DECISIONS.md` #356)*.
- **Alteração não salva**: `useBlocker` quando `formState.isDirty`.
  _doc-lib/tanstack-router.md#guide/navigation-blocking.

**`useResourceForm` sobre `useMutationForm`** *(opinião da casa)*: `useMutationForm` é a base
(form + mutation + `applyHTTPErrorToForm` + retry) para diálogo, login e cadastro em linha;
`useResourceForm` acrescenta `formId`, `validator`, `defaults`/`values`, `fields`, `mutation`,
`invalidate`, `backTo`, `success`, `retry` e `payload`, e é o padrão de todo formulário de criação
e edição de recurso. Os dois moram em `hooks/`. O `onSubmit` devolve a promise (`mutateAsync`): sem
isso `isSubmitting` nunca vale `true`. Limpar o formulário depois do sucesso é a opção
`resetOnSuccess` do `useMutationForm`.

**Arquivos do formulário de recurso** *(opinião da casa)*:

- `-components/form-fields.tsx` exporta `PostFormFields({ form, idPrefix })` (só os campos, sem
  envio), `POST_FIELDS` (`as const`, os campos que a API pode acusar), `POST_FORM_DEFAULTS` e
  `postToValues(post)`. A conversão entre formulário e API mora aqui, com teste.
- `form-create.tsx` e `form-edit.tsx` são cascas que chamam `useResourceForm` e renderizam o
  mesmo `form-fields.tsx`, com `idPrefix` diferente (ids não colidem). Recurso com um modo só tem
  só a casca dele.
- **Edição valida com o validator de criação**: o de `Update`, todo opcional, aprovaria campo
  obrigatório apagado. Exceção: campo "em branco = não trocar" (senha), que sai do payload quando
  vazio; `passwordConfirmation` é declarado no validator.

**Upload em voo trava o submit** *(opinião da casa)*: campo que sobe o arquivo na escolha
registra uma chave em `components/common/uploading-context/uploading-context.tsx` (`Set<string>`, não contador) e
a remove ao terminar ou falhar; o salvar fica desabilitado enquanto o `Set` não estiver vazio.

**Upload multipart** pelo `hooks/use-multipart-upload.ts` do kit: `upload`, `cancel` (aborta e manda
`DELETE`), `cancelAll` e aborto no unmount; os `headers` de cada parte vêm do servidor e o hook só
os repete (`backend.md` §5.4, `DECISIONS.md` #349).

**Formulário dentro de Dialog/Sheet** é um componente interno montado só quando aberto. O `reset`
nunca vai dentro do `onSubmit`: o `handleSubmit` atualiza o estado de envio depois do handler, e o
reset ali limpa os valores mas não o estado. Ele roda num `useEffect` quando
`formState.isSubmitSuccessful` vira `true`, com o `defaultValues` inteiro, e é ali que o Dialog fecha
(_doc-lib/react-hook-form.md#docs/useform/reset, `DECISIONS.md` #320).

Acessibilidade do formulário (rótulo, `aria-invalid`, `aria-describedby`, atributos de entrada):
§10.3.

---

**Envio duplo é conforto, não proteção**: o botão de enviar fica desabilitado durante o envio
(`formState.isSubmitting`, que fica `true` só enquanto a promise do envio está pendente;
`_doc-lib/react-hook-form.md#docs/useform`, página `useform/formstate`), e a regra que impede o efeito duplicado mora no backend (`backend.md`
§4.11, recurso limitado e `Idempotency-Key`). Preço, desconto, permissão e limite de plano mostrados
na tela são cópia do que o servidor calculou; o frontend nunca manda valor para o servidor confiar
(`backend.md` §5.7, item 3).

## 5. Erros, carregamento e não encontrado

`QueryErrorResetBoundary` com `react-error-boundary` em volta do `Outlet` é o que permite "tentar
de novo" sem recarregar a página: um `try/catch` por componente não limpa o estado de erro que a
boundary guardou. Rota declara `errorComponent` próprio só quando o erro pede tela diferente.
_doc-lib/tanstack-query.md#guides/important-defaults; _doc-lib/tanstack-start.md#guide/error-boundaries.

- **Carregamento**: rota de listagem declara `pendingComponent` com o `table-skeleton` do kit
  (§8), do mesmo tamanho da tela final; nunca `<Loading />` genérico nem tela em branco
  *(opinião da casa)*. `defaultPendingMs` fica no padrão até haver medida.
- `useSuspenseQuery` só abaixo de uma boundary. A rota inteira é o `pendingComponent`; dentro da
  tela, seção que carrega sozinha tem `<Suspense>` próprio com esqueleto.
  _doc-lib/tanstack-query.md#guides/suspense.
- **Não encontrado**: o loader de detalhe passa por `loadOrNotFound` (`lib/load-or-not-found.ts`):
  404 da API vira `throw notFound()`, todo o resto relança. A rota declara `notFoundComponent`.
  5xx nunca vira 404, e "não encontrado" nunca responde 200 (soft 404).
  _doc-lib/tanstack-router.md#guide/not-found-errors.
  **Rota coringa** (`$.tsx`, a do "qualquer outro endereço") casa a URL, então para o roteador não
  há nada "não encontrado": com a tela no `component`, o SSR desenha "Página não encontrada" com
  status 200. O `loader` dela lança `notFound()` e a tela mora no `notFoundComponent` da mesma rota
  (`DECISIONS.md` #306; https://tanstack.com/router/latest/docs/guide/not-found-errors, "Throwing
  your own notFound errors", aberta: a doc recomenda lançar no loader e não no componente). O status
  404 do SSR com isso foi conferido pelo E2E do academy (§11.2); a página do Start sobre o status:
  não conferida.
  **Layout sem página própria** também casa a URL exata (`/administrator`, `/owner`) e desenha o painel
  vazio com 200. Todo layout tem `index.tsx`: ou uma página real, ou o índice que leva à primeira aba
  (permitido pela #383, `backend.md` §2), ou um `loader` que lança `notFound()`, como o `$.tsx`. Nunca o
  layout sem índice (achado do aporta, conferido com `matchRoutes` sobre o `routeTree` gerado).
- **Mapa de status para a tela** *(opinião da casa)*: 401 → login; 403 do portão ou do guard de
  área → redirect (§1.3); 403 da API dentro de uma tela → `AccessDenied` (`DECISIONS.md` #333);
  404 → não encontrado, 422 → campo (§4), 429 → aguarde, 5xx e rede → genérico com "tentar de
  novo". Erro de um bloco não derruba a tela inteira.

Os quatro estados de toda tela que lê dado (carregando, vazio, erro, preenchido): §10.1.

---

## 6. Design system e estilo

### Toda interface é shadcn sobre Base UI *(regra universal, decisão do dono, `DECISIONS.md` #366)*

Toda rota, página, sub-rota, layout, interface, componente, formulário e campo, pública ou privada,
monta a tela com os componentes do shadcn (Base UI) de `components/ui/`, ou com peça do kit
(`components/common/`) que já é composta por eles. Não há tela fora disso.

- Elemento que tem par no registry nunca se escreve à mão: `<button>`, `<input>`, `<textarea>`,
  `<select>`, `<label>`, `<table>`, `<dialog>`, `<form>` de campo solto, checkbox, radio, switch, tabs,
  menu, popover, tooltip, toast, badge, card, separator, skeleton, avatar, breadcrumb, pagination,
  sheet, drawer, accordion e o resto do registry. O elemento HTML nativo só aparece dentro de
  `components/ui/` (o próprio shadcn) e como estrutura sem comportamento (`div`, `section`, `main`,
  `header`, `footer`, `nav`, `ul`, `li`, `h1`..`h6`, `p`, `span`, `img` por `Picture`).
- Link é o `Link` do TanStack Router, com o estilo do `Button` (`buttonVariants`) quando parece botão.
- Campo de formulário é o `Field` do shadcn sob `AppField` (§4); ícone é Phosphor.
- Peça que o registry não tem: procure no registry inteiro (`shadcn add --all` já instalado, #299)
  e nos blocos; não achou, a peça nasce no kit do upstream, composta por `ui/`, nunca no projeto.
- Cobrança: o ESLint do modelo proíbe o JSX intrínseco interativo fora de `components/ui/`
  (`no-restricted-syntax`) e o `pattern:check` lista o resto; exceção não existe.


### `components/ui/` é arquivo do projeto, editável com marca

O shadcn copia o componente para o repositório: "um arquivo seu, versionado, editável"
(_doc-lib/shadcn.md#docs). A régua antiga ("não se edita") contradizia a doc e todo projeto já
editava; vale a doc (`DECISIONS.md` #113, C10):

- **Pode**: variante nova no `cva` do próprio arquivo e rótulo traduzido (`m.*()`), cada linha
  alterada marcada com `// casa:` e o motivo em inglês (`// casa: success variant for status
  badges`). A marca é o que permite reaplicar a mudança quando o componente vem de novo do
  registry.
- **`ui/sonner.tsx` leva patch obrigatório**: o registry importa `useTheme` de `next-themes`, que a
  casa não instala (tema por cookie, §6 "Tokens e tema"). O patch, com `// casa: theme comes from the
  cookie, not from next-themes`, tira o import e deixa `theme` entrar como prop de `ToasterProps`;
  quem passa é `common/theme/theme-provider-toaster.tsx` do kit, com o tema do `ThemeProvider`.
  Sem o patch o `next-themes` volta ao `package.json` e o toast não segue o cookie. O `date-fns` do
  `calendar` é transitivo do `react-day-picker` e o código da casa não o importa (`tooling.md` §0.1).
- **Não pode**: hook do app, regra de negócio, fetch, componente que não veio do registry (vai
  para `common/`).
- **O registry inteiro fica instalado** (`DECISIONS.md` #299, revoga "componente sem consumidor
  sai" da #146): `shadcn add --all` sem `--overwrite`, que é o padrão da CLI, para não apagar
  arquivo que já tem linha `// casa:`. Antes, `--dry-run` mostra o que entra; depois, o arquivo marcado que o
  registry mudou se compara com `shadcn add <nome> --diff` e se reaplica à mão
  (_doc-lib/shadcn.md#docs/cli, https://ui.shadcn.com/docs/cli, aberta). Componente instalado
  e sem uso não pesa no bundle, porque só entra o que alguém importa; o ganho é a tela nova achar a
  peça pronta em vez de alguém escrever uma do zero (_doc-lib/shadcn.md#docs/components).
- **Cada componente do registry é avaliado** e registrado na seção "Componentes do shadcn" do
  `docs/DESIGN.md` do projeto, numa tabela de três colunas: componente, decisão (**já usado**,
  **aplicado** nesta revisão, **não se aplica**) e onde se usa ou por que não. Componente que o
  registry traz depois entra na tabela no mesmo PR que atualiza `ui/` *(opinião da casa; a doc lista
  os componentes, mas não manda avaliar)*.

_doc-lib/shadcn.md#docs/theming, #docs/components-json.

### Tokens e tema

- Componente consome **token semântico** (`primary`, `destructive`, `muted-foreground`,
  `success`, `warning`), nunca paleta fixa. Modo escuro redefine só o semântico.
  _doc-lib/shadcn.md#docs/theming; _doc-lib/tailwindcss.md#dark-mode.
- Tailwind v4 pelo plugin do Vite, sem `tailwind.config.js`; tema em `@theme` dentro de
  `styles.css`. _doc-lib/tailwindcss.md#installation/using-vite, #theme.
- `styles.css` (tema do projeto) abre com `@import "tailwindcss" source("./")`, `@import
  "tw-animate-css"` e `@import "shadcn/tailwind.css"`. O `source("./")` prende a varredura de classes
  a `src/`: na imagem do Coolify não há `.git` nem `.gitignore`, o Tailwind varria `.output/` e o
  build do cliente e o do SSR geravam CSS com hash diferente, e o HTML pedia um `styles-<hash>.css`
  que não existe (página sem estilo em produção; relato do jhollyfer.com.br;
  _doc-lib/tailwindcss.md#detecting-classes-in-source-files). O `shadcn/tailwind.css` traz as custom variants (`data-horizontal`, `data-vertical`...)
  que os componentes de `ui/` do registry base-mira usam; sem ele Tabs e afins quebram sem erro
  (relato do jhollyfer.com.br). `shadcn`, `tw-animate-css` e `class-variance-authority` estão no
  `kit.deps.json`. O tema define também os tokens que as peças do kit leem (`font-display`,
  `text-caption`, `text-error-code`, `min-h-page-state`, `min-h-stage-sm`, `max-w-popup-inset`, a
  escala `z-*` de `lib/cn.ts`); a lista fechada é o esqueleto `_templates/code/frontend/src/styles.css`
  (ponto de extensão: nasce se faltar, valores de exemplo, nunca sobrescrito; o `logo-512.png` que o
  `pageHead` lê está documentado no cabeçalho dele). `lib/theme-tokens.test.ts` compila cada classe que o
  código escreve contra o `styles.css` (`@tailwindcss/node`) e reprova a que não gera CSS, porque classe de
  token ausente some sem erro. `prose` vem de `@plugin '@tailwindcss/typography'`. _doc-lib/shadcn.md#docs/theming.
- **Todo valor de design é token no `@theme`**, pelo namespace dele (`--color-*`, `--text-*`,
  `--font-*`, `--leading-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--breakpoint-*`,
  `--ease-*`, `--animate-*`). Valor arbitrário em classe (`text-[13px]`, `z-[9999]`,
  `-[var(--x)]` repetido) é desvio; valor repetido vira token ou `@utility`.
  _doc-lib/tailwindcss.md#theme, #adding-custom-styles.
- **Tipografia fluida** *(opinião da casa, `DECISIONS.md` #265)*: a escala `--text-*` do `@theme` guarda
  o tamanho de desktop como **teto** de um `clamp(mínimo, base + inclinação·vw, teto)`, para o título
  não quebrar em 320 px nem crescer além do desenho. Corpo e apoio (`body`, `supporting`, `caption`) não
  encolhem; valor novo mantém o teto e escolhe o mínimo pelo que cabe em 320 px. A doc só diz que
  `--text-*` gera os utilitários de tamanho e que o valor é qualquer CSS válido; o `clamp()` é escolha
  da casa. _doc-lib/tailwindcss.md#theme (https://tailwindcss.com/docs/theme, aberta).
- Nome de token diz papel, não valor (`--text-heading`, nunca `--font-size-16`). z-index é escala
  nomeada em token (`sticky < overlay < modal < dropdown < toast < tooltip`) *(opinião da casa,
  `DECISIONS.md` #257)*: o `dropdown` (popup de select, menu, popover e combobox do Base UI) fica
  **acima** do `modal`, porque abre de dentro de dialog e sheet, e popup abaixo do modal que o
  abriu é inalcançável. A doc não fixa a ordem; só pede o `isolation: isolate` do app
  (_doc-lib/base-ui.md#react/overview/quick-start). z-index local (`z-10`) fica fora da escala.
- Tema claro/escuro decidido no servidor (cookie lido no `loader` da raiz), sem flash.
  _doc-lib/shadcn.md#docs/dark-mode/tanstack-start.
- Popup do Base UI anima entrada e saída por `data-starting-style`/`data-ending-style` com
  `transition`. _doc-lib/base-ui.md#react/handbook/animation.
- Identidade visual (cor, família, raio, direção) é do projeto e mora em `docs/DESIGN.md` e no
  tema (`documentation.md`); esta régua só diz onde e como.

### Classe e variante

- `cn()` mora em `lib/cn.ts`, sozinho (convenção shadcn; `components.json` aponta o alias), com
  `extendTailwindMerge` quando o tema tem escala custom; a exceção nomeada está em
  `typescript.md` §6 (`DECISIONS.md` #113, C19). *(opinião da casa: `tailwind-merge` não é lib
  oficial do Tailwind; _doc-lib/tailwindcss.md#styling-with-utility-classes não contradiz.)*
- Classe condicional por `cn('base', { 'is-active': isActive })` ou lookup; nunca ternário nem
  concatenação de string em `className`/`style`.
- Variante visual mora no `cva` do componente e é tipada por `VariantProps<typeof xVariants>`;
  nunca `if` de classe na tela nem union de string redigitada (`DECISIONS.md` #95).

### 6.1 Compound component, nunca componente de muitas props

Componente com mais de uma área de conteúdo é **compound**: uma raiz que guarda o estado em
contexto e partes que se compõem como filhos. Forma do shadcn: cada parte é **named export**
(`Card`, `CardHeader`, `CardTitle`) e toda parte leva `data-slot`
(_doc-lib/shadcn.md#docs/components, #docs/tailwind-v4). O Base UI compõe da mesma forma
(_doc-lib/base-ui.md#react/handbook/composition).

```tsx
// errado: cada variação vira mais uma prop, e o componente decide o layout por if
<UserCard user={user} showAvatar showActions actionsPosition="bottom" title="..." />

// certo: quem usa monta; cada parte é pequena e substituível
<UserCard user={user}>
  <UserCardHeader>
    <UserCardAvatar />
    <UserCardTitle>{m.users_card_title()}</UserCardTitle>
  </UserCardHeader>
  <UserCardActions />
</UserCard>
```

```tsx
// certo: components/common/user-card/user-card-context.ts
type UserCardContextValue = { readonly user: AdministratorUserShowResponse }

export const UserCardContext = createContext<UserCardContextValue | null>(null)

export function useUserCardContext(consumer: string): UserCardContextValue {
  const context = use(UserCardContext)
  if (!context) throw new Error(`<${consumer}> must be rendered inside <UserCard>`)
  return context
}

// certo: components/common/user-card/user-card-avatar.tsx
export function UserCardAvatar({ className, ...props }: Readonly<ComponentProps<'img'>>): React.JSX.Element {
  const { user } = useUserCardContext('UserCardAvatar')
  return <img data-slot="user-card-avatar" src={user.avatarUrl} alt={user.name} className={cn('size-8 rounded-full', className)} {...props} />
}

// certo: quem usa importa cada parte do arquivo dela, sem index.ts
import { UserCard } from '#/components/common/user-card/user-card'
import { UserCardAvatar } from '#/components/common/user-card/user-card-avatar'
```

Regras:

- **Named export por parte**, prefixado pela raiz, importado do arquivo da parte. Nunca
  objeto `{ Root, Header }` com acesso por ponto (`DECISIONS.md` #88).
- **Pasta própria** (`DECISIONS.md` #89): `<nome>.tsx` (raiz), `<nome>-context.ts`,
  `<nome>-<parte>.tsx` por parte grande, `<nome>.test.tsx`. Parte de poucas linhas pode
  morar no arquivo da raiz. Compound **route-local** (`-components/<peça>/`) segue a mesma forma.
- **Sem barrel file.** Nenhum `index.ts` que só reexporta, nem por peça nem agregador
  (`components/common/index.ts`, `hooks/index.ts`, `lib/index.ts`): a doc do Vite manda evitar barrel
  porque ele obriga a carregar e transformar todo arquivo reexportado
  (_doc-lib/vitejs.md#performance, `DECISIONS.md` #319). A única exceção é o ponto de entrada do
  pacote `shared/` (`architecture.md` §9), que é o contrato do pacote.
- **Toda parte leva `data-slot="<nome>-<parte>"`.** Layout que muda conforme a parte existe lê
  `has-data-[slot=<nome>-<parte>]:` no pai, nunca prop booleana. Slot nunca é detectado por
  `child.type`, `React.Children.map` ou `cloneElement`
  (_doc-lib/react-hook-form.md#advanced-usage#SmartFormComponent).
- **Estado no contexto da raiz**, lido por `use()` através do hook com o nome de quem chama, que
  lança apontando a parte fora do lugar. Contexto com mais de uma fonte possível tem a forma
  `{ state, actions, meta }`, e o provider é o único que sabe de onde o estado vem: trocar
  `useState` por mutation não toca a parte *(opinião da casa)*.
- Contexto partido por preocupação; valor de alta frequência (posição, digitação) não vai em
  contexto lido por muitos. Contexto não carrega genérico: a instância de `useTable<TData>` segue
  por prop, nunca `Context` com `as`.
- Prop booleana de mostrar/esconder (`showX`) é compound faltando: a parte existe ou não no JSX.
  Modo distinto vira componente-variante explícito (`PostFormCreate`, `PostFormEdit`), nunca
  `<PostForm isEditing />`.
- Elemento renderizado se troca pela prop `render` do Base UI, nunca `asChild` nem prop `as`
  (_doc-lib/base-ui.md#react/handbook/composition).
- `children` no lugar de `renderX`. Render prop só quando o pai entrega dado ao filho (linha
  virtualizada, `table.Subscribe`), e nunca se chama `render`.
- Prop continua certa para **dado** (`user`, `value`, `onChange`) e para variante de estilo do
  próprio componente (`variant`, `size` via `cva`). Estrutura é JSX, não prop.

**Nem toda estrutura de partes ganha `Context`** (`DECISIONS.md` #48): quando as partes não
compartilham estado, compound sem `createContext` já resolve, e contexto a mais é cerimônia sem
leitor.

Skills: `compound-pattern`, `react-composition-patterns` (vale a régua onde elas divergem:
`X.Part`, `as`, `useContext`).

### 6.2 Sobreposições: Dialog, AlertDialog, Sheet

A forma única está nas skills `dialog-pattern` e `sheet-pattern`; o resumo que vale aqui:

- **Uncontrolled e trigger-forward**: o componente recebe as props do `Trigger`
  (`Merge<Omit<ComponentProps<typeof DialogTrigger>, ...>, {...}>`) e espalha `{ ref, ...rest }`
  nele; sem `open`/`onOpenChange`/`useState` de abertura. Header sempre com Title e Description
  (`sr-only` quando esconder); "Cancelar" é `DialogClose render={<Button variant="outline" />}`.
- **Abrir sem clique do usuário** (atalho, alvo vindo de linha ou menu, efeito) usa
  `Dialog.createHandle()` e `open()`/`openWithPayload()`; nunca `useEffect` que clica um `ref`,
  nunca botão escondido. O `ref.click()` programático falha em silêncio no Base UI.
  `ref.current?.click()` dentro do `onClick` de um clique real continua válido.
  _doc-lib/base-ui.md#react/components/dialog.
- Dialog aberto de menu é irmão do `DropdownMenu`, fora do `DropdownMenuContent`; um handle por
  Dialog, não por lugar que abre.
- Dialog de formulário foca o primeiro campo (`initialFocus`); conteúdo montado só aberto (§4).
- Sheet de filtro não guarda filtro: desenha os controles e navega search params (§2). Link de menu
  mobile vai em `<SheetClose nativeButton={false} render={<Link ... />} />`: `SheetClose` é
  `DialogClose`, que renderiza `<button>`; sem `nativeButton={false}` o Base UI acusa o elemento que
  não é botão no console e o teclado (Enter e Espaço) não fecha (`NativeButtonProps` em
  `@base-ui/react/dialog/close`, tipo instalado; _doc-lib/base-ui.md#react/components/dialog).
  Pelo mesmo motivo link com cara de botão é `Link` com `buttonVariants`, não `Button render={<Link />}`. O `pattern:check` reprova `Button render={<Link />}` (regra `link-as-button`, `DECISIONS.md` #440); `SheetClose nativeButton={false}` e `SidebarMenuButton` seguem permitidos, e o `Link` da seta de voltar, do descartar e do criar do kit já é `Link` com `buttonVariants`.
- Modal não é a primeira opção: só para tarefa que precisa interromper ou proteger o foco; o resto
  é inline, Sheet ou página *(opinião da casa)*.
- Ação destrutiva: `ConfirmDialog` do kit (AlertDialog) e as regras de §10.6.
  _doc-lib/base-ui.md#react/components/alert-dialog.
- Texto de toda sobreposição sai de `m.*()`.

### 6.3 Componentes e hooks

- Componente nunca é declarado dentro de outro componente, de hook ou de `useMemo`: tipo novo a
  cada render desmonta a subárvore e perde estado.
- React 19: `ref` é prop (sem `forwardRef`); contexto se lê com `use()`.
  _doc-lib/shadcn.md#docs/react-19.
- Lógica reutilizável sobe para hook; HOC e componente-container não entram em código novo. A tela
  recebe dado por hook (`useTeamPermission`) ou por `getRouteApi()`, não por wrapper que só busca
  (`solid.md` §4).
- Hook que devolve coisas com dependências independentes se parte em dois (quem lê `isMobile` não
  re-renderiza por `width`).
- Props `Readonly<...>` e retorno `React.JSX.Element` explícito em componente de `common/` e de
  `-components/`; hook e função exportada com retorno anotado (`typescript.md` §7)
  *(opinião da casa)*.
- Elemento clicável que não é `<button>`: §10.2.

### 6.4 Referência visual e componente de terceiro *(opinião da casa sobre a doc)*

Duas coisas diferentes, com regra diferente.

**Referência (só olhar)**: Godly (`godly.website`) e Awwwards (`awwwards.com`) para direção e nível
de acabamento; Motionsites (`motionsites.com`) para landing animada. Entram **antes** do layout, na
direção visual (`design-taste-frontend`, `design-dna`), e o que se escolheu vai para
`docs/DESIGN.md` §12 com o porquê. O prompt pronto do Motionsites é ponto de partida para a
conversa, não especificação: o resultado passa pelos tokens do projeto e por esta régua. Marca,
logo, texto e imagem do site de referência nunca entram.

**Componente (copia e cola)**: 21st.dev e React Bits (`reactbits.dev`) entregam código que vira
arquivo do projeto. O 21st.dev é registry comunitário instalável por `shadcn add <url>`, e registry
comunitário "não passa por nenhuma curadoria do shadcn" (_doc-lib/shadcn.md#docs/directory): é
código de terceiro e se revisa **antes** de instalar. Ao trazer:

- **Só vitrine e efeito de marketing** (hero, fundo, texto animado, seção de landing). Formulário,
  tabela, Dialog, menu e qualquer primitivo interativo vêm do shadcn sobre Base UI (§6, §6.2), nunca
  de bloco copiado, porque teclado, foco e `role` já estão resolvidos lá.
- **Primitivo de Radix no código copiado** é trocado pelo equivalente do Base UI ou o bloco não
  entra (`SKILLS-MAP.md`, "Quando a skill contradiz a casa").
- **Dependência nova** que o bloco puxa (GSAP, Three.js, OGL) só entra com
  `_doc-lib/<lib>.md` e linha em `docs/DECISIONS.md` (`AGENTS.md`, "Autoridade"). Sem isso, a versão em CSS
  do bloco (o React Bits oferece variante CSS e Tailwind) ou nada. Motion já tem entrada
  (`_doc-lib/motion.md`): `motion/react` com `LazyMotion` + `m`, e Motion+ só com decisão do projeto.
- **Licença conferida** e anotada no topo do arquivo: React Bits é MIT com Commons Clause, 21st.dev
  varia por autor. Sem licença declarada, o bloco não entra.
- **O arquivo passa pela régua inteira**: TypeScript sem `any`/`as`/`!`, sem ternário, cores e
  raios só por token (§6, "Tokens e tema"), texto por chave de i18n (`i18n.md`),
  `prefers-reduced-motion` por componente (§10), e o lugar na árvore de `architecture.md`
  (`components/common/` só se duas rotas usam; senão `-components/` da rota).
- **Efeito pesado** (WebGL, canvas, shader) entra com `lazy` e fora do caminho crítico (§9.4, §9.8):
  fundo animado não pode piorar o LCP da página.

### 6.5 Uso estrito do kit *(opinião da casa sobre a doc, `DECISIONS.md` #300)*

Toda rota (com as `-components/` dela), todo `components/common/`, todo Sheet e todo Dialog monta
a tela com o componente de `components/ui/`. Elemento interativo cru (`<button>`, `<input>`,
`<select>`, `<textarea>`, `<table>`, `<dialog>`) não entra onde o registry tem o equivalente: o
`Button`, o `Input`, o `Select` e o resto já trazem o foco, o teclado, o estado e o alvo de toque
que o elemento cru deixa para cada tela refazer (§10.2; _doc-lib/shadcn.md#docs/components,
https://ui.shadcn.com/docs/components, aberta). A doc mostra o catálogo, mas não proíbe o elemento
cru; a proibição é da casa.

Só três exceções, e cada uma leva comentário de "por quê" na linha:

- o HTML que sai do Markdown dentro do componente de texto rico (`components/common/rich-text/`,
  estilizado por `prose`), que não é JSX escrito à mão;
- o `<input type="file">` escondido atrás de um `Button`, que abre o seletor de arquivo;
- o elemento que o registry não tem (a tabela de "Componentes do shadcn" do `docs/DESIGN.md` diz
  qual foi procurado).

**Cobrança**: `no-restricted-syntax` sobre `JSXOpeningElement` nos arquivos de `src/routes/**` e
`src/components/common/**`, com o seletor
`JSXOpeningElement[name.name=/^(button|input|select|textarea|table|dialog)$/]` e a mensagem
apontando o componente de `ui/` (_doc-lib/eslint.md#docs/latest/rules/no-restricted-syntax,
https://eslint.org/docs/latest/rules/no-restricted-syntax, aberta; seletor de atributo com regex em
_doc-lib/eslint.md#docs/latest/extend/selectors, https://eslint.org/docs/latest/extend/selectors,
aberta). `components/ui/` fica fora do `files`, porque é lá que o elemento cru mora. A exceção é
`// eslint-disable-next-line no-restricted-syntax -- <motivo>`, e o `require-description` de
`tooling.md` §4.1 já reprova a desativação sem motivo. O bloco do frontend repete o seletor de
`new` da §4.1 ao lado deste: quando dois objetos de configuração casam o mesmo arquivo, o de baixo
substitui as opções da regra em vez de somar (_doc-lib/eslint.md#docs/latest/use/configure/configuration-files,
https://eslint.org/docs/latest/use/configure/configuration-files, aberta, "Cascading Configuration
Objects"). A configuração pronta ainda não entrou em `tooling.md` §4.2: está como pendência em
`CHECKLIST.md`, até rodar num projeto.

### 6.6 Código exibido ao usuário *(`DECISIONS.md` #301)*

Código que o usuário lê (aula, documentação, post de blog) sai do `CodeBlock` do shadcn
(_doc-lib/shadcn.md#code-block, https://ui.shadcn.com/docs/components/base/code-block, aberta):

- **Cabeçalho** com `CodeBlockTitle` dizendo a linguagem ou o nome do arquivo.
- **Copiar** pelo `CodeBlockCopyButton`, com o `value` do código inteiro.
- **Número de linha** (`lineNumbers` no `CodeBlockContent`) em código, que a doc não copia junto
  com a seleção; **comando e saída de terminal** sem número, com título de terminal e a linguagem
  `"ansi"` quando a saída tem cor.
- **Realce sem pesar no cliente.** A doc tem dois caminhos: `highlightCode`, assíncrono, para o
  servidor, que deixa o Shiki fora do bundle; e o hook `useHighlightedCode`, que carrega cada
  linguagem no primeiro uso. A doc mostra o `highlightCode` dentro de Server Component, e RSC não
  entra na casa (§9.2). No TanStack Start o equivalente é uma `createServerFn` chamada pelo
  `loader` que devolve os tokens (texto e estilo de cada pedaço, que atravessam a rede) e não nó
  React, que não atravessa; o cliente monta o `CodeBlockLine` com eles
  (_doc-lib/tanstack-start.md#guide/server-functions, #guide/rendering-markdown). Essa adaptação é
  opinião da casa: a doc não cobre o Start. Onde o código só existe no cliente (editor, streaming), vale o hook, e a lista
  `languages` de `lib/highlighter.tsx` fica só com as linguagens que o projeto exibe.
- **Um highlighter só**: o `lib/highlighter.tsx` que o registry instala junto do `code-block`, sobre
  Shiki (`tooling.md` §0.1). Texto rico com bloco de código usa o mesmo, nunca um segundo
  realçador.
- **Ícone** da biblioteca do `components.json` (`iconLibrary`, `tooling.md` §0.1). Arquivo do
  registry que chega com ícone de outra biblioteca é trocado, com a linha marcada `// casa:` (§6).
- **Rótulos pelo i18n**: "Copiar", "Copiado", título de terminal e o `aria-label` de cada ação
  saem de `m.*()` (`i18n.md`).
- **Código inline sem crase na tela** (`DECISIONS.md` #427). O `@tailwindcss/typography` põe uma
  crase em `::before` e outra em `::after` de todo `code` fora de `pre`, e o leitor via `` `tsx` ``
  como se a crase fizesse parte do comando. Em `styles.css`, `.prose :where(code):not(:where(pre
  code))::before, ::after { content: none }`, e o fundo do `code` (token `--muted`) marca o trecho
  (_doc-lib/tailwindcss.md#typography-plugin, https://github.com/tailwindlabs/tailwindcss-typography,
  "Undoing typography styles").
- **Texto curto de conteúdo fora do texto rico** (pergunta e alternativa de quiz, rótulo vindo de
  frontmatter) passa por um `InlineCode` de `components/common/`: só o trecho entre crases vira
  `<code>`, o resto continua texto, crase sem par fica como está, e nada vira HTML. Nunca
  `dangerouslySetInnerHTML` nem um segundo parser de markdown para isso *(opinião da casa)*.

### 6.7 Lista de passos com status: `Trace` *(`DECISIONS.md` #302)*

Lista de passos em que cada item tem estado usa o `Trace` (_doc-lib/shadcn.md#trace,
https://ui.shadcn.com/docs/components/base/trace, aberta): o resultado por item de um quiz ou de um
formulário, um progresso em sequência (aulas de um curso, etapas de um protocolo), uma linha do
tempo. Uma linha é `TraceLine` com `TraceIcon` e `TraceTitle`; o detalhe abre por
`TraceCollapsible`. O `status` só tem `running`, `error` e `pending`: o passo concluído é a linha sem
`status`, e o ícone diz o resto.

- **Só onde não perde informação nem piora no celular.** O `TraceTitle` é uma linha que trunca: item
  com enunciado longo, mais de um valor por linha ou comparação entre colunas continua em tabela,
  lista ou card *(opinião da casa)*.
- **O estado vai no título**, porque cor e movimento não chegam a todo mundo: "Questão 3: errada",
  não só o ícone vermelho. O `TraceIcon` sai do leitor de tela, então o título é o nome acessível
  (doc, "Accessibility"). Título e descrição saem de `m.*()`.
- Os usos de IA do `Trace` (raciocínio, chamada de ferramenta, fontes) e os componentes de conversa
  do registry (`bubble`, `message`, `message-scroller`) ficam como "não se aplica" na tabela do
  `docs/DESIGN.md` até o projeto ter chat.

---

## 7. Nomenclatura

| Tipo | Forma | Exemplo |
|---|---|---|
| Componente | PascalCase, arquivo kebab | `TeamTable` em `team-table.tsx` |
| Props de componente | `<Componente>Props`, `Readonly` | `TeamTableProps` |
| Hook | `use-kebab-case.ts`, export `useCamelCase` | `use-team-permission.ts` |
| Hook de uma rota só | `-use-<nome>.ts` ao lado da rota | `teams/-use-team-filters.ts` |
| Rota config / stub | `index.tsx` / `index.lazy.tsx` | `teams/index.lazy.tsx` |
| Search da rota | `-search.ts` | `teams/-search.ts` |
| Peças do recurso | molde de §1.2 | `teams/-components/row-actions.tsx` |
| Parte de compound | `<nome>-<parte>.tsx`, export `<Nome><Parte>` | `user-card-avatar.tsx` → `UserCardAvatar` |
| Chaves | `queryKeys.<módulo>.<recurso>.<forma>` | `queryKeys.administrator.posts.detail(id)` |
| `queryOptions` | plural para lista, singular para detalhe | `postsQueryOptions(search)`, `postQueryOptions(id)` |
| Hook de mutation | `use<Recurso><Ação>Mutation` | `usePostArchiveMutation` |
| Hook de combobox | `use-<entidade>-read-paginated-infinite.ts` | `use-team-read-paginated-infinite.ts` |
| Módulo de `lib/` | `<tema>.ts`, nome do domínio | `lib/list-search.ts`, `lib/page-head.ts` |
| Teste Vitest | `<x>.test.ts(x)` ao lado | `lib/bulk.test.ts` |
| Teste E2E | `e2e/<fluxo>.spec.ts` | `e2e/post-publish.spec.ts` |
| `data-testid` | kebab, só onde um E2E lê (§11) | `data-testid="posts-row-actions"` |
| Tipo | PascalCase, sem prefixo | `AdministratorPostShowResponse`, `PostStatus` |
| Enum | trinca objeto/tipo/array de `@<projeto>/shared` (`typescript.md` §4) | `POST_STATUS`, `PostStatus`, `POST_STATUSES` |
| Chave de mensagem | `snake_case` prefixada pela área (`i18n.md` §2) | `posts_empty_title` |

Prefixo em nome de tipo e de enum: `typescript.md` §4. Arquivo "utilitário" genérico (`utils.ts`,
`helpers.ts`, `handle-*.ts`) não existe: função tem casa (`typescript.md` §6).

Regras de código (sem ternário, sem `any`, sem `as` exceto `as const`, sem `!`, `type` nunca
`interface`, `Merge` no lugar de `&`, lookup object, sem verificação de tipo dentro da função) são
as de `typescript.md`; este documento não as repete.

---

## 8. Kit comum *(opinião da casa)*

Todo frontend da casa tem estas peças, com o mesmo nome e a mesma API, e elas são o mesmo arquivo em
todo projeto: vêm de `_templates/code/` pelo sync e não se editam no projeto (`DECISIONS.md` #343;
a API composta de cada peça está em `_standards/_map/canon-2026-11/SINTESE/KIT.md` §2). Peça nova do
kit nasce compound (§6.1), entra no upstream e é citada no `docs/DESIGN.md` §7 (Componentes) do projeto.
A lista é fechada:

| Onde | Peça | Para quê |
|---|---|---|
| `components/common/page-shell/` | casca de tela: título, ações, corpo, breadcrumb, esqueleto | toda tela do painel |
| `components/common/list-shell/` | casca de listagem: cabeçalho, filtro, corpo, rodapé | toda lista do painel |
| `components/common/form-shell/` | casca de formulário: título, corpo, ações; `FormShellContent` é `<form method="post">` com `HydratedFieldset` | submit travado por upload em voo (§4) |
| `components/common/submit-button/` | botão de envio com estado de envio | sem duplo envio (§10.1) |
| `components/common/table/` | data table: `useTable({ rows, columns, getRowId, persistKey, actions, selectable })`, busca (`TableSearch`), paginação, colunas visíveis, redimensionar, esqueleto, virtualização opcional (§9.9) | toda listagem; layout persistido validado pelo schema de `shared/` |
| `components/common/filters/` | seções de filtro (toggle, segmentado, chips, data, multisseleção) e o `FiltersSheet` | filtro de lista igual em toda tela |
| `components/common/row-actions/` | menu de ações por linha | ação de linha igual em toda tabela |
| `components/common/bulk-archive/` | arquivar, restaurar, remover em massa | detalhe e lista não reescrevem o ciclo |
| `components/common/confirm-dialog/` | confirmação de ação destrutiva (AlertDialog), com `confirm-dialog-handle.ts` | §10.6 |
| `components/common/empty-state/` | estado vazio por motivo, sobre `ui/empty` | §10.1; _doc-lib/shadcn.md#empty |
| `components/common/route-status/` | `NotFoundPage`, `RouteError`, `RoutePending`, `AccessDenied`, `QueryBoundary` | §5 |
| `components/common/option-combobox/` | combobox de opções (+ `toOptions`) | combobox local e paginado |
| `components/common/date-picker/` | data e intervalo, valor no formato da API (Luxon) | campo de data |
| `components/common/field/` | campos do `AppField`: texto, área de texto, senha, número, seleção, combobox, data, switch, checkbox, imagem, arquivos, texto rico e máscara (`FieldMask`) | §4 |
| `components/common/hydrated-fieldset/` | trava os campos até a hidratação | formulário antes do JavaScript (§4) |
| `components/common/input-password/` | senha com mostrar/ocultar | formulário de sessão |
| `components/common/picture/` | imagem com dimensão, `alt` e carregamento por posição | §9.6 |
| `components/common/maiyu-credit/` | crédito do rodapé: logo da Maiyu (`src/assets/maiyu.png`) + "Desenvolvido por Maiyu", com `Maiyu` em link para `https://maiyu.com.br` | abaixo |
| `components/common/brand-mark/` | marca do projeto, pelo SVG de `assets/brand/` | cabeçalho e rodapé |
| `components/common/theme/` | provider, contexto, alternador de tema e o toaster | §6 |
| `components/common/locale-switcher/` | troca de idioma (nome único) | `i18n.md` §2 |
| `components/common/image-field/`, `multi-file-upload/` | campo que sobe o arquivo na escolha; I/O por prop | registra no `uploading-context` |
| `components/common/uploading-context/` | registro de upload em voo (`UploadingProvider`, `useRegisterUpload`, `useIsUploading`) | §4 |
| `components/common/rich-editor/` | editor de texto rico, carregado sob demanda (§9.4); grava o JSON do Tiptap | _doc-lib/tiptap.md |
| `components/common/rich-text/` | leitura de conteúdo rico (JSON do editor ou Markdown de fora via `MarkdownManager.parse`) por `renderToReactElement` do `@tiptap/static-renderer`, sem editor e sem `innerHTML` | _doc-lib/tiptap.md#api/utilities/static-renderer |
| `lib/cn.ts` | `cn()` | §6 |
| `lib/labels.ts` | rótulo e variante visual de enum (do projeto, não do kit) | abaixo |
| `lib/i18n.ts` | `localized()`, formatador de data (Luxon) e de número e moeda (`Intl`) | `i18n.md` §2, §3.5 |
| `lib/form-errors.ts`, `lib/form-a11y.ts` | `applyHTTPErrorToForm`; `invalidProps`, `errorId` | §4, §10.3 |
| `lib/list-search.ts`, `lib/redirect-search.ts` | fábrica de search de lista; `validateRedirectSearch` | §2.1, §3.5 |
| `lib/page-head.ts`, `lib/load-or-not-found.ts` | `pageHead()`; `loadOrNotFound` | §9.7, §5 |
| `lib/local-store.ts` | `localStorage` versionado e validado | §2 |
| `lib/bulk.ts` | ação em massa sem endpoint dedicado | abaixo |
| `lib/chunking.ts`, `upload-transport.ts`, `upload-resume.ts` | upload em partes, retomável | arquivo grande sem refazer do zero |
| `lib/mask.ts` | aliases de máscara do `FieldMask` | §4 |

**Regra de import do kit** (`DECISIONS.md` #343): a peça importa só `#/components/ui/*`, outra peça
do kit pelo arquivo exato (nunca a pasta), os arquivos de `lib/` do kit, `m.kit_*()` de
`#/paraglide/messages` e, de `@<projeto>/shared`, só `merge.ts`, `rich-text-schema.ts`,
`table-layout.ts`, `enums/storage-mimetype.ts` e `enums/locale.ts`. I/O do projeto (mutation, upload,
rota) entra por prop; peça que importa `mutations/*` ou `#/lib/labels` não é do kit. Recurso da peça
liga por parte presente ou por prop de dado ou variante (`cva`), nunca por booleana de esconder ou de
layout. Só o tema (`styles.css`, `assets/brand/`) é do projeto.

**Crédito no rodapé** *(opinião da casa, `DECISIONS.md` #277)*: todo rodapé (o do site público e, onde
existir, o do painel e o da tela de sessão) mostra só `<MaiyuCredit />`, igual em todo projeto: a logo
decorativa (`alt=""`, 20 px, por `Picture`) e a frase "Desenvolvido por Maiyu" (mensagem
`kit_maiyu_credit`, `{#link}Maiyu{/link}` no catálogo de cada idioma), link com `target="_blank"` e
`rel="noopener noreferrer"`. Sem slogan, ano, "todos os direitos" ou outra frase de autoria; a cor vem
de quem usa (`className`). Montar o crédito à mão na tela é desvio.

**Link em conteúdo rico**: `href` só `https:`, `http:` e `mailto:`, conferido no validator do backend ao
gravar o JSON. O React 19 bloqueia `javascript:`, mas não `data:` (skill `security-audit`, CLIENT-SIDE.md).

**Conteúdo rico é só Tiptap** *(doc do Tiptap; `DECISIONS.md` #196)*: editar, ler e converter
Markdown usam as peças nativas do Tiptap, e nenhuma outra lib de Markdown entra (`react-markdown`,
`remark-*`, `rehype-*`, `marked` direto, `markdown-it` saem).

- **Gravar**: o editor grava JSON (`editor.getJSON()`).
- **Typography só com `emDash: false`**: a extensão troca `--` por travessão no texto do usuário, o
  que a régua não aceita em texto (`i18n.md` §5); as outras trocas (reticências, aspas curvas)
  ficam (_doc-lib/tiptap.md, "Catálogo: extensões", linha Typography;
  https://tiptap.dev/docs/editor/extensions/functionality/typography, "Disabling rules").
- **Ler**: o mesmo JSON vai para `renderToReactElement` (`@tiptap/static-renderer`), que a doc chama
  de caminho preferido para leitura em React: devolve elemento React, sem `innerHTML`
  (_doc-lib/tiptap.md#api/utilities/static-renderer).
- **Markdown que vem de fora** (resposta de IA, importação, conteúdo legado): `MarkdownManager.parse()`
  do `@tiptap/markdown` converte em JSON **sem editor** e o JSON segue pelo mesmo renderizador
  (https://tiptap.dev/docs/editor/markdown/api/markdown-manager). HTML embutido no Markdown só vira nó
  se uma extensão registrada o reconhece no `parseHTML`: o schema das extensões é a lista de
  permissão, no lugar de um schema de sanitização mantido à mão. Isso depende do `DOMParser`: no servidor (SSR) o
  `@tiptap/markdown@3.32` devolve todo HTML embutido como texto literal (código instalado,
  `parseHTMLToken`). Por isso a conversão roda **num lado só** (no backend, ao gravar, ou só no
  cliente) e a tela recebe JSON; converter no SSR e de novo no cliente quebra a hidratação.
- **Exportar Markdown**: `renderToMarkdown` do static renderer.
- Um componente só em `components/common/rich-text/` recebe JSON ou Markdown e devolve o elemento,
  com a mesma lista de extensões do editor.
- Custo aceito: o `@tiptap/markdown` é *early release* na doc (https://tiptap.dev/docs/editor/markdown);
  versão fixada e teste de ida e volta (Markdown → JSON → Markdown) cobrem a mudança de API.

**Ação em massa sem endpoint dedicado**: `Promise.allSettled` sobre as chamadas unitárias,
devolvendo `{ done, failed }`, e a mensagem relata "N de M". Nunca `Promise.all`: a primeira falha
esconde o que já foi feito.

**`lib/labels.ts`**: o enum vem de `@<projeto>/shared` (`architecture.md` §9); o rótulo é uma
função por valor que chama `m.*()` (é a função que faz o rótulo mudar com o idioma, `i18n.md` §2),
e a variante visual sai do `cva`. `satisfies Record<PostStatus, ...>` sobre o objeto literal cobra
no typecheck os dois sentidos: valor sem rótulo e rótulo sem valor. Nunca `if`/`switch` de rótulo
na tela.

```ts
// certo: lib/labels.ts
import { type PostStatus } from '@<projeto>/shared'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export const POST_STATUS_LABELS = {
  DRAFT: () => m.post_status_draft(),
  PUBLISHED: () => m.post_status_published(),
} satisfies Record<PostStatus, () => string>

export const POST_STATUS_VARIANTS = {
  DRAFT: 'outline',
  PUBLISHED: 'default',
} satisfies Record<PostStatus, BadgeVariant>
```

- Plural e concordância (`1 post`, `2 posts`) saem da própria mensagem (variante com seletor
  `plural`, que usa `Intl.PluralRules` e devolve categoria, `one`/`other`, nunca número;
  _doc-lib/paraglide.md#/variants), nunca de `if` por tela nem de ternário.
- `lib/<tema>.ts` com lógica não trivial tem `lib/<tema>.test.ts` ao lado (§11).

---

## 9. Render, desempenho e SEO

### 9.1 Render do React

- **React Compiler ligado** (`babel-plugin-react-compiler` no `vite.config.ts`; regras do
  compiler no `eslint-plugin-react-hooks`, `tooling.md` §4). Sem `useMemo`/`useCallback`/`memo`
  manual por padrão; memo manual só depois de medir, com comentário do porquê. Componente que só
  recebe objetos da tabela (`row`, `cell`) lê estado por `table.Subscribe`.
  _doc-lib/tanstack-table.md#framework/react/guide/react-compiler (página oficial do React não
  conferida).
- Atualização não urgente em `startTransition`; valor que alimenta render caro em
  `useDeferredValue`; pendência por `isPending`, não por `useState` de loading.
- **Condicional de JSX com expressão booleana explícita**: `{count > 0 && <Badge />}`,
  `{items.length > 0 && <List />}`, nunca o valor cru (`{count && ...}` renderiza `0`). Dois ramos
  são o par `{c && <A />}{!c && <B />}` ou lookup; ternário é erro de lint (`no-ternary`).
- Painel caro que alterna visível/oculto e precisa manter estado pode usar `<Activity mode>`, com
  `mode` por lookup.

### 9.2 SSR por grupo de rota

| Grupo | `ssr` | Por quê |
|---|---|---|
| `_public/` | padrão (SSR completo, não declara) | o HTML do servidor é o único que crawler e preview de link leem |
| `_authentication/` | padrão | formulário funciona antes da hidratação (§4, `method="post"`) |
| `_private/` | `'data-only'` quando o cookie de sessão chega ao SSR (mesmo domínio-pai); `false` quando não chega | `beforeLoad` e `loader` seguem no servidor e o cache chega hidratado, sem o servidor renderizar tabela, editor e gráfico que ninguém indexa |

_doc-lib/tanstack-start.md#guide/selective-ssr. A herança vale para baixo e só fica mais
restritiva (página oficial não conferida). Projeto que já hidrata o painel mede antes de trocar
(o primeiro quadro passa a ser o `pendingComponent`).

- Componente que depende de API só de navegador (mapa, canvas, câmera, leitor de QR) vai em rota
  `ssr: false` ou atrás de `ClientOnly`; nunca `typeof window` no corpo do componente.
- SPA mode não é padrão da casa: todo projeto tem área pública. _doc-lib/tanstack-start.md#guide/spa-mode.
- Página institucional que só muda por deploy (sobre, termos) pode ser pré-renderizada com a lista de
  caminhos explícita, nos três prefixos de idioma; nunca página que lê cookie. No build com Nitro a
  lista vai em `nitro.prerender.routes` (_doc-lib/nitro.md#docs/prerendering): o `prerender` do Start
  (_doc-lib/tanstack-start.md#guide/static-prerendering) grava os arquivos depois do manifesto do
  Nitro, e o handler estático não os serve (medido no jhollyfer.com.br, #382).
- RSC não entra. Biblioteca pesada só de servidor (markdown, PDF) roda em `createServerFn` chamada
  pelo `loader`, e o módulo de servidor só é importado dentro do handler.
  _doc-lib/tanstack-start.md#guide/server-components, #guide/import-protection.

### 9.3 Dados e streaming

- Dado do `head()` e do elemento de LCP é aguardado no `loader` (§2.2); LCP nunca nasce de fetch
  no cliente.
- O lento abaixo da dobra fica fora do `loader`: o componente lê com `useSuspenseQuery` dentro de
  `<Suspense>` próprio, com fallback de altura fixa, e a integração do Query com o router transmite
  o resultado no stream (página oficial não conferida). `Await` com promessa sem `await` só onde
  não há Query. _doc-lib/tanstack-router.md#guide/deferred-data-loading;
  _doc-lib/tanstack-start.md#guide/tanstack-query.
- Proxy e CDN não podem bufferizar o HTML em stream (mesma família do gzip que quebra SSE):
  conferir com `curl -N` que o primeiro byte chega antes do fim.

### 9.4 Divisão de código

- `autoCodeSplitting` é o padrão do Start: não se desliga; o par `index`/`index.lazy` é convenção de forma (§1.3).
  _doc-lib/tanstack-router.md#guide/automatic-code-splitting.
- Componente pesado fora do primeiro quadro (editor rico, gráfico, mapa, upload multipart) é
  `lazy` + `<Suspense>`, carregado no gesto ou na visibilidade, com fallback da mesma altura:

```tsx
// routes/_private/posts/-components/form-fields.tsx
const RichEditor = lazy(async () => {
  const module = await import('#/components/common/rich-editor')
  return { default: module.RichEditor }
})

<Suspense fallback={<Skeleton className="h-64" />}>
  <RichEditor name="body" />
</Suspense>
```

- **Overlay do Base UI aberto por botão do shell** (Sheet da gaveta, Dialog, Drawer): o botão vai no
  pacote inicial e o painel em `lazy` + `<Suspense>`, com `open` controlado, `finalFocus` no botão e o
  `import()` aquecido em hover, foco e toque. O `Dialog` do Base UI pesa uns 59 KB brutos; no
  jhollyfer.com.br o JS comum da primeira carga caiu de 216,1 para 168,8 KB gzip, abaixo da meta do
  §9.10, mantendo foco preso, Escape que devolve o foco e nenhum diálogo no DOM antes do gesto.
  A peça `SheetOnDemand` do kit (botão, `loadPanel` e `returnFocusTo` por prop) vem na leva 9.
- `import()` dinâmico por mapa de funções literais, nunca caminho em variável:
  `const CHART_MODULES = { bar: () => import('./bar-chart') } as const`.
- Sem `manualChunks`/`advancedChunks` por padrão: chunk manual só com medida antes/depois e
  `check-chunk-cycles` verde (§9.10).
- SDK de terceiro não crítico (analytics, Sentry de navegador, chat) entra por `import()` depois
  da hidratação e só nas rotas que usam; script externo por `head().scripts` com `defer`, nunca
  `<script>` síncrono no `<head>`. _doc-lib/tanstack-start.md#guide/observability.
- Antes de instalar dependência pesada, o nativo (`fetch`, `Intl`, `structuredClone`,
  `crypto.randomUUID`) e a política de `tooling.md` §0.

### 9.5 Preload

- Rota e dado: configuração do router (§1.4).
- Navegação que não é `<Link>` (clique na linha, card) antecipa o dado com
  `queryClient.query({ ...postQueryOptions(id), staleTime: 'static' })` em `onPointerEnter` e
  `onFocus`. _doc-lib/tanstack-query.md#guides/prefetching.
- `<link rel="preload">` por `head().links` só para a imagem de LCP e a fonte principal (fonte com
  `crossorigin` e `type="font/woff2"`); nunca `modulepreload` à mão.
- `preconnect` para a origem da API e do storage de mídia no `head()` de `__root.tsx`, montado do
  `env.ts`.

### 9.6 Imagens, fontes e assets

- Toda `<img>` tem `width`/`height` (ou `aspect-*`) e `alt` (§10.4). A posição decide o
  carregamento por lookup, na peça `picture/` do kit:

```tsx
const IMAGE_LOADING = {
  lcp: { loading: 'eager', fetchPriority: 'high' },
  fold: { loading: 'lazy', fetchPriority: 'auto' },
} as const

<img src={post.coverUrl} alt={post.title} width={1200} height={630} decoding="async" {...IMAGE_LOADING[placement]} />
```

- Imagem de LCP nunca é `lazy`; abaixo da dobra, sempre. AVIF/WebP com `srcset`/`sizes`.
- Fonte auto-hospedada (woff2, subconjunto latino), importada para ganhar hash; nunca CSS de fonte
  de terceiro no caminho crítico. `font-display: swap` com métrica de fallback ajustada
  (`size-adjust`, `ascent-override`) no `@theme`.
- `public/` só para nome estável (`favicon.ico`, `manifest.json`, ícones do manifest); todo o resto
  se importa de `src/assets/`. _doc-lib/vitejs.md#assets.

### 9.7 Head, SEO e idiomas

Toda rota pública monta o `head` por `pageHead()` de `lib/page-head.ts`, pelo mecanismo oficial
de `head()`/`loaderData` (_doc-lib/tanstack-router.md#guide/document-head-management;
_doc-lib/tanstack-start.md#guide/seo). O formato é da casa (`DECISIONS.md` #47):

- título com o sufixo do site e descrição, por `m.*()`; título e descrição únicos por página. O
  separador é `|` (`<página> | <site>`), decidido para todo projeto: nada de `·`, `-` ou `—`;
- **canonical** absoluto: a URL do idioma atual sem query string, exceto o parâmetro de página;
  filtro e ordenação nunca geram canonical próprio;
- **hreflang** recíproco para `pt-BR`, `es` e `en`, mais `x-default` (a URL de `pt-BR`), pelo
  `localizeUrl(canonical, { locale }).href` do Paraglide: a função recebe URL absoluta (string ou
  `URL`) e devolve sempre `URL` absoluta, por isso o `.href` (_doc-lib/paraglide.md#/runtime;
  `i18n.md` §2);
- **barra no fim**: nenhuma URL pública termina em barra (`https://x.com/pt-br/tracks`,
  `https://x.com/pt-br`, `https://x.com/es`): todo idioma tem prefixo (#384), e a raiz exata de
  `urlPatterns` gera a raiz do idioma sem barra (_doc-lib/paraglide.md#/i18n-routing; `DECISIONS.md`
  #306). O `x-default` aponta para `/pt-br`. Canonical,
  hreflang e sitemap saem da mesma função, com teste da raiz nos três idiomas: no academy, a
  função tirava a barra de tudo, e o `hreflang` da raiz divergia do endereço que o navegador e o
  buscador leem;
- **Open Graph**: `og:title`, `og:description`, `og:type`, `og:image`, `og:url`, `og:locale`, e o
  cartão `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`. `pageHead` aceita
  `image` (caminho ou URL absoluta; sem ela vale `assets/brand/logo-512.png`, que o tema entrega,
  `KIT.md` §3.4) e `type` (`article` em notícia e post, `website` no resto) por página;
- **JSON-LD** por `head().scripts` com `type: 'application/ld+json'`, com `<` escapado
  (`JSON.stringify(data).replaceAll('<', '\\u003c')`): `Organization` na raiz, `BreadcrumbList`
  em detalhe, e o tipo do domínio (`Product`, `Course`, `Event`, `NewsArticle`) a partir do
  `loaderData` (formato de `scripts`: página oficial não conferida);
- `robots: noindex, nofollow` em `_private/`, `_authentication/` e no 404; ambiente que não é
  produção responde `X-Robots-Tag: noindex, nofollow` em toda resposta, posto pelo `server.ts`
  quando `SITE_ENV` lida no servidor não é `production` (`DECISIONS.md` #356), nunca por
  `import.meta.env.PROD`, que é igual em staging e produção.

Mais:

- `<html lang>` no `shellComponent` de `__root.tsx`: regra em `i18n.md` §2.
  _doc-lib/tanstack-router.md#guide/internationalization-i18n.
- Recurso inexistente responde 404 de verdade (§5); slug público é estável, e trocar slug exige
  redirect 301 no backend.
- **`sitemap.xml` e `robots.txt` são rotas de servidor** (`src/routes/sitemap[.]xml.ts`,
  `robots[.]txt.ts`), não arquivos de `public/`: a URL absoluta e o `Disallow: /` de staging
  dependem do ambiente. Sitemap só com URL canônica e indexável, `lastmod` do `updatedAt`, `priority`
  por entrada (início 1, listas 0.8, detalhes 0.6), uma
  entrada por idioma com `xhtml:link` de `hreflang`, `Cache-Control: public, max-age=3600`, cada
  fonte num `try` próprio; acima de 50 mil URLs, sitemap index. A lógica pura mora em
  `lib/sitemap.ts`, com teste. _doc-lib/tanstack-start.md#guide/server-routes.

### 9.8 Core Web Vitals e entrega

- Metas no p75 de campo, mobile *(opinião da casa)*: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1,
  TTFB ≤ 0,8 s. Medida de campo por `web-vitals` é opcional (sem `_doc-lib`).
- **CLS**: espaço reservado sempre (imagem, embed, fallback de `Suspense`, `pendingComponent`);
  conteúdo novo nunca empurra o de cima (toast em camada).
- **INP**: busca aplica por Enter ou lupa (`TableSearch` do kit); filtro de controle (toggle, chip)
  aplica na hora; debounce só no combobox, no valor da chave (§2.1, `DECISIONS.md` #347); atualização pesada em transição (§9.1);
  laço longo cede a vez (`scheduler.yield()` com recuo para `setTimeout`).
- **Cache**: asset com hash `public, max-age=31536000, immutable`; HTML `no-cache`; resposta que é
  igual para todo visitante pode ter `public, s-maxage=<n>, stale-while-revalidate=<n>`; HTML ou
  API que varia por cookie é `private, no-store`, sempre. Por `headers()` da rota ou `routeRules`
  do Nitro. _doc-lib/tanstack-start.md#guide/isr, #guide/production-checklist; _doc-lib/nitro.md#config.
- Compressão numa camada só, no proxy, excluindo `text/event-stream`; sem plugin de compressão no
  build.
- Sourcemap de produção nunca publicado: `build.sourcemap: 'hidden'` quando a observabilidade
  precisa, enviado ao coletor e fora de `.output/public`. _doc-lib/vitejs.md#build.
- Early Hints (103) fica por último, e só depois de `curl` provar que o 103 atravessa o proxy.
  _doc-lib/tanstack-start.md#guide/early-hints.

### 9.9 Virtualização

Paginação de servidor é o padrão. Virtualizar só lista longa onde a paginação não serve (planilha,
combobox com milhares de opções, log), com `@tanstack/react-virtual`, nunca `react-window`. O
índice virtual indexa `table.getRowModel().rows`; lista virtualizada mantém rolagem por teclado e
`aria-rowcount`/`aria-rowindex`. Lista estática longa da vitrine tenta `content-visibility: auto`
com `contain-intrinsic-size` antes. _doc-lib/tanstack-table.md#framework/react/guide/virtualization.

### 9.10 Orçamento de bundle e ciclo de chunk

- **Ciclo de chunk**: `node scripts/check-chunk-cycles.mjs` roda depois do build (lê `.output/`)
  e é passo do portão do frontend (`tooling.md` §7). Ciclo entre chunks derruba o SSR em runtime
  com o build verde; a causa típica é import de `Route` fora do arquivo da rota (§1.3).
- **Orçamento** *(opinião da casa)*: JS inicial de rota pública ≤ 170 KB gzip; nenhum chunk acima
  de 200 KB gzip. Diagnóstico por `vite-bundle-visualizer` sob demanda, sem virar dependência.
- Projeto com vitrine pode rodar o Lighthouse na rodada antes do PR contra duas ou três URLs
  públicas (mobile, mediana de 3), pelo CLI, sem workflow (`tooling.md` §7).
- **Método de medida no laboratório** *(opinião da casa, #382)*, para comparar antes e depois de uma
  mudança, sempre na mesma máquina e no build de produção: TTFB por `curl`, 20 requisições por rota,
  mediana e p90, descartando a primeira; LCP por `PerformanceObserver` no Playwright, 5 cargas frias por
  rota nas larguras 390 e 1440, mediana; JS inicial é o que a rede baixa até o `load`, em gzip, sem o
  prefetch de link. O número vai no corpo do PR com a máquina e o que estava mockado (fonte, imagem
  externa). Laboratório compara; a meta de p75 de campo acima só se confere em produção.

---

## 10. UX e acessibilidade

Meta: WCAG 2.1 AA *(página oficial não conferida; sem `_doc-lib` de WCAG)*. Teclado, foco e
`role` de diálogo, menu, abas e popover são do Base UI; o nome acessível é sempre do projeto
(_doc-lib/base-ui.md#react/overview/accessibility). Identidade visual fica fora daqui
(`docs/DESIGN.md`).

### 10.1 Estados de tela

- Toda tela que lê dado tem **quatro estados**: carregando, vazio, erro, preenchido. Carregando é
  esqueleto com a forma do conteúdo; spinner só no botão que enviou.
- **Vazio distingue o motivo**, pela peça `components/common/empty-state/` (compound sobre
  `ui/empty`, _doc-lib/shadcn.md#empty): primeiro uso (o que vai aparecer + ação de criar), busca
  ou filtro sem resultado ("limpar filtros"), sem permissão (por quê + como obter). Nunca "Nenhum
  item" solto. O motivo é a prop `reason: 'first-use' | 'filtered' | 'trash' | 'forbidden' | 'error'`
  (`DECISIONS.md` #343).

```tsx
<EmptyState>
  <EmptyStateTitle>{m.posts_empty_title()}</EmptyStateTitle>
  <EmptyStateDescription>{m.posts_empty_description()}</EmptyStateDescription>
  <EmptyStateAction render={<Link to="/posts/new" />}>{m.posts_create()}</EmptyStateAction>
</EmptyState>
```

- **Erro** oferece a recuperação (tentar de novo, voltar, entrar de novo), pelo mapa de §5.
- **Feedback de ação**: toda mutation confirma o resultado (toast curto, sem exclamação) e o botão
  que disparou fica `disabled` com indicador enquanto voa; nunca duplo envio.
- Mudança assíncrona é anunciada: toast, validação e status em `role="status"`
  (`aria-live="polite"`); erro urgente em `role="alert"`.

### 10.2 Controles, nome e teclado

- Todo controle tem os estados default, hover, `focus-visible`, active, disabled, loading e erro;
  hover sem foco equivalente é defeito.
- **Nativo antes de ARIA**: `<button>` para ação, `<Link>` para navegação; nunca `<div onClick>`,
  nunca `<a><button>`.
- **Nome acessível**: botão só de ícone leva `aria-label` por `m.*()`; ícone decorativo
  `aria-hidden`; o nome contém o texto visível.
- **Ícone (Phosphor, `tooling.md` §0.1)**: o componente não põe `aria-hidden` nem `role`, então o
  padrão sai de um `IconContext.Provider` na raiz (`__root.tsx`) com `'aria-hidden': true`, o
  `size` e o `weight` da casa. O `value` substitui o padrão inteiro em vez de mesclar: sem `size`,
  o `<svg>` sai sem `width`/`height`. O raro ícone que carrega sentido sozinho recebe
  `aria-hidden={false}`, `role="img"` e `alt` por `m.*()`. Import pelo nome canônico `<Nome>Icon`
  (`TrashIcon`); o nome sem sufixo é `@deprecated`. `@phosphor-icons/react/ssr` não lê o
  `IconContext` e perde o `aria-hidden` comum: não se usa (TanStack Start não é RSC)
  (_doc-lib/phosphor.md, "O que muda a experiência", e _doc-lib/phosphor.md#react#props).
- **Foco visível** em todo interativo (`focus-visible:ring-*`, contraste ≥ 3:1); nunca
  `outline-none` sem substituto; ordem de foco igual à visual; sem armadilha de teclado; o foco
  volta ao gatilho quando a sobreposição fecha.
- Elemento clicável que não é `<button>`, quando inevitável, recebe `onActivateKey`
  (Enter/Espaço) junto do `onClick`, e a área sem rótulo próprio entra na allowlist de
  `label-has-associated-control` (`jsx-a11y`, `tooling.md` §4.2) em vez de ganhar `<label>` cosmético
  (`DECISIONS.md` #48).
- Alvo de toque ≥ 44×44 px, por área invisível se preciso *(opinião da casa: AA não exige)*; hover
  nunca é o único caminho para uma função; gesto (arrastar, deslizar) tem alternativa de um
  ponteiro.
- **44 px no celular vem do kit, nunca caso a caso** *(opinião da casa, `DECISIONS.md` #267)*: os
  controles de `components/ui/` (botão, campo, select, toggle, paginação, itens de menu) crescem
  abaixo de `sm` por tamanho responsivo no próprio arquivo (`h-11 sm:h-7`) e voltam ao tamanho denso
  de `sm` para cima; a tela não ajusta altura de controle. O `touch-targets.spec` (§11.2) cobra 44 px no
  projeto `mobile`. 24 px é o mínimo do WCAG 2.2 AA (2.5.8): vale só como degrau registrado no
  `docs/DESIGN.md` do projeto (por exemplo, numa vitrine que ainda não migrou), nunca como padrão.
  Variante por largura: _doc-lib/tailwindcss.md#responsive-design
  (https://tailwindcss.com/docs/responsive-design, aberta). O critério 2.5.8 do WCAG não tem entrada
  em `_doc-lib`: não coberto.
- Sessão que expira avisa e permite estender.

### 10.3 Formulário acessível

- Rótulo visível sempre, acima do campo; placeholder é exemplo, nunca rótulo.
- Erro abaixo do campo, ligado por `aria-describedby`, com `aria-invalid`; nunca só a cor. O par
  central `invalidProps(invalid, id)` + `errorId(id)` mora em `lib/form-a11y.ts`, e o `id` usa o
  `idPrefix` da casca (§4). _doc-lib/react-hook-form.md#advanced-usage#AccessibilityA11y.

```tsx
<Field data-invalid={fieldState.invalid}>
  <FieldLabel htmlFor={id}>{m.users_form_email()}</FieldLabel>
  <Input {...field} id={id} type="email" autoComplete="email" {...invalidProps(fieldState.invalid, id)} />
  <FieldError id={errorId(id)} errors={[fieldState.error]} />
</Field>
```

- No envio com erro, o foco vai ao primeiro campo inválido (`shouldFocusError`, §4).
- Atributos de entrada certos: `type` (`email`, `tel`, `url`), `inputMode`, `autoComplete`, `name`;
  `spellCheck={false}` em e-mail e código; nunca bloquear colar; input com fonte ≥ 16 px.
- Obrigatório e opcional marcados do mesmo jeito no produto inteiro; formato exigido aparece antes
  do envio (texto de ajuda), não só no erro. O digitado sobrevive ao erro.
- `Select` do Base UI sempre com `items`, para o rótulo (e não o valor cru) aparecer selecionado.
  _doc-lib/base-ui.md#react/components/select.

### 10.4 Estrutura, conteúdo e responsividade

- `<html lang>` do idioma atual (§9.7); um `<h1>` por tela, hierarquia sem pular nível; landmarks
  (`header`, `nav`, `main`, `footer`); skip link para `#main`; título por rota (`head()`); link
  ativo com `aria-current="page"`.
- Imagem com sentido tem `alt` que diz a informação (por `m.*()` ou do dado); decorativa `alt=""`.
- Contraste AA nos dois temas e em todo estado: texto 4,5:1 (inclui placeholder e ajuda), texto
  grande e componente 3:1. Cor nunca é o único sinal (erro = cor + ícone + texto).
- Celular primeiro: base sem prefixo, camadas `md:`/`lg:`, breakpoint em `--breakpoint-*`. Sem
  rolagem horizontal a 320 px, uso a 200% de zoom, nunca `user-scalable=no`/`maximum-scale=1`.
  _doc-lib/tailwindcss.md#responsive-design.
- Altura cheia com `min-h-dvh`, nunca `h-screen`; filho de flex com `min-w-0`; texto longo com
  `truncate`/`line-clamp`/`break-words`; contêiner de texto sem largura fixa (es e en são mais
  longos que pt-BR). Celular adapta, não amputa: tabela vira lista de cartões ou rola dentro do
  próprio contêiner.
- Prosa em 65 a 75 caracteres de largura; `tabular-nums` em coluna numérica; corpo ≥ 1 rem.

### 10.5 Movimento

- Movimento explica estado, relação ou feedback; tela de operação não tem coreografia de
  carregamento.
- Duração e curva são token (`--ease-*`, `--animate-*`): feedback 100 a 150 ms, estado 150 a
  300 ms, overlay 300 a 500 ms; saída mais curta que a entrada.
- Animar só `transform` e `opacity`; nunca `transition: all`; `will-change` só durante a animação.
- **`prefers-reduced-motion` tem caminho por componente**: `motion-safe:`/`motion-reduce:` tiram
  deslocamento, parallax, loop e rolagem animada e mantêm a opacidade e a cor que carregam estado.
  O "kill global" (`* { animation-duration: 0.01ms !important }`) é proibido: apaga o feedback.
  _doc-lib/tailwindcss.md#hover-focus-and-other-states.

```tsx
<PopoverPopup className="transition-[transform,opacity] motion-reduce:transition-opacity data-starting-style:opacity-0 motion-safe:data-starting-style:scale-95" />
```

- Nada pisca mais de três vezes por segundo; loop não essencial para fora da tela e pode ser
  pausado. Transição de navegação, se houver, só pela opção do router (página oficial não
  conferida).

### 10.6 Ação destrutiva

- Nunca imediata: **desfazer** (toast com ação) quando a recuperação é segura; **confirmação**
  (`ConfirmDialog`) quando é irreversível, cara ou em lote. AlertDialog não fecha por clique fora,
  fecha por Esc.
- A confirmação nomeia ação, objeto e consequência ("Remover a equipe Design?", nunca "Tem
  certeza?"); botões com verbo + objeto ("Excluir 5 posts" / "Manter"), nunca "Sim/Não/OK". O
  botão destrutivo usa a variante `destructive`; "Cancelar" nunca é `destructive`.

### 10.7 Texto de interface

Todo texto é chave de mensagem (`i18n.md`); a regra aqui é o conteúdo da chave:

- Botão diz verbo + objeto ("Salvar alterações"), nunca "OK", "Enviar", "Clique aqui"; o toast
  repete o verbo ("Publicar" → "Publicado"). Um termo por conceito no produto inteiro.
- Erro diz o que falhou, por quê (se útil) e como resolver; sem culpar, sem humor, sem código
  interno como mensagem principal.
- Carregando diz a operação ("Salvando…", reticência tipográfica).
- Caixa de frase em título e botão, nunca Title Case.
- Frase inteira por chave, com variável estruturada; nunca concatenar pedaços.
- Sem travessão em texto visível: reescrever com vírgula, dois-pontos, ponto ou parênteses.

### 10.8 Anti-padrões universais

Valem para qualquer identidade; o `docs/DESIGN.md` do projeto aponta para cá e acrescenta os dele.

- Card dentro de card, caixa dentro de caixa, card como contêiner padrão.
- Grade de cards iguais (ícone + título + texto) como estrutura da página; "métrica herói".
- Rótulo decorativo acima de título, numeração de seção "01/02/03", micro-UI falsa (pílula de
  status, "v0.6").
- Texto em gradiente, glass decorativo, neon, borda lateral colorida grossa em card ou alerta.
- Emoji ou caractere no lugar de ícone; famílias e espessuras de ícone misturadas.
- Conteúdo falso: lorem ipsum, "John Doe", "Acme", número redondo inventado, verbo-clichê.
- Toda ação como botão primário; mais de uma ação primária por área.
- Texto cinza sobre fundo colorido; seção de tema invertido no meio da página.
- `window.alert()`/`confirm()`; link para `#`; tela sem caminho de volta; 404 genérico do
  framework.
- Cursor personalizado, rolagem sequestrada, dica "role para baixo".
- Superfície do navegador sem tema (seleção, scrollbar, caret, anel de foco).

**Cara de gerador de interface** *(opinião da casa, sem página de biblioteca por trás,
`DECISIONS.md` #269)*: além da lista acima, estes sinais denunciam tela montada por IA e são desvio.
O `docs/DESIGN.md` do projeto diz o que usa no lugar, na identidade dele.

| Não fazer | Em vez disso |
|---|---|
| halo, brilho ou gradiente radial atrás de bloco | fundo liso; sobre foto, um véu só |
| quadradinho de ícone sobre cada item | número, verbo ou nada |
| grade de cards iguais repetida em toda seção | hierarquia: destaque e demais, ou o ritmo do tipo de conteúdo |
| eyebrow em caixa alta com `tracking` largo em toda seção | o título sozinho |
| botão em pílula repetido | um CTA primário por tela; o resto, link |
| hover que só faz `scale` | mudança de cor ou de opacidade |
| texto justificado | alinhado à esquerda, em medida de leitura (§10.4) |
| entrada animada e escalonada | nenhuma; só transição curta de cor (§10.5) |
| copy genérica ("Saiba mais", "Fique informado", "com sucesso") | verbo e objeto específicos (§10.7) |

### 10.9 Gráfico (Recharts pelo `chart` do shadcn)

- **Tipo**: todo gráfico tem o genérico do dado (`<Bar<MonthlyRevenue, number>>`) ou nasce de um
  helper tipado (`createHorizontalChart<T, X, Y>()`); sem isso `data` e `dataKey` caem em `any` e o
  `dataKey` errado passa no typecheck (_doc-lib/recharts.md#en-US/guide/typescript).
- **Cor** só por `var(--color-<chave>)`, a variável que o `ChartConfig` do `ChartContainer` gera a
  partir de `--chart-N`; nunca hex. `Bar` e `Scatter` sem `fill` saem pretos
  (_doc-lib/recharts.md, "O que muda a experiência"; _doc-lib/shadcn.md#chart).
- **Animação** fica em `isAnimationActive` `'auto'` (o padrão), que respeita
  `prefers-reduced-motion`; `isAnimationActive={true}` ignora a preferência do sistema e é proibido
  (_doc-lib/recharts.md#en-US/guide/animations; §10.5).
- **Carga**: gráfico fora do primeiro quadro entra por `lazy` + `<Suspense>` (§9.4).
- **Acessibilidade**: `accessibilityLayer` já é `true` na v3 e não se desliga (teclado e leitor de
  tela no tooltip); a raiz recebe `title` e `desc` com texto de `m.*()`
  (https://recharts.github.io/en-US/api/BarChart/). *(Opinião da casa, sem `_doc-lib` de WCAG)*:
  cor nunca é o único sinal entre séries (rótulo, legenda ou padrão junto, §10.4); o valor exato não
  depende só do hover do tooltip; gráfico que carrega informação essencial (não só tendência) tem a
  mesma informação numa tabela de dados, visível ou atrás de um "Ver como tabela".

### 10.10 Arrastar e reordenar (dnd kit)

- A tabela do kit (`common/table/`, bloco opcional que só liga com `@tanstack/react-table` e
  `@dnd-kit/*` no `package.json`) usa a geração `core`/`sortable`/`utilities`, que a doc diz ser a da
  casa; o `kit.deps.json` declara essa geração, não a `@dnd-kit/react`. A migração é um commit só,
  pelo passo a passo de _doc-lib/dnd-kit.md#react/guides/migration
  (https://dndkit.com/react/guides/migration.md), quando o pacote novo sair do `0.x`.
- Nos projetos que já estão na API nova, `sensors` e `plugins` do `DragDropProvider` sempre na forma de função
  (`(defaults) => [...defaults, X]`): o array substitui o padrão e some com o `KeyboardSensor` e o
  plugin `Accessibility` (_doc-lib/dnd-kit.md#react/components/drag-drop-provider,
  #react/guides/sensors).
- Os anúncios e as instruções de leitor de tela do `Accessibility` saem do i18n
  (`Accessibility.configure({ announcements, screenReaderInstructions })` com `m.*()`); o padrão é
  em inglês (_doc-lib/dnd-kit.md, "O que muda a experiência").
- Teclado não é a alternativa de um ponteiro (§10.2): a lista reordenável tem também a ação
  "mover" por clique (menu "Mover para cima/baixo" ou botões).

---

## 11. Teste de UI

A matriz por camada está em `architecture.md` §8; aqui fica o como do frontend. Sufixo separa o
runner (`DECISIONS.md` #113, C17): `<x>.test.ts(x)` é Vitest, ao lado do arquivo; `e2e/<fluxo>.spec.ts`
é Playwright. As regras de Playwright abaixo seguem `_doc-lib/playwright.md`; onde a casa escolhe
dentro do que a doc permite, a linha diz *(opinião da casa)*.

### 11.1 Vitest + Testing Library

- Hook e componente de `common/`, `-components/` com lógica, e todo `lib/<tema>.ts` não trivial têm
  teste. Ambiente `jsdom` declarado por arquivo. _doc-lib/vitest.md#config/environment.
- Componente se testa pelo que o usuário vê: `getByRole('button', { name })` e `userEvent`, nunca
  por classe nem por `data-testid` quando há papel. O nome vem da mesma chave (`m.*()`), nunca de
  string redigitada.
- Teste com Query: `QueryClient` novo por teste, com `retry: false`.
  _doc-lib/tanstack-query.md#guides/testing.
- Dado parcial por `fromPartial()` (`@total-typescript/shoehorn`), nunca `as` nem `fromAny()`.
- Lista e tabela têm um caso para cada um dos quatro estados (§10.1).
- **Hook que centraliza fiação repetida** (invalidar, avisar, navegar) tem teste próprio: o
  typecheck não vê a ligação removida.
- **Schema local** (o que `shared/` não cobre, em `lib/`) nasce com teste dos limites no mesmo
  commit: o tipo não vê um teto trocado.
- `afterEach(cleanup)` uma vez, no `vitest.setup.ts` do kit (`setupFiles` dos dois projetos do
  `vitest.config.ts`): sem `globals: true` no Vitest, a Testing Library não limpa o DOM sozinha, e
  a doc manda o `afterEach` de topo num arquivo de setup (_doc-lib/testing-library-react.md,
  _doc-lib/vitest.md#config/globals, `DECISIONS.md` #350); o `.test.tsx` não repete.
- Tempo por `vi.useFakeTimers()` com `vi.useRealTimers()` no `afterEach`.
  _doc-lib/vitest.md#mocking/timers.

### 11.2 Playwright

- **Seletor**: `getByRole(papel, { name })` → `getByLabel` → `getByText` → `getByTestId` só onde
  não há papel e nome estáveis (célula, canvas, item sem texto). CSS de classe/id e XPath nunca.
  O nome vem da mensagem compilada do idioma base:

```ts
import { m } from '../src/paraglide/messages'

await page.getByRole('button', { name: m.posts_form_save() }).click()
await expect(page.getByRole('alert')).toHaveText(m.posts_archived_conflict())
```

- **`data-testid`** (default do Playwright, sem configuração; nunca `data-test-id`) só existe
  onde um E2E lê (`DECISIONS.md` #113, C22).
- Sem espera fixa: nunca `waitForTimeout`, `sleep` nem `networkidle`. Espera é asserção web-first
  (`await expect(locator).toHaveText(x)`, nunca `expect(await locator.textContent())`),
  `waitForResponse` para fato de rede, `page.clock` para tempo.
- Ator e helpers por fixture (`test.extend`) em `e2e/support/test.ts`; helpers por domínio em
  `e2e/support/<tema>.ts`; nada de Page Object com `new`, nada de função solta no spec. Sessão por
  `storageState` gravado num projeto `setup`.
- Isolamento: cada teste cria o próprio dado (prefixo + id único), pela API quando a tela não é o
  alvo, e limpa em `finally`; nenhum teste depende de ordem.
- **`page.route`** alcança só o que o **navegador** pede: o fetch do SSR, feito no Nitro, não passa
  por ele (_doc-lib/playwright.md#docs/network). A doc o recomenda para API de terceiro que o
  projeto não controla (gateway, CEP, mapa), com `route.fulfill`
  (_doc-lib/playwright.md#docs/best-practices, #docs/mock): esse é o uso livre. Contra o backend do
  próprio projeto *(opinião da casa)*, só para o que ele não produz sob demanda (5xx, latência para
  ver o esqueleto, offline); sucesso simulado do próprio backend é proibido, porque o E2E existe para
  pegar a costura com ele. Rota não precisa de `unrouteAll`: cada teste recebe contexto novo, e o
  `route` morre com ele.
- **Viewports** *(opinião da casa, `DECISIONS.md` #266)*: três projetos de viewport rodam os mesmos
  specs: `mobile` 360×740 com toque (`devices['Pixel 5']` com o viewport trocado), `tablet` 768×1024 e
  `desktop` 1440×900, cada um dependendo do `setup`. O `responsive.spec.ts` abre toda tela de cada
  perfil (visitante e cada papel) e reprova rolagem horizontal (`scrollWidth > clientWidth`), texto
  cortado sem `truncate`/`line-clamp` intencional e violação `serious`/`critical` do axe; o
  `touch-targets.spec.ts` roda só no `mobile` (§10.2). Projeto, dispositivo e viewport:
  _doc-lib/playwright.md#docs/test-projects (https://playwright.dev/docs/test-projects, aberta),
  #docs/emulation (https://playwright.dev/docs/emulation, aberta). Quando roda (fase final do plano,
  e a rodada antes de todo PR): `tooling.md` §7 e §10.1.
- **Axe mede depois das animações de tempo, não das de rolagem** (`DECISIONS.md` #429). A fixture
  espera `document.getAnimations()` terminarem antes de medir contraste, filtrando as infinitas e as
  que não correm na `DocumentTimeline`: animação ligada à rolagem (`animation-timeline: scroll()`,
  como o `scroll-fade` do `CodeBlock`) nunca termina sozinha e travava o teste até o tempo acabar.
  Página da Web Animations API (`Animation.timeline`) não conferida: não coberto pela `_doc-lib`.
- **Axe ignora o interior de iframe de terceiro** *(opinião da casa, `DECISIONS.md` #268)*: vídeo e
  player embutidos têm marcação que não é do projeto. A fixture exclui o conteúdo e mantém o próprio
  `<iframe>` (título, tamanho) checado: `new AxeBuilder({ page }).exclude({ fromFrames: ['iframe', 'body'] })`.
  O axe-core não está em `_doc-lib`: não coberto. Contexto de `fromFrames`:
  https://github.com/dequelabs/axe-core/blob/develop/doc/context.md (a página do GitHub responde 403
  neste ambiente; lido o mesmo arquivo cru em raw.githubusercontent.com, que cita `fromFrames`).
  O `exclude()` do `AxeBuilder` está em _doc-lib/playwright.md#docs/accessibility-testing.
- **Sonda de rotas e páginas** *(opinião da casa, `DECISIONS.md` #305)*: `e2e/pages.spec.ts` lista
  toda página pública (cada slug do seeder) e abre cada uma nos três idiomas e nos três viewports,
  exigindo o status da navegação (`response.status()`) `200`, um `h1`, o `lang` do idioma, nenhuma
  rolagem horizontal, console limpo e nenhum 5xx da API. URL inexistente, na raiz e com prefixo de
  idioma, e slug inexistente de cada detalhe exigem `404` no status, não só a tela de "não
  encontrado". No painel, cada recurso é **criado e editado pelo formulário** uma vez: dado criado
  só pela API no setup deixa passar o formulário que manda um formato que o validator recusa. No
  academy, com a suíte antiga verde, essa sonda achou cinco bugs: turma que o painel não criava nem
  editava (data em ISO contra validator `YYYY-MM-DD`, `backend.md` §4.4), URL desconhecida com
  `200` (§5), botão estourando a 360 px em `es` e `en`, `hreflang` da raiz sem a barra (SEO,
  abaixo) e uma mensagem de "não encontrado" no lugar de "é da turma".
- **Limiter ligado no E2E** *(opinião da casa, `DECISIONS.md` #305)*: desligar o limiter é testar
  outro servidor, e o E2E inteiro sai de um IP só, então o sexto cadastro da rodada (ou a segunda
  rodada na mesma hora) leva 429. Cada teste ganha um endereço de cliente próprio, da faixa de teste
  `198.18.0.0/15` (RFC 2544), no `X-Forwarded-For` das requisições do navegador à API, por
  `context.route('<api>/**', (route) => route.continue({ headers: { ...route.request().headers(),
  'x-forwarded-for': ip } }))` (_doc-lib/playwright.md#docs/network,
  https://playwright.dev/docs/network, "Modify requests", aberta). Não por `extraHTTPHeaders`: no
  Chromium ele vira cabeçalho da página, a requisição ganha preflight de CORS, e a API, que lista os
  próprios cabeçalhos, recusa. Funciona porque o backend da rodada confia no loopback
  (`TRUSTED_PROXIES=loopback`, `backend.md` §6.2), como o Traefik em produção. Esse `route` não
  simula resposta do backend, só identifica o cliente: não fere a regra de `page.route` acima. O
  fetch do SSR não passa por ele e continua no IP do Nitro.
- Todo spec termina sem erro de console inesperado (fixture `errors`); fluxo crítico roda
  `@axe-core/playwright` (falha em violação séria ou crítica) e tem um caso com
  `reducedMotion: 'reduce'` e viewport de 320 px.
- Formulário crítico em quatro tempos: vazio, inválido, 409/422 no campo, válido (com F5 e duplo
  clique gerando uma requisição só, e 5xx com "Tentar de novo").
- Configuração do runner (`forbidOnly`, `retries: 0`, trace na falha, credencial por env) e o
  comando da rodada: `tooling.md` §7.

---

## Decisões de forma

- **Query key factory: arquivo central com seção por módulo** (§2.1; `DECISIONS.md` #78, substitui
  a #9); `queryOptions` e mutations por módulo (#113, C3).
- **`components/ui/` editável com `// casa:`** (§6; #113, C10).
- **Par `index`/`index.lazy` como convenção de forma**, não como mecanismo de chunk (§1.3).
- **`verbatimModuleSyntax` desligado no frontend**: a doc do TanStack Start avisa que ligado ele pode
  vazar bundle de servidor para o cliente (_doc-lib/tanstack-start.md#build-from-scratch,
  `tooling.md` §3, `DECISIONS.md` #319). O `import type` continua cobrado pelo
  `consistent-type-imports`.
- **Semicolon/prettier**: `tooling.md` §5, a mesma régua no frontend e no backend.
