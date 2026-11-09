# Vite PWA e fake-indexeddb

Service worker gerado no build pelo Workbox, para o app abrir sem rede; e o IndexedDB em memória para testar a fila offline no Node.

Última verificação: 2026-11-08 (fonte: https://vite-pwa-org.netlify.app/llms.txt; README de dumbmatter/fakeIndexedDB, branch `master`)

> Conferido contra `vite-plugin-pwa@2.0.0` (latest), `workbox-window@7.4.1` (latest) e `fake-indexeddb@6.2.8` (latest).

**O que é:** o `vite-plugin-pwa` gera no build o service worker (estratégia `generateSW`, que escreve
o `sw.js` pelo `workbox-build`, ou `injectManifest`, que compila o seu e injeta a lista de
precache), o manifesto do app e, se quiser, o script de registro. Os módulos virtuais
`virtual:pwa-register` (e `/react`) expõem o registro e os avisos de "pronto para offline" e "versão
nova". O `fake-indexeddb` é uma implementação em JS puro, em memória, da API do IndexedDB, feita para
testar no Node o código que depende dela.

**Para que serve:** app que precisa abrir e guardar trabalho sem sinal (cache de página pública,
asset e API de leitura; fila de envio em IndexedDB que sobe quando a rede volta), e o teste
unitário dessa fila no Vitest sem navegador.

**Como usar:**

```bash
pnpm add -D vite-plugin-pwa workbox-window fake-indexeddb
```

```ts
// vite.config.ts: o Start renderiza o HTML no servidor, então não há index.html para o plugin injetar
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: false, // registro manual, só no cliente (lib/pwa.ts)
  manifest: false, // manifesto estático em public/manifest.webmanifest
  outDir: '.output/public', // saída do cliente do Nitro, não o dist/ do Vite
  workbox: {
    globPatterns: ['**/*.{css,woff2,svg,png,ico}'],
    navigateFallback: null, // navegação é respondida pelo servidor, nunca por shell em cache
    cleanupOutdatedCaches: true,
  },
})
```

```ts
// lib/report-queue.test.ts: o global indexedDB passa a existir antes do código testado
import 'fake-indexeddb/auto'
import { enqueueReport, listQueuedReports } from './report-queue'
```

**Links:** 26.

**Skills:** `maiyu-frontend`, `javascript-testing-patterns`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com vite-plugin-pwa ou fake-indexeddb: projeto segue, e regra de
`_standards/` que contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página
de onde saiu.

### Instalação e registro

- **Instale `vite-plugin-pwa` como devDependency.** É plugin de build; a página de início manda `pnpm add -D`. [`#guide`](https://vite-pwa-org.netlify.app/guide/)
- **Com `virtual:pwa-register/react`, `workbox-window` entra como devDependency.** O módulo virtual do React depende dele. [`#frameworks/react`](https://vite-pwa-org.netlify.app/frameworks/react)
- **Em SSR, o registro só roda no cliente: o módulo virtual entra por `import()` dinâmico depois de conferir que há `window`, ou o registro é manual (`injectRegister: null`/`false`).** No build SSR o código também roda no servidor, onde `navigator` e `window` não existem. No Start, o lugar é efeito do `__root.tsx`, não o corpo do componente (`frontend.md` §9.2). [`#guide/prompt-for-update`](https://vite-pwa-org.netlify.app/guide/prompt-for-update), [`#guide/faq`](https://vite-pwa-org.netlify.app/guide/faq)
- **Escolha `prompt` ou `autoUpdate` antes de publicar, e prefira `prompt` em app com formulário.** O `autoUpdate` força `clientsClaim` e `skipWaiting` e recarrega as abas, o que pode perder o formulário em preenchimento; trocar de `autoUpdate` para `prompt` depois é penoso. [`#guide/auto-update`](https://vite-pwa-org.netlify.app/guide/auto-update)

### Precache e cache em tempo de execução

- **Tipo de arquivo além de `css`, `js` e `html` entra no precache por `globPatterns` dentro de `workbox` (estratégia `generateSW`).** O `workbox-build` só inclui esses três por padrão e varre a pasta de saída do build. [`#guide/service-worker-precache`](https://vite-pwa-org.netlify.app/guide/service-worker-precache)
- **Rota que o service worker não pode responder com o fallback de navegação vai em `navigateFallbackDenylist`, e o app trata o offline dela.** Página excluída e pedida sem rede dá "sem conexão". [`#workbox/generate-sw`](https://vite-pwa-org.netlify.app/workbox/generate-sw)
- **Antes de `injectManifest`, confira se o `generateSW` com `runtimeCaching` resolve.** A página manda procurar o que o Workbox já gera antes de escrever service worker próprio. [`#workbox/inject-manifest`](https://vite-pwa-org.netlify.app/workbox/inject-manifest)
- **Service worker em `vite dev` só com `devOptions.enabled: true`, e o PWA não é registrado ali.** Em desenvolvimento só a lógica do worker roda, e só se ligada. [`#guide/development`](https://vite-pwa-org.netlify.app/guide/development)

### Publicação

- **Sirva por HTTPS, com redirect de HTTP, e `manifest.webmanifest` com `application/manifest+json`.** São requisitos mínimos do servidor para o app ser instalável. [`#deployment`](https://vite-pwa-org.netlify.app/deployment/)
- **Nenhum cache longo (nem `immutable`) em `/`, `/sw.js`, `/index.html` e `/manifest.webmanifest`.** Cache nesses arquivos prende o cliente na versão velha por muito tempo. [`#deployment`](https://vite-pwa-org.netlify.app/deployment/)
- **Manifesto com `name`, `short_name`, `description`, `theme_color` igual ao `<meta name="theme-color">` e ícones 192x192 e 512x512; `<head>` com viewport, título, descrição, favicon e `apple-touch-icon`.** É o mínimo para o app ser instalável e passar no Lighthouse. [`#guide/pwa-minimal-requirements`](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements)
- **Para remover o service worker publicado, `selfDestroying: true` sem mudar nada mais, nem o nome do arquivo.** O worker especial precisa ocupar o lugar do antigo, com o mesmo nome, e apaga o cache dele. [`#guide/unregister-service-worker`](https://vite-pwa-org.netlify.app/guide/unregister-service-worker)

### fake-indexeddb

- **Instale como devDependency e importe `fake-indexeddb/auto` no topo do arquivo de teste, antes do código (ou do wrapper, como Dexie e idb) que usa IndexedDB.** O `auto` põe `indexedDB` e as classes `IDB*` no escopo global; os dados não vão para o disco. [`#README/use`](https://github.com/dumbmatter/fakeIndexedDB/blob/master/README.md#use)
- **Teste isolado começa com `indexedDB = new IDBFactory()`.** Uma fábrica nova é um banco totalmente limpo. [`#README/wipingresetting-the-indexeddb-for-a-fresh-state`](https://github.com/dumbmatter/fakeIndexedDB/blob/master/README.md#wipingresetting-the-indexeddb-for-a-fresh-state)
- **Em ambiente jsdom, garanta `structuredClone` antes de importar o `fake-indexeddb`.** Desde a v5 o pacote não traz o polyfill, e o jsdom não o expõe. [`#README/jsdom-often-used-with-jest`](https://github.com/dumbmatter/fakeIndexedDB/blob/master/README.md#jsdom-often-used-with-jest)

---

## Guide

#### guide
[doc](https://vite-pwa-org.netlify.app/guide/) | [markdown](https://vite-pwa-org.netlify.app/guide.md)

**O que é:** o que é PWA e service worker, o que o plugin gera e a configuração mínima.
**Para que serve:** a porta de entrada do plugin.
**Quando usar:** antes de ligar o PWA no projeto.

#### guide/register-service-worker
[doc](https://vite-pwa-org.netlify.app/guide/register-service-worker) | [markdown](https://vite-pwa-org.netlify.app/guide/register-service-worker.md)

**O que é:** as opções de `injectRegister` (`inline`, `script`, `script-defer`, `auto`, `null` manual) e o que cada uma injeta.
**Para que serve:** escolher o registro manual quando não há `index.html` (SSR do Start).
**Quando usar:** ao configurar como o worker é registrado.

#### guide/service-worker-precache
[doc](https://vite-pwa-org.netlify.app/guide/service-worker-precache) | [markdown](https://vite-pwa-org.netlify.app/guide/service-worker-precache.md)

**O que é:** como o precache é montado a partir da pasta de saída, quando o navegador baixa e o `globPatterns`.
**Para que serve:** decidir o que entra no precache e o que fica para o cache em tempo de execução.
**Quando usar:** ao mexer em `globPatterns` ou em `outDir`.

#### guide/pwa-minimal-requirements
[doc](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements) | [markdown](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.md)

**O que é:** o mínimo do `<head>`, do manifesto e do servidor para o app ser instalável.
**Para que serve:** passar no critério de instalação do navegador e no Lighthouse.
**Quando usar:** antes de publicar o PWA.

#### guide/service-worker-strategies-and-behaviors
[doc](https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors) | [markdown](https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors.md)

**O que é:** estratégia (`generateSW` padrão ou `injectManifest`) e comportamento (`prompt` padrão ou `autoUpdate`).
**Para que serve:** separar "como o worker é gerado" de "como ele se atualiza".
**Quando usar:** na primeira configuração.

#### guide/auto-update
[doc](https://vite-pwa-org.netlify.app/guide/auto-update) | [markdown](https://vite-pwa-org.netlify.app/guide/auto-update.md)

**O que é:** o comportamento `autoUpdate`, o risco para formulários, `cleanupOutdatedCaches` e o registro em SSR.
**Para que serve:** atualizar sem perguntar, sabendo o que se perde.
**Quando usar:** ao escolher `registerType: 'autoUpdate'`.

#### guide/prompt-for-update
[doc](https://vite-pwa-org.netlify.app/guide/prompt-for-update) | [markdown](https://vite-pwa-org.netlify.app/guide/prompt-for-update.md)

**O que é:** o comportamento `prompt`: `onNeedRefresh`, `onOfflineReady`, `updateSW()` e o registro por `import()` dinâmico em SSR.
**Para que serve:** deixar o usuário decidir quando recarregar.
**Quando usar:** em app com formulário ou trabalho em andamento.

#### guide/inject-manifest
[doc](https://vite-pwa-org.netlify.app/guide/inject-manifest) | [markdown](https://vite-pwa-org.netlify.app/guide/inject-manifest.md)

**O que é:** service worker próprio com `srcDir`, `filename` e a lista de precache injetada.
**Para que serve:** lógica que o `generateSW` não cobre (background sync próprio, push).
**Quando usar:** só depois de descartar o `generateSW`.

#### guide/static-assets
[doc](https://vite-pwa-org.netlify.app/guide/static-assets) | [markdown](https://vite-pwa-org.netlify.app/guide/static-assets.md)

**O que é:** ícones do manifesto e `includeAssets` a partir de `public/`, e o limite de reaproveitar imagem de `src/assets`.
**Para que serve:** pôr favicon, ícone e fonte no precache.
**Quando usar:** ao incluir arquivo de `public/` no worker.

#### guide/periodic-sw-updates
[doc](https://vite-pwa-org.netlify.app/guide/periodic-sw-updates) | [markdown](https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.md)

**O que é:** checar versão nova do worker em intervalo, pelo `onRegisteredSW` do módulo virtual.
**Para que serve:** aba que fica aberta por dias pega a versão nova.
**Quando usar:** em painel que o usuário não fecha.

#### guide/development
[doc](https://vite-pwa-org.netlify.app/guide/development) | [markdown](https://vite-pwa-org.netlify.app/guide/development.md)

**O que é:** `devOptions` para ter o worker no `vite dev`, e as diferenças por estratégia.
**Para que serve:** depurar o worker sem build de produção.
**Quando usar:** ao testar cache e offline localmente.

#### guide/service-worker-without-pwa-capabilities
[doc](https://vite-pwa-org.netlify.app/guide/service-worker-without-pwa-capabilities) | [markdown](https://vite-pwa-org.netlify.app/guide/service-worker-without-pwa-capabilities.md)

**O que é:** usar o plugin só para compilar um service worker simples, sem manifesto nem cache offline.
**Para que serve:** worker de push ou de interceptação sem PWA instalável.
**Quando usar:** quando só o worker interessa.

#### guide/unregister-service-worker
[doc](https://vite-pwa-org.netlify.app/guide/unregister-service-worker) | [markdown](https://vite-pwa-org.netlify.app/guide/unregister-service-worker.md)

**O que é:** `selfDestroying` e o worker substituto com o mesmo nome.
**Para que serve:** tirar do ar um worker quebrado sem deixar cliente preso.
**Quando usar:** ao desligar o PWA ou trocar o nome do worker.

#### guide/testing-service-worker
[doc](https://vite-pwa-org.netlify.app/guide/testing-service-worker) | [markdown](https://vite-pwa-org.netlify.app/guide/testing-service-worker.md)

**O que é:** como o próprio plugin testa: Vitest para o build, Playwright (Chromium) no navegador.
**Para que serve:** modelo do teste de build e do E2E offline.
**Quando usar:** ao escrever teste do service worker.

#### guide/cookbook
[doc](https://vite-pwa-org.netlify.app/guide/cookbook) | [markdown](https://vite-pwa-org.netlify.app/guide/cookbook.md)

**O que é:** como Vite, Rollup, o plugin e o Workbox constroem o worker, hook por hook.
**Para que serve:** depurar build que não gera ou não acha os arquivos.
**Quando usar:** quando o `sw.js` sai vazio ou fora do lugar.

#### guide/faq
[doc](https://vite-pwa-org.netlify.app/guide/faq) | [markdown](https://vite-pwa-org.netlify.app/guide/faq.md)

**O que é:** erros comuns, entre eles `navigator`/`window` indefinido em SSR e tipos dos módulos virtuais.
**Para que serve:** resolver erro conhecido sem inventar contorno.
**Quando usar:** quando o build SSR quebra por causa do registro.

## Workbox

#### workbox
[doc](https://vite-pwa-org.netlify.app/workbox/) | [markdown](https://vite-pwa-org.netlify.app/workbox.md)

**O que é:** o módulo `workbox-build` e os dois métodos que o plugin usa.
**Para que serve:** saber onde mora a opção que o plugin repassa.
**Quando usar:** antes de configurar `workbox` ou `injectManifest`.

#### workbox/generate-sw
[doc](https://vite-pwa-org.netlify.app/workbox/generate-sw) | [markdown](https://vite-pwa-org.netlify.app/workbox/generate-sw.md)

**O que é:** `generateSW`: recursos externos, `runtimeCaching`, `navigateFallbackDenylist`, rotas excluídas do worker.
**Para que serve:** configurar o cache de página, asset, API e tiles sem escrever service worker.
**Quando usar:** em todo projeto com a estratégia padrão.

#### workbox/inject-manifest
[doc](https://vite-pwa-org.netlify.app/workbox/inject-manifest) | [markdown](https://vite-pwa-org.netlify.app/workbox/inject-manifest.md)

**O que é:** `injectManifest`: o worker próprio compilado pelo Vite e a lista de precache injetada.
**Para que serve:** quando o `generateSW` não basta.
**Quando usar:** só depois de conferir o `runtimeCaching`.

## Frameworks

#### frameworks
[doc](https://vite-pwa-org.netlify.app/frameworks/) | [markdown](https://vite-pwa-org.netlify.app/frameworks.md)

**O que é:** os módulos virtuais, os tipos e quando eles são desnecessários (`autoUpdate`, `injectManifest`).
**Para que serve:** decidir se o projeto precisa do módulo do framework.
**Quando usar:** ao escolher entre registro manual e módulo virtual.

#### frameworks/react
[doc](https://vite-pwa-org.netlify.app/frameworks/react) | [markdown](https://vite-pwa-org.netlify.app/frameworks/react.md)

**O que é:** `virtual:pwa-register/react` (`useRegisterSW`, `offlineReady`, `needRefresh`), os tipos e o componente de aviso de versão nova.
**Para que serve:** o aviso de "versão nova" no React.
**Quando usar:** com `registerType: 'prompt'`.

## Deploy

#### deployment
[doc](https://vite-pwa-org.netlify.app/deployment/) | [markdown](https://vite-pwa-org.netlify.app/deployment.md)

**O que é:** requisitos do servidor (HTTPS, tipo do manifesto) e os arquivos que não podem ter cache longo.
**Para que serve:** conferir os cabeçalhos do Nitro e do proxy antes de publicar.
**Quando usar:** antes do primeiro deploy com service worker e ao mexer em `Cache-Control`.

## fake-indexeddb

#### README/use
[doc](https://github.com/dumbmatter/fakeIndexedDB/blob/master/README.md#use) | [markdown](https://raw.githubusercontent.com/dumbmatter/fakeIndexedDB/master/README.md)

**O que é:** instalação como devDependency, o `fake-indexeddb/auto` que preenche o escopo global, o import explícito das classes e o uso com Dexie e idb.
**Para que serve:** rodar no Vitest o código da fila offline sem navegador.
**Quando usar:** em todo teste que toca IndexedDB.

#### README/jsdom-often-used-with-jest
[doc](https://github.com/dumbmatter/fakeIndexedDB/blob/master/README.md#jsdom-often-used-with-jest) | [markdown](https://raw.githubusercontent.com/dumbmatter/fakeIndexedDB/master/README.md)

**O que é:** a falta de `structuredClone` no jsdom e os dois contornos.
**Para que serve:** evitar o erro de clone quando o teste roda em ambiente jsdom.
**Quando usar:** quando o arquivo de teste usa `environment: 'jsdom'`.

#### README/wipingresetting-the-indexeddb-for-a-fresh-state
[doc](https://github.com/dumbmatter/fakeIndexedDB/blob/master/README.md#wipingresetting-the-indexeddb-for-a-fresh-state) | [markdown](https://raw.githubusercontent.com/dumbmatter/fakeIndexedDB/master/README.md)

**O que é:** `new IDBFactory()` para zerar o banco entre testes.
**Para que serve:** teste isolado, sem depender de outro ter limpado.
**Quando usar:** no `beforeEach` de suíte que grava no IndexedDB.

#### README/triggering-the-close-event
[doc](https://github.com/dumbmatter/fakeIndexedDB/blob/master/README.md#triggering-the-close-event) | [markdown](https://raw.githubusercontent.com/dumbmatter/fakeIndexedDB/master/README.md)

**O que é:** `forceCloseDatabase()`, fora do padrão, para disparar o evento `close`.
**Para que serve:** cobrir o caminho de banco fechado por motivo anormal.
**Quando usar:** ao testar o tratamento de conexão perdida.
