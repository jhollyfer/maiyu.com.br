# Padrão de tooling

Ferramental comum a todo projeto TypeScript: gerenciador de pacote, versão de
runtime, flags do compilador, ESLint, Prettier, hooks de commit, portões antes do PR,
entrega (Docker e deploy), `.github` e a definição de pronto, revisão e
depuração. Vale para backend, frontend e `shared/`, Fastify ou Adonis.

---

## 0. Política de versão: sempre a mais nova publicada *(opinião da casa)*

**Regra**: toda dependência — lib de produção, dev tool, o próprio `pnpm`, o
Node e o TypeScript — fica na **última versão publicada** no momento em que
o projeto é tocado, não numa versão "estável conhecida" congelada. Onde dois
projetos da casa divergem de major (gerenciador de pacote, TypeScript, runner de
teste, linter), o padrão é a **mais nova das duas**, e o projeto atrasado migra —
a divergência não é uma escolha registrada, é débito.

**Por quê**: pin em "versão que funciona" é o que acumula quatro minors de
atraso num documento que fala de segurança — exatamente o defeito que uma
tabela de versões redigida à mão produz.
Correção de CVE, de regressão de performance e de type noise do TypeScript
chega só para quem atualiza; quem fixa versão "porque funciona" paga o custo
de migrar tudo de uma vez, mais tarde, sob pressão.

- **Dependabot/Renovate ligado** em todo repositório, PR automático de
  atualização — não descoberta manual de "está desatualizado".
- **Upgrade é revisado, não aceito automaticamente**: changelog da lib (ou
  `npm diff`/`npm pack` + leitura dos `.d.ts` novos quando o changelog não
  cobre o breaking de tipo) antes de merge, principalmente em major.
- **Breaking de major é corrigido no código**, não revertido com downgrade.
  Pin para baixo só é aceitável como medida temporária, com issue aberta e
  prazo — nunca como solução. Quando quem quebra é **outra dependência que ainda não aceita o
  major novo** (o `babel-plugin-react-compiler` 1.0 pulando componentes no `@babel/core` 8), o
  pin fica um major atrás com **saída nomeada** no lugar do prazo: a versão ou condição que o
  libera, escrita no `ignore` do Dependabot (§9) com comentário e reconferida a cada rodada de
  versões.
- Este documento não fixa número de versão de lib. O número certo é "o que
  `npm view <pkg> version` responde agora".
- **"Última" quer dizer "última com um dia de publicada".** O pnpm só resolve versão publicada há
  pelo menos `minimumReleaseAge` minutos, 1440 por padrão desde o 11: a versão de hoje entra amanhã
  (_doc-lib/pnpm.md#supply-chain-security). A casa mantém o padrão, que é defesa contra pacote
  comprometido e não contradiz a regra; correção de segurança urgente entra por
  `minimumReleaseAgeExclude`, com o motivo ao lado, nunca zerando a opção.

**Exceções registradas** (`DECISIONS.md` #121). Major que reescreve a API do próprio core da
casa é decisão, não atualização de rotina: o critério é **o código continuar funcionando**.

| Dependência | Regra | Por quê |
|---|---|---|
| TypeScript | fica na **última 6.x** (`typescript@~6`) em todos os apps, inclusive typecheck. Sem TypeScript 7 (`typescript@7`, `typescript-native`, `@typescript/native-preview`), nem como alias só para o typecheck | a API do 7 mudou e a migração quebrou projeto. Volta a ser avaliado quando houver segurança; aí a migração é planejada (mapear o que mudou, aplicar em todo o código de uma vez) e vira decisão nova |
| `mongodb` (driver) e servidor MongoDB | **sempre a última major**, mesmo com mudança de API: mapear o que mudou pelo changelog e pela `_doc-lib/mongodb.md`, ajustar o código e atualizar | é a base de dados do perfil Fastify; ficar para trás no driver custa correção de segurança e recurso novo |
| `@tanstack/react-query` e os pacotes `@tanstack/*-query*` | **versão exata** (patch), subida à mão | a doc considera mudança de tipo não quebradora e a publica em patch, e recomenda travar o pacote num patch específico (_doc-lib/tanstack-query.md#typescript, `DECISIONS.md` #319); cobrado pelo `pattern:check` (`query-exact-version`, `DECISIONS.md` #359) |
| pré-lançamento que a stack exige (hoje `nitro` 3 RC) | **versão exata** da última beta, subida à mão lendo `docs/migration`; vira `^<major>` quando sair a estável | faixa sobre pré-lançamento só casa outro pré-lançamento do mesmo `[major, minor, patch]` (README do `semver`), então `^` não anda para a beta seguinte; e a API muda entre betas (`_doc-lib/nitro.md`) |

Dependabot ignora major do TypeScript (`ignore` com `update-types: ["version-update:semver-major"]`
para `typescript`) e abre PR de major do `mongodb` normalmente (configuração na §9).

---

## 0.1 Bibliotecas fixas da casa *(decisão do dono, `DECISIONS.md` #195)*

Uma biblioteca por papel, em todo projeto e nos dois lados. A segunda do mesmo papel é desvio e
migra, como a terceira lib de schema (`AGENTS.md`, "Regras que não se negociam"; `DECISIONS.md` #241).
A stack inteira é fechada e vale estritamente para todo projeto (`DECISIONS.md` #322); a única
exceção nomeada é o **lowcodejs**, que fica em Fastify com MongoDB (driver `mongodb`) e Postgres.
Dentro do Adonis, o que o framework já traz vence lib de fora.

| Papel | Biblioteca | Fora |
|---|---|---|
| backend | **AdonisJS 7**, a última versão publicada (`@adonisjs/core@^7`); Fastify só no lowcodejs | Express, Nest, Fastify em projeto novo |
| banco e ORM | **Lucid + PostgreSQL** (`@adonisjs/lucid`, `pg`); no lowcodejs, driver `mongodb` + `pg` | Prisma, Drizzle, TypeORM, Mongoose, Sequelize |
| frontend | **TanStack Start** (React 19, Vite, Router, Query) em todo frontend | Next, Remix, React Router puro, SPA sem Start |
| UI base | **Base UI** pelo **shadcn** (`components/ui/`) | `@radix-ui/*` (nem por dependência do registry), MUI, Chakra, Mantine |
| cliente da API | **Tuyau** (`@tuyau/core`), gerado das rotas do backend, como transporte dentro do `request()` (Adonis, `frontend.md` §3.3), na mesma versão nos dois lados; no lowcodejs, `fetch` dentro do `request()` (`DECISIONS.md` #324) | `axios`, `fetch` solto por tela (o `ky` não está aqui: é dependência do Tuyau) |
| i18n | **Paraglide JS** (`@inlang/paraglide-js`) no frontend; **`@adonisjs/i18n`** no backend Adonis (mensagens do VineJS e erros de negócio, `i18n.md` §3) | `react-i18next`, `next-intl`, `i18next`, Paraglide no backend |
| teste do backend | **Japa** (funcional e unitário do Adonis) + **Vitest** (`shared/` e unitário puro); no lowcodejs só Vitest | Jest, Mocha, AVA |
| teste de ponta a ponta | **Playwright** (`@playwright/test`) em todo frontend | Cypress, Puppeteer, Selenium |
| build do backend | o do Adonis (`node ace build`); **tsup** no backend Fastify | `tsc` solto, webpack, esbuild à mão |
| fila | **`@adonisjs/queue`** no Adonis, com a versão **fixada** (a doc o marca como experimental), adapter `redis` em produção e worker em processo separado (`node ace queue:work`); BullMQ só no lowcodejs | BullMQ, Bee-Queue, Agenda em projeto Adonis; `setInterval` como agendador |
| hash de senha | **Argon2** (`argon2id`): driver `argon` no Adonis, `crypto.argon2` no Fastify (`backend.md` §5.6, item 6) | `bcrypt`, `bcryptjs`, `scrypt` novo, MD5/SHA puro |
| data e hora | **Luxon** (`luxon`, `DateTime`), no backend e no frontend | `date-fns`, `dayjs`, `moment`, `Date` cru em regra de negócio |
| ícones | **Phosphor** (`@phosphor-icons/react`; `"iconLibrary": "phosphor"` no `components.json`, _doc-lib/shadcn.md) | `lucide-react`, `react-icons`, `@tabler/icons-react`, SVG de ícone colado à mão |
| schema | **Zod** (`zod`) em frontend, `shared/` e backend Fastify; **VineJS** (`@vinejs/vine`) só no backend Adonis, onde é nativo (`DECISIONS.md` #241) | `yup`; `@vinejs/vine` fora do backend Adonis |
| texto rico e Markdown | **Tiptap**: editor `@tiptap/react`, leitura pelo renderer estático `@tiptap/static-renderer` (também para Markdown, via `@tiptap/markdown`) | `react-markdown`, `remark-*`, `rehype-*`, `marked`, `markdown-it` |
| kit comum | componente, `lib/`, integração, código comum do backend e checks de `_templates/code/`, pelo sync; não se edita no projeto (`frontend.md` §8, `DECISIONS.md` #343) | cópia local editada, registry do shadcn como fonte do kit |
| realce de código | **Shiki** (`shiki`), só pelo `lib/highlighter.tsx` que o `code-block` do shadcn instala (`frontend.md` §6.6) | `highlight.js`, `lowlight`, `@tiptap/extension-code-block-lowlight`, `prismjs`, `react-syntax-highlighter` |

- **Luxon**: o Lucid já hidrata coluna de data como `DateTime` do Luxon (Adonis); no Fastify e no
  frontend, a mesma lib. Exibição sai de `DateTime` com `setLocale` do idioma da requisição e zona
  explícita (`frontend.md` §3.5); transporte é ISO 8601 (`toISO()` / `DateTime.fromISO`).
- **Dependência transitiva não conta**: o `react-day-picker` do `calendar` do shadcn traz o
  `date-fns` por dentro; o código da casa não o importa.
- **Cobrança**: ESLint `no-restricted-imports` no bloco comum (§4.1), com `paths` para o nome exato
  de cada pacote da coluna "Fora" **e** `patterns` para o subcaminho (`date-fns/*`, `react-icons/*`,
  `yup/*`, `remark-*`): `paths` com `date-fns` não pega `date-fns/locale`. A regra só vê import
  estático e reexport; `import()` dinâmico escapa e fica para a revisão (§10.2)
  (_doc-lib/eslint.md#docs/latest/rules/no-restricted-imports).
- Contrato de cada lib: `_doc-lib/luxon.md` (zona, locale, validade) e `_doc-lib/phosphor.md`
  (`IconContext`, acessibilidade, migração pelo `shadcn migrate icons`).

## 1. pnpm workspace *(opinião da casa; versão do pnpm em `devEngines.packageManager`)*

Um repositório por produto, com **pnpm workspace** na raiz: `pnpm-workspace.yaml` lista
`backend`, `frontend` e `shared`, e há **um** `pnpm-lock.yaml`, na raiz (`architecture.md` §9,
`DECISIONS.md` #110). Backend e frontend dependem de `"@<projeto>/shared": "workspace:*"`.
**Por quê**: validator, mensagem, enum e tipo de resposta são o mesmo código nos dois lados; com
o pacote compartilhado, a correção acontece num arquivo só e some o espelho + script de paridade.

- `shared/` só tem código puro: nada de banco, HTTP ou framework (`architecture.md` §2).
- **`shared/` nunca se publica**: nem npm, nem registry privado, nem imagem Docker própria. Ele
  chega aos dois apps pelo `workspace:*` no desenvolvimento e dentro da imagem de cada app na
  entrega (§8.2). Imagem só existe para o que roda: backend e frontend. `"private": true` no
  `package.json` dele impede o `pnpm publish` por engano (`DECISIONS.md` #224).
- **`shared/` sai compilado em `dist/`**. O Node recusa arquivo TypeScript dentro de
  `node_modules` (_doc-lib/nodejs.md#api/typescript), e é lá que o `pnpm deploy` põe o pacote na
  imagem do backend. Então o `package.json` do `shared/` aponta `exports` para `dist/` e lista só
  `dist` em `files`, que é o que o `deploy` copia (_doc-lib/pnpm.md#cli/deploy):

  ```json
  {
    "name": "@<projeto>/shared",
    "private": true,
    "type": "module",
    "sideEffects": false,
    "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
    "files": ["dist"],
    "scripts": { "build": "tsc -p tsconfig.build.json", "dev": "tsc -p tsconfig.build.json --watch" }
  }
  ```

  O `pnpm dev` da raiz sobe o `dev` do `shared/` junto com os apps, e o `typecheck` e o build de
  qualquer app rodam com o filtro que inclui as dependências (`--filter "{./backend}..."`), que
  executa na ordem topológica e compila o `shared/` primeiro (_doc-lib/pnpm.md#filtering).
  O frontend não precisa disso em runtime, porque o Vite empacota o `shared/` no bundle, mas
  importa do mesmo `dist/`, para os dois lados lerem o mesmo artefato.
- Cada app continua com o próprio build, Dockerfile e deploy. O Dockerfile constrói a partir da
  raiz do repositório e instala só o app e o `shared/` (`pnpm --filter "{./<app>}..." install`,
  depois `pnpm --filter ./<app> --prod deploy /out`, _doc-lib/pnpm.md#cli/deploy, #docker).
- **Filtro**: um app só é `--filter ./backend`; o app **com** o que ele usa do workspace é
  `--filter "{./backend}..."` (ou o nome, `--filter @<projeto>/backend...`), a forma que a página
  documenta. Os pacotes se chamam `@<projeto>/backend`, `@<projeto>/frontend` e `@<projeto>/shared`
  (`DECISIONS.md` #355). `./backend...` não aparece lá (_doc-lib/pnpm.md#filtering). Nos portões, `--fail-if-no-match`
  impede que um caminho errado passe verde sem rodar nada, e `failIfNoMatch: true` no
  `pnpm-workspace.yaml` liga o mesmo para todo comando.
- Dependência que precisa de script de build é liberada em `allowBuilds` do
  `pnpm-workspace.yaml` da raiz, cada entrada com o motivo.

Versão do pnpm em `devEngines.packageManager` no `package.json` da raiz, a forma atual da doc; o
campo `packageManager` é o legado (_doc-lib/pnpm.md#package_json). A versão resolvida fica gravada
no `pnpm-lock.yaml` e é a mesma em toda máquina, no hook e na imagem; a faixa é a major atual:

```json
{
  "devEngines": {
    "packageManager": { "name": "pnpm", "version": "^12.0.0", "onFail": "download" }
  }
}
```

**Sem Corepack.** As páginas de instalação e de CI do pnpm deixaram de usá-lo (o shim sobe um Node
a cada chamada); o pnpm se instala pelo caminho da página e troca sozinho para a versão do projeto
no primeiro uso (_doc-lib/pnpm.md#installation, #continuous-integration).

---

## 2. Node *(opinião da casa — piso de versão)*

**Node ≥ 24** (LTS corrente) em todo projeto — `engines.node` no
`package.json` e a mesma major na imagem Docker (`node:24-alpine`). Runtime
mais antigo some de CI silenciosamente até alguém notar um `--experimental`
flag faltando; declarar `engines` faz `pnpm install` recusar antes.

---

## 3. TypeScript: flags estritas *(opinião da casa sobre a referência do `tsconfig`)*

Versão: a última **6.x** em todo app e em `shared/` (§0, `DECISIONS.md` #121). O `latest` do npm já
é o 7: instale sempre com `pnpm add -D typescript@~6`, nunca `typescript` sem faixa
(_doc-lib/typescript.md#download). Esta é a lista única de flags da régua; `typescript.md` §10
aponta para cá. Nome, efeito e default de cada flag conferidos em _doc-lib/typescript.md#tsconfig.

**Piso, igual em todo `tsconfig.json`** (backend, frontend, `shared/`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noUncheckedSideEffectImports": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "types": []
  }
}
```

**O que muda por perfil** (X14): resolução de módulo, alvo e tipos de ambiente vêm do preset do
framework; o piso acima se soma por cima e nunca é afrouxado.

| Perfil | Base | Resolução | Extra |
|---|---|---|---|
| Backend AdonisJS | `"extends": "@adonisjs/tsconfig/tsconfig.app.json"` | a do preset (`NodeNext`) | alias pelo campo `imports` do `package.json` (`#features/*`) |
| Backend Fastify | sem preset | `"module": "ESNext"`, `"moduleResolution": "bundler"` (o build é `tsup`) | `experimentalDecorators` + `emitDecoratorMetadata` (DI por decorator, _doc-lib/fastify-decorators.md#Services and dependency injection); `"types": ["node"]` |
| Frontend | `"extends": "nitro/tsconfig"` | `"moduleResolution": "bundler"` | `"verbatimModuleSyntax": false` (a única flag do piso que o frontend desliga: a doc do TanStack Start diz que ligada ela pode vazar bundle de servidor para o cliente, _doc-lib/tanstack-start.md#build-from-scratch, `DECISIONS.md` #319); `"jsx": "react-jsx"`, `"noEmit": true`, `"types": ["vite/client"]`; alias `#/*` no `package.json#imports` **e** repetido em `compilerOptions.paths`: o runner do Playwright só lê `paths` do tsconfig (_doc-lib/playwright.md#docs/test-typescript) |
| `shared/` | sem preset | `"module": "NodeNext"`, `"moduleResolution": "NodeNext"` | import relativo com extensão: o que compila em `NodeNext` também compila em `bundler`, então o pacote serve aos dois consumidores |

- **`noUncheckedIndexedAccess`**: acrescenta `undefined` ao campo **não declarado**: acesso por index
  signature (`Record<string, V>`, `{ [id: string]: V }`), por índice de array (`arr[i]`) e grupo de
  regex. `Record<'a' | 'b', V>` tem as chaves declaradas e continua `V`. **Por quê**: sem a flag,
  `row[0]` ou `users[id]` tipam como `T` mesmo quando o índice não existe, e o `undefined` encontra
  o primeiro `.campo` só em produção.
- **`verbatimModuleSyntax`** (backend e `shared/`; desligada no frontend, tabela acima): import sem `type` fica no JS emitido, import com `type` some; o
  compilador não decide por inferência o que remove. Exige `import type` só de símbolo que é **só
  tipo** (`type`, `interface`); classe é valor, e o import dela fica como está. Quem pede
  `import type` numa classe usada só em posição de tipo é a regra `consistent-type-imports` (§4.1),
  não a flag. No perfil Fastify (decorator + `emitDecoratorMetadata`) a regra se cala sozinha em
  arquivo com decorator (_doc-lib/eslint.md#rules/consistent-type-imports), então não há
  desligamento por linha. O cuidado que sobra é de quem escreve: classe injetada nunca entra por
  `import type`, senão o metadado perde a referência e a injeção chega `undefined`.
- **`noUncheckedSideEffectImports`**: `import 'x'` que não resolve é erro de tipo, não erro de
  bundler descoberto em runtime. Vale para módulo de código; asset fica fora da promessa, porque o
  `vite/client` declara `declare module '*.css'` e com ele `import './stlyes.css'` (nome errado)
  compila. Import de CSS com nome errado aparece no build do Vite, não no `tsc`.
- **`types` explícito**: no TypeScript 6 o default passou a ser nenhum pacote `@types` automático;
  quem precisa de `node` ou `vite/client` declara. Declarar evita depender do default de qualquer
  versão.
- **Removido ou depreciado no 6.x, não usar**: `baseUrl` (alias vem do campo `imports` do
  `package.json` ou de `paths`), `moduleResolution: "node"`/`"node10"`, `esModuleInterop: false`,
  `target: "ES5"`, `outFile`. `strict` já é default no 6.x e continua escrito: a flag não pode
  depender do default.

---

## 4. ESLint: regras que cobram a régua

Config flat (`eslint.config.js`), uma por app. Plugins: `typescript-eslint`, `eslint-plugin-import-x`,
`@eslint-community/eslint-plugin-eslint-comments` e, no frontend, `@tanstack/eslint-plugin-query`,
`@tanstack/eslint-plugin-router`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`,
`eslint-plugin-react-hooks`, `@vitest/eslint-plugin` e `eslint-plugin-playwright`.

**Sem override por diretório** (X3). Não existe bloco `files: ['start/**', 'providers/**',
'config/**']` desligando regra: isenção por diretório é exatamente por onde o `new XService()` de um
callback passa (`backend.md` §2.1). Override só por **tipo de arquivo** com motivo de linguagem
(`*.d.ts`) ou por decisão registrada (`*.unit.spec.ts`, `DECISIONS.md` #116); exceção de `new` é
por **símbolo**, na allowlist.

### 4.1 Bloco comum (backend, frontend, `shared/`)

```js
// eslint.config.js
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import { defineConfig } from 'eslint/config'
import importX from 'eslint-plugin-import-x'
import tseslint from 'typescript-eslint'

// Allowlist de `new` por símbolo (backend.md §2.1). Só entra classe cujo nome casa com o
// seletor e que a API de uma biblioteca obriga a instanciar; cada entrada com o motivo.
// Vazia, o `:not` vira `^()$`, que não casa com nome nenhum.
const NEW_ALLOWLIST = []

const NEW_SELECTOR =
  'NewExpression[callee.name=/(Service|UseCase|Policy|Controller|Repository|Seeder)$/]' +
  `:not([callee.name=/^(${NEW_ALLOWLIST.join('|')})$/])`

// Uma lib por papel (§0.1). `paths` casa o nome exato; o subcaminho só cai em `patterns`.
const OUTSIDE_THE_HOUSE = [
  { name: 'date-fns', message: 'Data e hora: Luxon (tooling.md §0.1).' },
  { name: 'dayjs', message: 'Data e hora: Luxon (tooling.md §0.1).' },
  { name: 'moment', message: 'Data e hora: Luxon (tooling.md §0.1).' },
  { name: 'lucide-react', message: 'Ícone: @phosphor-icons/react (tooling.md §0.1).' },
  { name: 'react-icons', message: 'Ícone: @phosphor-icons/react (tooling.md §0.1).' },
  { name: '@tabler/icons-react', message: 'Ícone: @phosphor-icons/react (tooling.md §0.1).' },
  { name: 'yup', message: 'Schema: Zod, ou VineJS só no backend Adonis (tooling.md §0.1).' },
  { name: 'react-markdown', message: 'Markdown: Tiptap (tooling.md §0.1).' },
  { name: 'marked', message: 'Markdown: Tiptap (tooling.md §0.1).' },
  { name: 'markdown-it', message: 'Markdown: Tiptap (tooling.md §0.1).' },
  { name: 'highlight.js', message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).' },
  { name: 'lowlight', message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).' },
  {
    name: '@tiptap/extension-code-block-lowlight',
    message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).',
  },
  { name: 'prismjs', message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).' },
  {
    name: 'react-syntax-highlighter',
    message: 'Realce de código: Shiki pelo code-block (tooling.md §0.1).',
  },
]

const OUTSIDE_PATTERNS = [
  {
    group: [
      'date-fns/*', 'dayjs/*', 'moment/*', 'lucide-react/*', 'react-icons/*',
      '@tabler/icons-react/*', 'yup/*', 'remark-*', 'rehype-*', 'highlight.js/*',
      'prismjs/*', 'react-syntax-highlighter/*',
    ],
    message: 'Biblioteca fora da casa (tooling.md §0.1).',
  },
]

// VineJS só no backend Adonis (tooling.md §0.1). `files` lista o que NÃO é Adonis; o projeto Adonis
// apaga o bloco inteiro e `backend/` fica de fora do glob.
const VINE_PATH = {
  name: '@vinejs/vine',
  message: 'Schema: Zod; VineJS só no backend Adonis (tooling.md §0.1).',
}

export default defineConfig([
  ...tseslint.configs.recommendedTypeChecked,
  comments.recommended,
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    languageOptions: { parserOptions: { projectService: true } },
    plugins: { 'import-x': importX },
    rules: {
      // sem ternário: `if` clássico ou lookup (typescript.md §13). `??`, `?.` e `&&` seguem livres.
      'no-ternary': 'error',
      // sem `any`: `unknown` e narrowing na fronteira (typescript.md §2.1).
      '@typescript-eslint/no-explicit-any': 'error',
      // sem `as`; `as const` continua permitido pelo `assertionStyle: 'never'`.
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      // sem `!`: narrowing no topo da função.
      '@typescript-eslint/no-non-null-assertion': 'error',
      // sempre `type`, nunca `interface` (declaration merging: override de `*.d.ts` abaixo).
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // autofix de `import type`; convive com `verbatimModuleSyntax` (§3) e se cala sozinha em
      // arquivo com decorator legado, sem desligamento por linha no Fastify.
      '@typescript-eslint/consistent-type-imports': 'error',
      // promise solta é rejeição sem dono; promise onde se espera void é erro silencioso.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // externo → alias interno (`#…`, `@<projeto>/shared`) → relativo, linha em branco entre grupos.
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          // `@<projeto>/shared` resolve por node_modules e seria `external` sem o pathGroup.
          pathGroups: [
            { pattern: '#**', group: 'internal' },
            { pattern: '@<projeto>/**', group: 'internal' },
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      // `eslint-disable` sem motivo ao lado não passa (§10.2).
      '@eslint-community/eslint-comments/require-description': 'error',
      // logger do framework, nunca `console` (backend.md §4.2); pega também o log de depuração
      // esquecido. Script de CLI escreve em `process.stdout`.
      'no-console': 'error',
      // arquivo que cresce além disto pede divisão (opinião da casa). `warn` só reprova porque o
      // script de lint roda com `--max-warnings 0`.
      'max-lines': ['warn', { max: 1000, skipBlankLines: true, skipComments: true }],
      'no-restricted-imports': [
        'error',
        {
          paths: OUTSIDE_THE_HOUSE,
          patterns: OUTSIDE_PATTERNS,
        },
      ],
      // colaborador vem do container, nunca de `new` (backend.md §2.1, backend-fastify.md §3).
      'no-restricted-syntax': [
        'error',
        {
          selector: NEW_SELECTOR,
          message: 'Colaborador vem do container: injete por construtor (backend.md §2.1).',
        },
      ],
      // `.pipe()` não propaga erro nem destrói os streams quando um falha (backend.md §5.6).
      'no-restricted-properties': [
        'error',
        { property: 'pipe', message: 'Use pipeline de node:stream/promises (backend.md §5.6).' },
      ],
      // código vindo de fora só roda no isolated-vm (backend-fastify.md §13).
      'no-eval': 'error',
      'no-new-func': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
    },
  },
  {
    // frontend, `shared/` e backend Fastify: nada de `@vinejs/vine` (nem subpath). O flat config
    // substitui as opções da regra em vez de somá-las, então este bloco repete `paths` e `patterns`.
    files: ['frontend/**/*.{ts,tsx}', 'shared/**/*.ts', 'backend-fastify/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [...OUTSIDE_THE_HOUSE, VINE_PATH],
          patterns: [
            ...OUTSIDE_PATTERNS,
            { group: ['@vinejs/vine/*'], message: VINE_PATH.message },
          ],
        },
      ],
    },
  },
  {
    // declaration merging exige `interface`: limite da linguagem, não estilo.
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/consistent-type-definitions': 'off' },
  },
  {
    // o unitário instancia o use-case com a implementação em memória (DECISIONS.md #116).
    files: ['**/*.unit.spec.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
])
```

`defineConfig` vem de `eslint/config`; o `tseslint.config(...)` está depreciado a favor dele e não
entra em config nova (_doc-lib/eslint.md#packages/typescript-eslint). O script de lint de todo app
é `"lint": "eslint . --max-warnings 0"`: o ESLint sai com 0 quando só há aviso, e sem a flag o
`max-lines` não reprova nada (_doc-lib/eslint.md#docs/latest/use/command-line-interface,
#docs/latest/rules/max-lines).

**`@vinejs/vine` por pasta** *(`DECISIONS.md` #241)*: os globs do bloco acima são os do monorepo da
casa; o projeto Fastify aponta o `files` do backend para a pasta real dele. Projeto Adonis mantém só
`frontend/**` e `shared/**`: o `backend/` importa o VineJS por `core/validator.ts`
(`backend.md` §4.4). `zod` não é restrito em lugar nenhum.

**`consistent-type-imports` e `verbatimModuleSyntax` juntas** *(opinião da casa)*: a página da regra
avisa que as duas podem reportar o mesmo import duas vezes e deixa desligar a regra quando o
diagnóstico do `tsc` basta (_doc-lib/eslint.md#rules/consistent-type-imports). A casa mantém as
duas: a flag é a que reprova o build, a regra é a que corrige com `--fix` e a que pega a classe
importada só como tipo, que a flag deixa passar (§3).

`no-restricted-syntax` carrega **só** a regra de `new` no bloco comum: é o que permite desligá-la no
`*.unit.spec.ts` sem soltar outra proibição junto. Proibição nova de sintaxe entra em
`no-restricted-properties` ou numa regra própria. A exceção é o elemento interativo cru do
frontend (`frontend.md` §6.5), que só um seletor de AST pega: entra num bloco com `files` próprio
(`src/routes/**`, `src/components/common/**`) e repete o seletor de `new`.

`Seeder` está no seletor ao lado dos outros cinco papéis: `new XSeeder(...)` fora do container
escapava pelo mesmo motivo que os outros não escapam, só porque o nome não casava com o regex.

**Por que ESLint e não revisão**: `no-ternary` é do núcleo do ESLint (eslint.org/docs/latest/rules/
no-ternary); `no-explicit-any`, `consistent-type-assertions`, `no-non-null-assertion` e
`consistent-type-definitions` são do `typescript-eslint` (typescript-eslint.io/rules). Custo zero de
manutenção. O seletor de `new` existe porque o erro que ele pega (callback com o contexto em mãos
fazendo `new XService()`) passa em revisão sem ninguém ver; o linter sempre olha
(_doc-lib/eslint.md#docs/latest/rules/no-ternary, #rules/no-explicit-any,
#rules/consistent-type-assertions, #rules/no-non-null-assertion, #rules/consistent-type-definitions).

O que o linter não cobra e continua na revisão (§10.2): `Merge<A,B>` no lugar de `A & B`, lookup no
lugar de 3+ `if/else if`, função coesa. Não finja que estão automatizadas.

### 4.2 Frontend: o que soma ao comum

```js
// frontend/eslint.config.js
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import playwright from 'eslint-plugin-playwright'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default defineConfig([
  // ...as entradas do bloco comum (§4.1), na mesma ordem
  ...pluginQuery.configs['flat/recommended'],
  ...pluginRouter.configs['flat/recommended'],
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { react },
    rules: {
      // queryKey e queryFn soltos, fora da fábrica de queryOptions (frontend.md §2.1).
      '@tanstack/query/prefer-query-options': 'error',
      // throw redirect() e throw notFound() são o fluxo do router (_doc-lib/tanstack-router.md#eslint/eslint-plugin-router).
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            { from: 'package', package: '@tanstack/router-core', name: 'Redirect' },
            { from: 'package', package: '@tanstack/router-core', name: 'NotFoundError' },
          ],
        },
      ],
      // HTML cru é XSS: rich text renderiza pelo componente único de components/common/.
      'react/no-danger': 'error',
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'XSS: renderize pelo React.' },
        { property: 'insertAdjacentHTML', message: 'XSS: renderize pelo React.' },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      'vitest/no-focused-tests': 'error',
      // `.skip` só com `eslint-disable-next-line` + motivo + tarefa (§10.1).
      'vitest/no-disabled-tests': 'error',
    },
  },
  {
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
    },
  },
])
```

O `eslint.config.js` do frontend é o bloco da §4.1 com estas entradas somadas no fim. A config não
vai para `shared/`, que é código puro e não exporta ferramenta (`architecture.md` §9).

- `@tanstack/eslint-plugin-query`: instalar junto com a biblioteca; cada regra é um bug que o
  compilador não vê (_doc-lib/tanstack-query.md#eslint/eslint-plugin-query,
  #eslint/prefer-query-options).
- `@tanstack/eslint-plugin-router`: ordem de propriedade da rota que quebra inferência
  (_doc-lib/tanstack-router.md#eslint/eslint-plugin-router, #eslint/create-route-property-order).
- `eslint-plugin-jsx-a11y`: o anti-padrão de acessibilidade que é lintável (rótulo sem controle,
  clique sem teclado, `alt` ausente). A 6.10.2 declara peer `eslint` só até `^9`: com ESLint 10 o
  pnpm avisa peer não satisfeito, e o aviso é conhecido, não motivo de descer o ESLint
  (_doc-lib/eslint.md#jsx-eslint/eslint-plugin-jsx-a11y).
- `eslint-plugin-react-hooks` com as regras do React Compiler, pelo preset flat
  `reactHooks.configs.flat.recommended`. `configs['recommended-latest']` (sem `flat`) é o formato
  `.eslintrc` e quebra a config flat; `flat['recommended-latest']` é o experimental
  (_doc-lib/eslint.md#reference/eslint-plugin-react-hooks).
- Playwright e `@vitest/eslint-plugin`: teste focado, pulado sem motivo e espera fixa reprovam no
  lint, não na revisão (_doc-lib/eslint.md#mskelton/eslint-plugin-playwright). O Japa não tem plugin
  de lint: o `.pin()` esquecido se cobra pelo `disallowPinnedTests` (§10.1).
- `components/ui/` e os arquivos que o registry do shadcn escreve (`hooks/use-mobile.ts`,
  `hooks/use-highlighted-code.ts`, `lib/highlighter.tsx`) ficam fora do estilo da casa no ESLint do kit
  (ordem de import, `no-ternary`, `as`, regras de a11y e `any`): são saída do registry, comparada pelo
  `shadcn --diff`, e editada só pelo patch `// casa:` (`frontend.md` §6, `DECISIONS.md` #391). O resto
  das regras e o typecheck valem.

---

## 5. Prettier

```js
/** @type {import('prettier').Config} */
export default {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
}
```

**Sem ponto e vírgula** *(opinião da casa)*, porque é o default do `@adonisjs/prettier-config`:
adotar o config de uma lib oficial reduz a chance de o próximo projeto divergir. Um
`prettier.config.js` por app, igual nos três e em todo projeto: mora em `_templates/code/<app>/` e o
sync cobra (`code-diverge:`, `DECISIONS.md` #280). O `@adonisjs/prettier-config` não entra: ele traz
`printWidth: 100`, e o mesmo arquivo sairia formatado diferente em cada projeto. Projeto que ainda está com `semi: true` migra na
próxima reformatação em massa (`MIGRATIONS.md`), não num commit avulso. O `check` roda
`prettier --check` (§7), pelo script `format:check`: `backend/`, `frontend/` e `shared/` têm, cada
um, `"format": "prettier --write ."` e `"format:check": "prettier --check ."`, e o `check` do
pacote inclui `format:check`. Sem o script, o `pnpm --filter ./<app> format:check` cai
em `pnpm exec`, falha em 20 ms e não diz o motivo (`DECISIONS.md` #284).

---

## 6. Husky, commitlint e hooks *(opinião da casa)*

**Um Husky, na raiz** (`.husky/`, `architecture.md` §9): `package.json` da raiz com `husky` e
`@commitlint/cli` + `@commitlint/config-conventional` em `devDependencies` e
`"prepare": "node .husky/install.mjs"`, que não falha quando o install não traz as devDependencies;
na imagem, `HUSKY=0` no `install` (§8.2; _doc-lib/husky.md#how-to.html, `DECISIONS.md` #337).
Nunca `backend/.husky` com `prepare: cd ..`: o hook da raiz cobre os três pacotes e o `commit-msg`.
O `--check` cobra o `prepare` da raiz igual a `node .husky/install.mjs` (`prepare-diverge:`): os
Dockerfiles do kit copiam esse arquivo, e `husky` puro derruba o install filtrado da imagem.
O `install.mjs` decide o que pular pelo que falta, não por `NODE_ENV`: sem `.git` (a imagem), com
`HUSKY=0` ou sem o `husky` instalado, sai calado; com `NODE_ENV=production` no shell, num clone
novo ou numa worktree (`.git` é arquivo), instala o hook. O `pre-commit` já roda por app tocado
(`touches`); achado do `pattern:check` de outro app não barra o commit.

**`commit-msg`** chama `pnpm exec commitlint --edit "$1"`. `.commitlintrc.json` estende
`@commitlint/config-conventional`: tipo em inglês (`feat`, `fix`, `refactor`), descrição em pt-BR,
assunto no imperativo, em minúscula (o `subject-case` da base reprova sentence case) e sem ponto
final. O cabeçalho tem até 72 caracteres *(opinião da casa)*: a base fixa `header-max-length` em
100, e o `.commitlintrc.json` sobrescreve
(_doc-lib/commitlint.md#conventional-changelog/commitlint/@commitlint/config-conventional):

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": { "header-max-length": [2, "always", 72] }
}
```

O corpo herda da base o `body-max-line-length` de 100 (linha só com URL fica isenta): uma linha
longa reprova o commit inteiro, então o corpo se quebra perto de 72 colunas, como o cabeçalho
(`DECISIONS.md` #310; mesma entrada de `_doc-lib`, e o `src/index.ts` do pacote, aberto).

Corpo diz o porquê, e é obrigatório em breaking change, correção de segurança, migration de dado e revert. O resto da convenção de
commit está em `backend.md` §9.

**Autor único, cobrado em três camadas** *(regra do dono, `AGENTS.md`; `DECISIONS.md` #214)*: nenhum
commit, PR ou arquivo leva Claude, Anthropic ou outro agente como autor ou coautor. Regra escrita
não basta: ferramenta de agente injeta o trailer por padrão.

1. **Configuração do agente** em `.claude/settings.json` do projeto (commitado, vale para quem clona):
   `"attribution": { "commit": "", "pr": "", "sessionUrl": false }`. É a chave atual do Claude Code
   (`includeCoAuthoredBy` está depreciada); vale em sessão na nuvem: não confirmado, por isso as
   camadas 2 e 3 existem.
2. **Hook `commit-msg`** recusa o commit antes de ele existir:

   ```sh
   # .husky/commit-msg
   pnpm exec commitlint --edit "$1" || exit 1
   if grep -qiE '^(co-authored-by|claude-session):|generated with|noreply@anthropic\.com|anthropic\.com/claude' "$1"; then
     echo "commit-msg: trailer ou marca de agente na mensagem; o autor é só o dono do repositório" >&2
     exit 1
   fi
   author=$(git var GIT_AUTHOR_IDENT)
   case "$author" in
     *"<jhollyfer.fr@gmail.com>"*) ;;
     *) echo "commit-msg: autor fora do permitido: $author" >&2; exit 1 ;;
   esac
   ```

3. **Antes de abrir o PR** (§7), o agente roda `git log --format='%an <%ae>%n%B' origin/<base>..HEAD`
   e o mesmo `grep`; achou trailer de agente ou autor diferente, reescreve antes do push. Pega o
   commit feito com `--no-verify` ou numa máquina sem o hook.

4. **Depois de abrir ou editar o PR pela ferramenta**, o agente relê o corpo publicado. A integração
   do GitHub da sessão acrescenta sozinha um rodapé "Generated by Claude Code", que a camada 1 não
   cobre; o corpo é reeditado sem ele na hora (`DECISIONS.md` #310; comportamento observado no
   academy, sem página).

Commit que já entrou com a marca é corrigido reescrevendo o histórico da branch (`git rebase` com
`--exec`/`filter-branch`), nunca deixado para depois; na `main` compartilhada, só com o dono.

**Branch e PR seguem a convenção, sem nome de agente** *(regra do dono; `DECISIONS.md` #244)*:

- **Título do PR** é uma mensagem Conventional Commits válida, como o assunto do commit:
  `feat(orders): reserva o estoque no checkout`, `fix(auth): ...`, `refactor`, `docs`, `test`,
  `chore`, `ci`, `build`, `perf`. O commitlint confere o título também.
- **Nome da branch** é `<tipo>/<escopo>-<assunto-curto>` em minúsculas e hífen, com o mesmo tipo:
  `feat/orders-reserva-estoque`, `fix/auth-cookie-samesite`, `chore/deps-zod-4-6`.
- **Nunca `claude`, `anthropic`, `codex`, `cursor` ou nome de outro agente** no título do PR, no
  nome da branch, no corpo do PR ou no assunto do commit. Branch que a ferramenta cria com prefixo de
  agente (`claude/...`) é renomeada antes do push (`git branch -m`), e o PR sai da branch renomeada.
- **Conferência antes de abrir o PR**: o agente passa título e branch pelo mesmo critério, no
  terminal, e só abre o PR se os três passarem:

  ```sh
  printf '%s\n' "$PR_TITLE" | pnpm exec commitlint
  printf '%s\n' "$PR_BRANCH" | grep -qE '^(feat|fix|refactor|docs|test|chore|ci|build|perf|style|revert)/[a-z0-9][a-z0-9-]*$' \
    || { echo "branch fora do padrão <tipo>/<escopo>-<assunto>: $PR_BRANCH" >&2; exit 1; }
  if printf '%s\n%s\n' "$PR_TITLE" "$PR_BRANCH" | grep -qiE 'claude|anthropic|codex|cursor'; then
    echo "nome de agente no título ou na branch do PR" >&2; exit 1
  fi
  ```

- **Toda mudança entra por PR, com merge do dono** (`DECISIONS.md` #298). Ninguém empurra para a
  `main`; o agente abre a branch, empurra e entrega o PR, e quem faz o merge é o dono.
- **O merge é um commit de merge com a mensagem padrão do git** (`Merge branch '<branch>'`, ou o
  `Merge pull request #N from ...` que o GitHub escreve). Nunca `merge: ...`: `merge` não é tipo do
  Conventional Commits e o commitlint reprova. A mensagem padrão passa porque o commitlint ignora
  commit de merge com `defaultIgnores: true`, o padrão (_doc-lib/commitlint.md#reference/configuration,
  https://commitlint.js.org/reference/configuration; a lista dos ignorados, com `Merge branch` e
  `Merge pull request`, está em `@commitlint/is-ignored/src/defaults.ts`).

**`pre-commit`, por app, filtrado por pasta, com o alvo rápido** (X1, `DECISIONS.md` #113 C9): roda
o `check` e a suíte **unitária** só do app que o commit toca; o `commit-msg` roda o commitlint. É o
que roda em todo commit. A suíte E2E fica na sessão antes do PR (§7): precisa de banco e serviços em
container e deixaria o hook lento o bastante para ser pulado com `--no-verify`.

**Teste pesado na sessão, antes do PR** (`DECISIONS.md` #298): nenhum hook local (`pre-commit`,
`pre-push`) roda suíte que precisa de banco, fila, bucket ou navegador: a funcional do backend
(`node ace test` inteiro, Japa contra Postgres e MinIO), a de integração e a E2E (Playwright). Hook
que roda a funcional inteira trava cada commit por minutos, e a resposta de quem espera é o
`--no-verify`, que desliga também o lint. Elas rodam na sessão do agente, uma vez, com tudo pronto e
antes de abrir o PR (§7), e o resultado vai no corpo do PR: o comando de cada suíte, quantos testes
passaram e o tempo. Não existe GitHub Actions para rodá-las depois.

**O deploy é observado, sempre**: depois do merge na `main`, o agente acompanha o deploy do Coolify
até o fim (status do deploy pelo painel ou pela API dele) e roda a conferência de produção de §10.1.
Deploy vermelho ou conferência que falha é tarefa do agente na hora (§10.3): lê o log do deploy,
reproduz, corrige e abre outro PR. "Fiz o merge" não é "pronto" (§10.1).

```sh
# .husky/pre-commit
staged=$(git diff --cached --name-only)

touches() {
  printf '%s\n' "$staged" | grep -q "^$1/"
}

if touches shared; then
  pnpm --filter ./shared check || exit 1
fi
if touches backend || touches shared; then
  pnpm --filter ./backend check || exit 1
fi
if touches frontend || touches shared; then
  pnpm --filter ./frontend check || exit 1
fi
```

Nome dos scripts, igual nos três pacotes: `check` (a fórmula de §7, que já roda `test:unit`),
`test:unit`, `test:e2e`. Mexer em
`shared/` testa os dois consumidores, porque é o contrato deles.

**Autoria**: autor e committer de todo commit são `Jhollyfer Rodrigues <jhollyfer.fr@gmail.com>`
(`git config user.name/user.email` no clone). Nenhum agente aparece como autor ou coautor: mensagem
sem `Co-Authored-By`, `Claude-Session` ou "Generated with"; PR sem rodapé de ferramenta. Commit que
entrou assim é reescrito (autor + mensagem) e a branch recebe `--force-with-lease`.
A ferramenta de PR do agente (MCP do GitHub) pode acrescentar sozinha um rodapé "Generated by" com
link de sessão: depois de criar ou editar a PR, o agente lê o corpo (`pull_request_read`) e tira o
rodapé pelo `update_pull_request` do MCP, também de comentário; editar pelo `gh api` o recoloca
(achados do jhollyfer.com.br, 2026-11-09, e do maiyu.com.br, 2026-11-11).

**Conflito de merge** se resolve pela intenção dos dois lados (commit e PR de cada um), nunca por
`--abort` nem escolhendo um lado inteiro; depois, `check` e testes antes do commit de merge.

**Agentes em paralelo não dividem a árvore** (`DECISIONS.md` #311). Cada subagente que edita
trabalha numa worktree própria (`git worktree add <pasta> -b <branch> origin/main`, skill
`superpowers:using-git-worktrees`), numa branch própria, e a worktree sai depois do merge. Commit é
sempre com pathspec explícito (`git commit -- <arquivos>`), nunca `git add -A` nem `commit -a`:
arquivo modificado que não é da tarefa é trabalho em andamento de outro agente, e fica como está até
ele mesmo fazer o commit, com os testes dele. Commit por cima leva trabalho pela metade, sem teste, e
atropela o que o outro ainda está escrevendo. Pasta de worktree nunca entra no índice
(`.claude/worktrees/` no `.gitignore`, §9): versionada, ela vira gitlink sem `.gitmodules` e quebra o
checkout de quem clona.

**Guarda do agente** (`.claude/settings.json`, hook `PreToolUse`): bloqueia `git reset --hard`,
`git clean -f`, `git branch -D`, `git checkout .`, `git restore .` e `git push --force` sem
`--with-lease`. `git push` comum e `--force-with-lease` passam: o fluxo da casa empurra branch.
Na sessão de nuvem, o modo automático do agente pode recusar até o `--force-with-lease`. Por isso a
mensagem, o autor e o commit de merge saem certos **antes do primeiro push** (commitlint e a
conferência da camada 3 rodam antes), e nada depende de reescrever a branch depois. Pelo mesmo
motivo, o PR entregue para merge já tem todos os commits: commit empurrado depois que o dono fez o
merge fica fora dele e vira outro PR (`DECISIONS.md` #310).

---

## 7. Portões antes do PR *(opinião da casa)*

**Não há GitHub Actions em projeto da casa** (`DECISIONS.md` #298): nem CI de PR, nem workflow de
push, de imagem ou de deploy. Os portões rodam em dois lugares. O hook local (§6) roda o `check` e a
suíte unitária do app tocado em todo commit, e o commitlint na mensagem. A sessão do agente roda o
resto, uma vez, antes de abrir o PR, e o resultado vai no corpo dele. O merge na `main` dispara o
*Auto Deploy* do Coolify (§8.3). **Nada disso chama o `maiyu-pattern`**: nem clone, nem
`sync:check`, nem script de lá (`backend.md` §11). A cópia da régua commitada no projeto basta.

Antes de tudo, `pnpm install --frozen-lockfile` na raiz. Lockfile desincronizado é erro, nunca
resolvido por um install que reescreve o lock. Filtro de app com `--fail-if-no-match` (§1): sem ele,
caminho errado não casa com projeto nenhum e o passo sai verde sem rodar nada.

As suítes rodam com `CI=1` no ambiente do comando. É a variável que liga o `forbidOnly` e o
`reuseExistingServer: false` do Playwright e o `disallowPinnedTests` do Japa (§10.1): teste fixado
ou `.only` esquecido reprova a rodada em vez de rodar só ele. A leitura é sempre
`Boolean(process.env.CI)` (`disallowPinnedTests({ disallow: Boolean(process.env.CI) })`): comparar
com `=== 'true'` não liga com `CI=1` (`DECISIONS.md` #350).

**Fórmula do `check`, uma por app** (`DECISIONS.md` #338). É a única: o hook (§6), `backend.md` §10 e
os passos abaixo apontam para cá.

```
backend  = build:deps + format:check + lint + typecheck + openapi:check + pattern:check
           + authz:check (+ validators:check no Adonis) + test:unit
frontend = build:deps + i18n:compile + i18n:check + lint + typecheck + format:check + test:unit
shared   = lint + typecheck + test:unit
```

**`.adonisjs/` em dia** (Adonis): `scripts/adonisjs-check.mjs` do upstream roda o gerador do projeto
e reprova se `routes.d.ts` ou `client/` mudaram, como o `openapi:check` faz com o `openapi.json`:
`node <maiyu-pattern>/scripts/adonisjs-check.mjs backend --cmd "node ace build"`. O comando do
gerador é o que o `hooks.init` do `adonisrc.ts` dispara (`indexEntities`, `generateRegistry`;
_doc-lib/adonisjs.md, _doc-lib/tuyau.md); página oficial não conferida para um comando que gere sem
compilar. `openapi:generate` e `authz:check --write` bootam o app, e o `start/env.ts` do kit exige
`NODE_ENV` (enum sem default): o valor vem do `.env` ou do shell, e o carregador de ambiente do
Adonis lê o `.env.test` quando é `test`. Num clone sem `.env`, rode com `NODE_ENV=test` na frente
(`NODE_ENV=test node ace openapi:generate`); o kit não força o valor nesses comandos.

**Backend**, na ordem:

1. `pnpm --filter ./backend check`: a fórmula acima
2. `pnpm --filter ./backend depcruise`: direção das camadas e ciclo (`domain.md` §8)
3. serviços de pé pelo `docker compose -f backend/docker-compose.yml up -d` (§8.4), com a espera
   pelo **estado** (o banco aceita conexão, o bucket existe e responde), não por `sleep`
4. `pnpm --filter ./backend test:e2e` *(teste)* contra esses serviços, nunca contra ambiente
   compartilhado
5. `pnpm --filter ./backend di:check` (boota a aplicação; usa os mesmos serviços)
6. `pnpm --filter ./backend build`: typecheck de dev e build de produção usam configs diferentes o
   bastante para um passar e o outro falhar

**Frontend**, na ordem:

1. `pnpm --filter ./frontend check`: a fórmula acima. O `i18n:compile` é o Paraglide compilando as
   mensagens (`src/paraglide/` não é versionado, `i18n.md`); o `i18n:check` é o `inlang check` pela
   devDependency (tradução, variável e plural faltando, mensagem sem uso, `i18n.md` §4); o typecheck
   (`tsc --noEmit`) inclui `e2e/`, porque o runner do Playwright não checa tipo
   (_doc-lib/playwright.md#docs/test-typescript); o `format:check` é o `prettier --check .`; o
   `test:unit` é o Vitest em `src/**/*.test.{ts,tsx}` (`architecture.md` §8). O compilador do Paraglide baixa os plugins
   declarados em `modules` do `project.inlang/settings.json`, que são URLs do jsDelivr com a versão
   fixada, nunca `@latest` (_doc-lib/paraglide.md#/file-formats): quem roda precisa de rede para
   `cdn.jsdelivr.net`
2. `build`, depois `git diff --exit-code src/routeTree.gen.ts` e `node scripts/check-chunk-cycles.mjs`,
   que lê `.output/server` e reprova ciclo de chunk que quebra o SSR
3. **Playwright** (`test:e2e`) *(teste)* com o backend do passo 3 de pé:
   `pnpm exec playwright install --with-deps chromium` na primeira vez, depois
   `pnpm exec playwright test` com os três projetos de viewport (`mobile`, `tablet`, `desktop`; o
   `--project` puxa o `setup` e o teardown pelas `dependencies`, _doc-lib/playwright.md#docs/test-projects)
   e `--workers=1`. Relatório HTML em `playwright-report/`, fora do git

`playwright.config.ts` da casa (_doc-lib/playwright.md#docs/test-configuration):
`forbidOnly: Boolean(process.env.CI)`, `retries: 0` (padrão da biblioteca; retry sem condição
transforma teste quebrado em intermitente, _doc-lib/playwright.md#docs/test-retries; teste instável
é bug com tarefa), `globalTimeout` sempre definido (sem ele a execução não tem teto,
_doc-lib/playwright.md#docs/test-timeouts), `trace: 'retain-on-failure'`,
`screenshot: 'only-on-failure'`, `baseURL` e credenciais por env sem default (`E2E_OWNER_PASSWORD`,
como o seeder), `webServer` com `reuseExistingServer: !process.env.CI`, reporter
`[['html', { open: 'never' }]]`. Fluxo crítico roda `@axe-core/playwright` e reprova violação séria
ou crítica (_doc-lib/playwright.md#docs/accessibility-testing). Shard (`--shard=x/y`) só quando um
projeto sozinho passar do tempo aceitável (_doc-lib/playwright.md#docs/test-sharding).
Projeto só frontend não define `E2E_API_URL`: o config não sobe a API, não cria os projetos `setup` e
`cleanup` e não exige `E2E_OWNER_*` (`e2e/support/env.ts`, `withBackend`).

**`shared/`**: `check` *(teste)*, antes do backend.

**Repositório inteiro**:

- `pnpm audit --prod --audit-level=high` reprova vulnerabilidade alta em dependência de produção;
  dev tool fica fora do portão. Correção é atualização revisada (§0), nunca `audit fix` automático.
- Varredura de segredo no diff da branch (`gitleaks` ou o secret scanning do GitHub). *Sem `_doc-lib`.*
- Título e branch do PR pela conferência de §6.

**PR que só mexe em texto não roda as suítes.** Se nenhum arquivo do diff fugir de `*.md`, `docs/`,
`_standards/`, `_doc-lib/`, `.claude/` ou `_templates/`, o corpo do PR diz "só texto, sem suíte".

**ENV das suítes vem do `.env.test`.** Variável de processo vence o arquivo: exportar placeholder no
shell da sessão faz a suíte apontar para um banco que não existe. Valor de segredo nunca aparece
escrito em script nem como default que funcione em produção (chave de teste do provedor, senha de
seed).

**Uma execução de suíte por vez contra o mesmo banco de teste** *(opinião da casa, `DECISIONS.md`
#304)*. A funcional migra no começo e limpa as tabelas entre testes (`testUtils.db().truncate()`,
_doc-lib/adonisjs.md#guides/testing/resetting-state-between-tests): duas execuções juntas, ou um
`node ace test` órfão de uma rodada interrompida, se atropelam, e a suíte cai com lock de migration
e tabela sumindo no meio, sem defeito no código. Antes de rodar, `pgrep -af 'ace test'` sai vazio;
processo que sobrou morre antes. Sessão cujo container reiniciou perdeu os serviços que subiu: o
compose (ou o banco e o S3 locais) sobe de novo, com a espera pelo estado do passo 3, e o bucket só
se cria depois que o S3 responde.

**Suíte vermelha**: ler a saída, achar o trecho que falhou, e só então mexer. Nunca rodar de novo às
cegas, nunca ramo `if (process.env.CI)` para passar.

**Hook `SessionStart`** do agente (sessão na nuvem), quando o projeto tiver: idempotente, não
interativo, e validado rodando lint num arquivo e um teste.

---

## 8. Entrega *(opinião da casa)*

### 8.1 Sem workflows; código comum pelo sync

**O repositório não tem `.github/workflows/`** (`DECISIONS.md` #298). Teste e conferência rodam no
hook e na sessão (§6, §7); quem constrói e publica é o Coolify, que puxa o commit da `main` pelo
GitHub App dele e constrói cada app pelo `Dockerfile-production` (§8.2, §8.3). Enquanto o projeto
tiver `.github/workflows/`, o `--check` acusa `workflow-pendente:`; a pasta só sai com
`sync-to-project.mjs <dir> --remover-workflows` (ou `--so-workflows`, o mesmo modo: tira só a pasta e o bloco `github-actions` do `dependabot.yml` e sai, sem sincronizar o resto, para a PR que só tira o CI/CD), rodado depois que o `Dockerfile-production` de cada
app constrói dentro e o dono trocou o recurso do Coolify para GitHub App (§8.3, "Troca de recurso"):
tirar antes derruba a publicação (`DECISIONS.md` #371). Depois, tirar o check do Actions da proteção
de branch (§9) e apagar os secrets do Actions.

**O sync também cobra e limpa:** `tsconfig-diverge:` (o `tsconfig.json` e o `tsconfig.build.json` do
`shared/`, que é esqueleto, contra o kit, comparados como JSON e sem contar comentário), arquivo que o
kit removeu ou renomeou (`REMOVED_CODE` em `scripts/kit-manifest.mjs`: aparece como `sobra:` e sai no
sync, mesmo fora das pastas espelhadas) e `--com-backend`, que cria `backend/` num projeto só
frontend que ganhou API (sem a flag ele continua sem). O `kit-check` ainda prova o build do
frontend numa árvore só com os `COPY` do `Dockerfile-production`, sem `.git`, e reprova se o
`styles-*.css` que o SSR referencia não existe em `.output/public` (`--sem-build` pula, `--so-build` roda só ela). Achado da prova: sem `.git` (como no Docker) o Tailwind v4 perde as fontes no ambiente SSR e o CSS referenciado não é o emitido (404); o `styles.css` precisa de `@import 'tailwindcss' source('./')`.

**Código que tem de ser igual em todo projeto da stack** mora em `_templates/code/<caminho>`: o sync
grava em `<caminho>` no projeto e o `--check` reprova divergência (`code-diverge:`). Só o arquivo que
existe ali é cobrado; o resto do projeto continua dele. Bug achado num projeto num arquivo desses se
corrige aqui e volta para todos (`DECISIONS.md` #280).

**Ponto de extensão** (`EXTENSION_POINTS` e `EXTENSION_DIRS` de `scripts/kit-manifest.mjs`: rotas, seed,
models, `env.ts`, migrations) o sync cria se faltar e nunca reescreve. Para o modelo que muda não passar
em silêncio, o sync grava em `.maiyu/kit-extension-points.json` (versionado no projeto) o sha256 do modelo
que o projeto recebeu. O `--check` lista `extension-stale: <arquivo>` quando o modelo atual difere do
registrado (o projeto faz o merge à mão e confirma com `--ack-extension=<arquivo>` ou `--ack-extensions`,
que regravam o sha) e `migration-missing: <arquivo>` para migration do kit sem par no projeto (mesmo nome
ou mesma tabela); os dois saem com 1. Sem manifesto, o `--check` avisa `extension-baseline` e não falha, e
o sync cria o manifesto com o modelo atual (`DECISIONS.md` #398).

**ENV: catálogo único de chaves** (`DECISIONS.md` #417, `backend.md` §6.2). Todo projeto tem exatamente
as chaves de `_templates/backend/.env.example` e `_templates/frontend/.env.example`, na mesma ordem,
com o mesmo número (hoje backend e frontend, contagem impressa pelo `--check`): nenhum bloco sai, e o recurso que o projeto não usa fica com valor vazio; só entra chave que o kit lê. O
`--check` lista `env-diverge: <arquivo>: <chave> a mais | a menos | fora de ordem` (a chave comentada não conta onde o modelo a tem ativa) e acusa o `backend/start/env.ts` que perdeu o `EnvBlocks.assert` ou afrouxou chave obrigatória, também para o
`.env.test`, o `.env.production` e o `.env.e2e.example` (`fora do catálogo`), e imprime
`env: <arquivo> N chaves (modelo M)`: N igual a M em todo projeto em dia. Chave nova entra no modelo
do upstream e chega a todos pelo sync; o projeto liga o bloco pelo valor, nunca pela chave.

- **`main`**: o merge dispara o *Auto Deploy* do Coolify (§8.3).
- **`develop`**: sem deploy. Se o projeto tiver homologação, ela é um recurso próprio no Coolify,
  com a *branch* `develop`, *Auto Deploy* e domínio e variáveis próprios; a régua não a exige.

### 8.2 Imagem Docker

`Dockerfile-production` em cada app, **que constrói sozinho** e **a partir da raiz do workspace**
(para enxergar `shared/` e o lockfile único): `docker build -f backend/Dockerfile-production .`. O
Coolify constrói direto do Git (§8.3) e não recebe artefato de fora, então o Dockerfile instala, compila
e empacota tudo, sem depender de `.output/`, `build/` ou `dist/` vindos de fora (`DECISIONS.md` #290).

- Multi-stage sobre `node:24-alpine`, fixado por digest (`node:24-alpine@sha256:<digest>`) e atualizado
  pelo Dependabot (§9), porque tag móvel muda o que foi auditado sem commit (skill `security-audit`,
  SUPPLY-CHAIN-AND-RELEASE.md); o pnpm entra por `npm install -g pnpm`, como no academy
  (#395), sem Corepack (o do Node 24 não acha o binário do pnpm 12), e troca para a versão de
  `devEngines.packageManager` no primeiro uso, a mesma do hook local (_doc-lib/pnpm.md#installation,
  #docker). A doc também aceita partir da imagem
  `ghcr.io/pnpm/pnpm`; a casa fica com a imagem do Node *(opinião da casa)*, uma base só para os
  dois estágios.
- Estágio de build: copia `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (carrega o
  `allowBuilds`) e os `package.json` dos pacotes; `pnpm --filter "{./backend}..." install
  --frozen-lockfile`; copia o código; `pnpm --filter "{./backend}..." run build` (compila o
  `shared/` antes do app, pela ordem topológica); `pnpm --filter ./backend --prod deploy /out` (só o
  app e o `dist/` do `shared/` no `node_modules`, sem dev tool, _doc-lib/pnpm.md#cli/deploy). É assim
  que o `shared/` entra em produção: dentro da imagem do app, nunca como imagem ou pacote próprio
  (§1).
- `HUSKY=0` no `install` do estágio de build: na imagem o hook não serve, e o `prepare` não roda o
  Husky (_doc-lib/husky.md#how-to.html, `DECISIONS.md` #337).
- Variável que o build exige só para validar o schema de ENV entra como placeholder **no estágio de
  build**; segredo de placeholder (`APP_KEY`) vai inline no `RUN`, nunca em `ENV`, que vira
  metadado da imagem.
- **O modelo é o academy** (`DECISIONS.md` #395): `Dockerfile-production` do backend e do frontend
  seguem os do `academy`, e a única adaptação é o layout (workspace na raiz, `pnpm --filter` e
  `deploy`). Estágio final: só o artefato, `RUN apk add --no-cache curl`, o servidor roda como `node`
  (backend) ou `nitro`, uid 1001 do grupo `nodejs` (frontend), nunca root;
  `HEALTHCHECK CMD curl -fsS http://127.0.0.1:<porta>/health-check` (`architecture.md` §7).
  Sem volume persistente gravável, `USER node` direto.
- **Imagem com volume persistente gravável** (disco local de arquivos): `ENTRYPOINT` que sobe
  como root, só acerta o dono do volume (`chown -R node:node <pasta>`) e troca de usuário com
  `exec su-exec node "$@"`; `CMD` segue só iniciando o servidor. O Docker só copia o dono da imagem
  para um volume **vazio** (docs.docker.com/engine/storage/volumes, "Populate a volume using a
  container"): volume que veio de outra versão ou de outro uid fica com o dono antigo, e a plataforma
  (Coolify) não dá acesso ao host para o `chown`. O `su-exec` faz `exec` direto, e o servidor vira
  o PID 1 como `node` (github.com/ncopa/su-exec). Nada além disso roda como root: nem migration,
  nem seed (regra abaixo).
- **Sem `ENTRYPOINT` que migra**: migration roda como comando de deploy da plataforma
  (`node ace migration:run --force`, _doc-lib/adonisjs.md#deployment), para que subir réplica não
  seja o mesmo evento que alterar schema. `CMD` só inicia o servidor. **No Coolify, é o
  *Post-deployment command*, com o *Pre-deployment* vazio**: o *Pre-deployment* roda no começo do
  deploy, antes do build, por `docker exec` no container que está no ar (a versão que sai) e é
  pulado sem container; o *Post-deployment* roda no container novo, depois que ele sobe
  (`app/Jobs/ApplicationDeploymentJob.php` do coollabsio/coolify, `v4.x`; a página da doc não cobre
  os dois). No *Pre-deployment*, cada migration nova só rodaria no deploy seguinte. Custo aceito:
  a versão nova atende alguns segundos antes de migrar (migration que remove coluna ou muda
  contrato vai em duas releases, expandir e depois contrair) e falha no pós-deploy só aparece no
  log do deploy.
- Nunca `--inspect`, `--insecure-http-parser` ou `insecureHTTPParser` em `CMD`, `NODE_OPTIONS` ou
  config de produção.
- Frontend: Nitro com preset node (_doc-lib/nitro.md#deploy/runtimes/node). O estágio de build
  faz o mesmo que o backend com `{./frontend}...`: `pnpm install --frozen-lockfile`, o build do
  `shared/`, `i18n:compile` (o compilador do Paraglide baixa os plugins do jsDelivr: o servidor do
  Coolify precisa alcançar `cdn.jsdelivr.net`, §7) e o `build` do app. O estágio final leva só o
  `.output/`, com `USER node` e o `HEALTHCHECK` acima.
- **`VITE_*` de produção vêm do `frontend/.env.production` versionado**, só com valor público
  (`backend.md` §6, `frontend.md`): o Vite lê o arquivo no build em modo `production`
  (_doc-lib/vitejs.md#env-and-mode), e é assim que o endereço da API entra no bundle sem build arg
  nem secret. Antes do `build`, o estágio de build reprova `VITE_API_URL` ou `VITE_SITE_URL` vazia,
  sem `https://` ou com barra no fim: imagem que fala com `localhost` ou com http não sai.
- **`.dockerignore` na raiz**, um para as duas imagens, com a lista da página do pnpm
  (_doc-lib/pnpm.md#docker) em padrões `**/`, para valer em todo pacote: `**/node_modules`, `**/.git`,
  `**/*.md`, `**/dist`, mais `**/.output`, `**/build`, `**/coverage` e `**/.env*`, com a exceção
  `!frontend/.env.production` (modelo em `_templates/code/root/.dockerignore`, `DECISIONS.md` #327), a única de ambiente que
  entra no contexto. `dist`, `build` e `.output` ficam de fora para a imagem compilar do código, e
  não levar um artefato velho da máquina de quem rodou o build; `.env` de verdade, com segredo, nunca
  entra.
- Sem publicação em registry: a imagem nasce e fica no servidor do Coolify. Multi-arch, cache
  `type=gha` e tag por SHA no Docker Hub saíram com os workflows (`DECISIONS.md` #290, #298).

### 8.3 Deploy pelo Coolify

**O Coolify constrói e publica; o repositório não tem passo de deploy** (`DECISIONS.md` #290). Cada
app (API, frontend e, quando houver, o worker da fila) é um recurso *Application* no Coolify,
configurado assim:

| Campo do recurso | Valor |
|---|---|
| Origem | repositório privado pelo **GitHub App** do Coolify (não deploy key nem token pessoal) |
| *Branch* | `main` (homologação, se houver: outro recurso com `develop`, §8.1) |
| *Build Pack* | `Dockerfile` |
| *Base Directory* | `/` (a raiz: com `/backend` o `COPY shared/` falha, porque o contexto do build é a *Base Directory*) |
| *Dockerfile Location* | `/backend/Dockerfile-production` ou `/frontend/Dockerfile-production` |
| *Watch Paths* | um padrão por linha (vírgula não separa): `backend/**` (ou `frontend/**`), `shared/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, relativos à raiz do repositório e não à *Base Directory*: mudança no `shared/` ou no `package.json` da raiz (script, dependência do workspace) redeploya os dois, mudança só no frontend não redeploya a API. Provados com um commit só de documentação antes de confiar neles (`DECISIONS.md` #355, #379) |
| *Auto Deploy* | ligado: o push do merge na `main` dispara o build. No Coolify 4.6 fica em *Advanced* → *Deployment* e só aparece em recurso com origem Git |
| *Pre-deployment command* | vazio (§8.2: roda no container que sai, antes do build) |
| *Post-deployment command* | API: `node ace migration:run --force && node ace db:seed`, nunca `migration:refresh`, `reset` nem `fresh` (`backend.md` §4.13; seeder que roda a cada deploy, `backend.md` §6.2); frontend: vazio |
| *Health Check* | vazio: vale o `HEALTHCHECK` da imagem, que aponta para `/health-check` (`architecture.md` §7; _doc-lib/coolify.md#applications/configuration/health-checks, `DECISIONS.md` #328) |
| Variáveis | as de runtime (`DATABASE_URL`, `APP_KEY`, `COOKIE_DOMAIN`, `TRUSTED_PROXIES`...), no recurso, nunca no repositório; o frontend não precisa de nenhuma de build, porque os `VITE_*` vêm do `.env.production` (§8.2). `NODE_ENV` sem *Available at Buildtime*: marcada, ela entra no build como `production` e o `pnpm install` do estágio de build pula as `devDependencies` que compilam o app |

*(_doc-lib/coolify.md, "Decisões que a doc impõe": `#applications/configuration/general`,
`#applications/deployments/automatic-deployments`, `#applications/configuration/health-checks`,
`#applications/sources/github/app`. Onde esta régua diz "pré-deploy", o campo do Coolify é o
*Post-deployment command*, `DECISIONS.md` #355.)*

- **Sem secret de deploy no Actions.** `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `COOLIFY_URL`,
  `COOLIFY_TOKEN`, `COOLIFY_API_UUID`, `COOLIFY_APP_UUID`, `VITE_API_URL` e `VITE_SITE_URL` deixam de
  existir no repositório: projeto que os tem apaga em Settings, Secrets and variables, Actions. O
  endereço público de cada app mora no `docs/ENV.md` (e, o do bundle, no `frontend/.env.production`).
- **A prova do deploy é o healthcheck do Coolify.** O deploy só troca o container quando o novo
  responde `/health-check`; reprovando, o antigo fica no ar e o deploy aparece como falho no painel.
  O agente acompanha o deploy até o fim pelo painel ou pela API do Coolify (lista de deployments da
  aplicação, status `finished`) e confere `curl -fsS <endereço público>/health-check` de cada app
  (§10.1).
- **Perfil sem `backend/`** (§8.1, `DECISIONS.md` #286): um recurso só, o do frontend, com o mesmo
  quadro sem *Post-deployment command*.
- **Troca de recurso** (de *Docker Image* para repositório, ou qualquer recurso novo no lugar de um
  antigo) segue esta lista, na ordem (`DECISIONS.md` #296):
  1. copiar **todas** as variáveis do recurso antigo, uma a uma (`COOKIE_DOMAIN`, `CORS_ORIGINS`,
     `TRUSTED_PROXIES`, `REDIS_URL`, as de SMTP e de storage...), conferindo com `docs/ENV.md`;
     variável esquecida não reprova o build, só o comportamento;
  2. configurar o recurso novo pelo quadro acima (*Post-deployment*, *Watch Paths*, *Auto Deploy*,
     *Health Check* vazio, `NODE_ENV` só em runtime);
  3. **parar e remover o recurso antigo** antes de apontar o domínio para o novo. Dois containers com
     o mesmo domínio dividem as requisições no Traefik e misturam configuração: metade do tráfego
     cai no antigo, com as variáveis velhas, e o defeito parece intermitente;
  4. rodar a conferência de produção de §10.1.
  *(Coolify 4.6, lido no painel; página oficial não conferida.)*
- **Rollback decidido antes do deploy.** Toda entrega com migration registra no PR (ou na linha de
  `docs/TASKS.md`) o gatilho de rollback e o passo: no Coolify, a aba *Rollback* do recurso, com as
imagens anteriores guardadas no servidor, ou o redeploy do commit anterior (página oficial não
conferida). Isso só funciona se
  a migration for compatível com a imagem anterior (expandir, migrar, contrair); passo destrutivo
  (apagar coluna, tabela) é deploy à parte, depois que a versão nova se provou.
- O que a plataforma faz e o repositório não (comando de migration do deploy, `COOKIE_DOMAIN`, worker de fila,
  healthcheck do painel, CORS do bucket, compressão do proxy) mora em `docs/ARCHITECTURE.md`,
  seção Ambientes (`documentation.md`).

- **Banco e Redis sem porta pública.** Postgres, Mongo e Redis no Coolify ficam só na rede interna;
  Redis com senha no `REDIS_URL`; `docs/ARCHITECTURE.md` lista cada porta pública e o motivo
  (skill `security-audit`, CLOUD-AND-DEPLOYMENT.md). No Coolify (`DECISIONS.md` #295): o
  `REDIS_URL` (e o `DATABASE_URL`) usa a URL **interna** que o Coolify mostra no recurso, com o
  banco e a API na mesma rede (mesmo projeto e ambiente, ou a rede do Docker ligada no recurso);
  nenhum mapeamento de porta do Redis para o host (nada de `3000:6379` nas portas do recurso); e nada de
  `--cap-add SYS_ADMIN` nem outra capacidade extra nas opções do container. Com `REDIS_URL` presente,
  o recurso do worker (`node ace queue:work`, mesmo repositório e `Dockerfile-production` da API,
  sem healthcheck HTTP e sem domínio) existe antes do deploy que liga a fila (`backend.md` §4.12).
  (_doc-lib/coolify.md#databases.)

### 8.4 `docker-compose.yml`

Só infraestrutura local (banco, Redis, MinIO, SMTP de teste), em `backend/`. A aplicação roda
fora dele (`pnpm dev`). Portas próprias por projeto, pela tabela abaixo, para dois projetos subirem juntos na mesma
máquina, sempre com bind em `127.0.0.1` (`127.0.0.1:5433:5432`), nunca na rede toda; nome de container e volume prefixado com o projeto; imagem mantida (nada de imagem extinta
ou sem tag de versão).
Postgres é o 18 (`postgres:18-alpine`).

**Portas da casa** (`DECISIONS.md` #355). Projeto novo pega a próxima linha livre; interclasse e
curupira mudam de porta, porque colidiam com academy e aporta:

| Projeto | Banco | Storage (S3) | Console | Redis ou outro |
|---|---|---|---|---|
| simple-hub | 5432 | 9000 | 9001 | Redis 6379 |
| adacaibs | 5433 | 9002 | 9003 | |
| academy | 5434 | 9004 | 9005 | Redis 6382 |
| aporta | 5435 | 9006 | 9007 | |
| curupira | 5436 | 9010 | 9011 | |
| interclasse | 5437 | 9008 | 9009 | |
| matiscraft | 5438 | 9012 | 9013 | |
| manganga | 5439 | 9014 | 9015 | |
| maiyu.com.br | 5440 | 9016 | 9017 | |
| lowcodejs | Postgres 5532 | 9100 | 9101 | Mongo 27117 |

**MinIO só para teste; produção é S3 ou R2** *(decisão do dono; `DECISIONS.md` #209 e #210)*

- **MinIO jamais vai para produção.** Ele existe só no `backend/docker-compose.yml`, para dev e para
  os testes e2e (máquina e sessão de agente). Produção usa **S3** ou **R2**, pelo driver da
  FlyDrive (`_doc-lib/flydrive.md#services/s3`, `#services/r2`). `Dockerfile-production`, compose de
  produção, workflow de deploy e `docs/ENV.md` de produção nunca citam MinIO; o `pattern:check`
  reprova `minio` fora de `backend/docker-compose.yml` e `backend/infra/minio/`.
- **Agente e teste sobem o compose antes dos e2e**: `docker compose -f backend/docker-compose.yml up -d`
  e só então `test:e2e` do backend e do frontend; os endpoints de upload (`create`, `parts`,
  `complete`, leitura assinada) são exercitados contra ele. Na sessão de nuvem o `scripts/cloud-setup.sh`
  da régua inicia o `dockerd`.
- **A imagem é compilada do código-fonte numa release fixa.** O repositório comunitário do MinIO
  está sem manutenção e só distribui código-fonte (README oficial em
  `raw.githubusercontent.com/minio/minio/master/README.md`, conferido em 2026-10-14), e a imagem
  `minio/minio` saiu do Docker Hub (`pull access denied ... repository does not exist`, testado em
  2026-10-14). **Validado em 2026-10-14**: `minio` e `mc` compilados das releases abaixo, imagem
  montada, setup rodado e as regras de `backend.md` §5.4 provadas contra ele (resultado na tabela de
  lá). O build precisa de `proxy.golang.org`, `sum.golang.org` e `storage.googleapis.com` na rede.

```dockerfile
# backend/infra/minio/Dockerfile — teste local; nunca produção
FROM golang:1.24-alpine AS build
ARG MINIO_RELEASE=RELEASE.2025-10-15T17-29-55Z
ARG MC_RELEASE=RELEASE.2025-08-13T08-35-41Z
RUN apk add --no-cache git
ENV CGO_ENABLED=0
RUN git clone --depth 1 --branch "$MINIO_RELEASE" https://github.com/minio/minio /src/minio \
 && cd /src/minio && go build -trimpath -o /out/minio .
RUN git clone --depth 1 --branch "$MC_RELEASE" https://github.com/minio/mc /src/mc \
 && cd /src/mc && go build -trimpath -o /out/mc .

FROM alpine:3.22
COPY --from=build /out/minio /out/mc /usr/local/bin/
ENTRYPOINT ["minio"]
```

```yaml
# backend/docker-compose.yml (trecho)
services:
  minio:
    build: ./infra/minio
    image: <projeto>-minio-test:2025-10-15
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_API_CORS_ALLOW_ORIGIN: ${CORS_ORIGINS:-http://localhost:3000}
      MINIO_API_STALE_UPLOADS_EXPIRY: 24h            # multipart abandonado some sozinho
      MINIO_API_STALE_UPLOADS_CLEANUP_INTERVAL: 6h
    healthcheck:
      test: ['CMD', 'wget', '-q', '-O', '/dev/null', 'http://127.0.0.1:9000/minio/health/live']
      interval: 5s
      retries: 10
  minio-setup:
    image: <projeto>-minio-test:2025-10-15
    depends_on: { minio: { condition: service_healthy } }
    entrypoint: ['/bin/sh', '/setup/minio-setup.sh']
    env_file: .env
    volumes: ['./infra/minio:/setup:ro']
```

`backend/infra/minio/minio-setup.sh` (rodado e conferido em 2026-10-14; a limpeza de multipart do MinIO
é por ENV, `MINIO_API_STALE_UPLOADS_*` em `internal/config/api/api.go`, não por `mc ilm`):

```sh
#!/bin/sh
set -eu
mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mb --ignore-existing "local/$STORAGE_BUCKET"
mc anonymous set none "local/$STORAGE_BUCKET"
cat > /tmp/app-policy.json <<JSON
{ "Version": "2012-10-17", "Statement": [{ "Effect": "Allow",
  "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:AbortMultipartUpload","s3:ListMultipartUploadParts"],
  "Resource": ["arn:aws:s3:::$STORAGE_BUCKET/*"] }] }
JSON
mc admin policy create local app-rw /tmp/app-policy.json || true
mc admin user add local "$STORAGE_KEY" "$STORAGE_SECRET"
mc admin policy attach local app-rw --user "$STORAGE_KEY" || true
```

- A aplicação usa `STORAGE_KEY`/`STORAGE_SECRET` (usuário de escopo mínimo), nunca o root; o root
  só existe para o setup. Valores de teste no `.env.test`, nunca credencial real.
- A espera pelo MinIO é pelo bucket existir (§7, backend, passo 3).
- CORS: no MinIO é global (`MINIO_API_CORS_ALLOW_ORIGIN`); no R2 e no S3 é por bucket, com `ETag` em
  `ExposeHeaders`. O teste local prova o fluxo; o CORS de produção fica conferido em `docs/SECURITY.md`.

---

## 9. `.github` *(opinião da casa)*

- **Sem `.github/workflows/`** (§8.1, `DECISIONS.md` #298).
- **Proteção de branch em `main` e `develop`** (`DECISIONS.md` #298): só aceitam merge por PR, sem
  push direto (nem do dono) e sem check obrigatório do Actions, que não existe mais. Quem segura o
  PR é o hook local e a rodada de suítes da sessão, com o resultado no corpo do PR (§7). Configura-se
  no GitHub (Settings, Branches, ou Rulesets), fora do repositório: o sync não alcança, e o agente
  confere ao entrar no projeto (`gh api repos/<dono>/<repo>/branches/main/protection`). Check
  obrigatório que sobrou de um workflow apagado trava todo PR para sempre e sai da regra (página
  oficial do GitHub não conferida).
- **Dependabot** (`.github/dependabot.yml`): um bloco `npm` por pacote do workspace e um
  `docker`, sem o ecossistema `github-actions`, porque não há workflow (`DECISIONS.md` #355); semanal, `open-pull-requests-limit: 5`, um grupo para patch. Major do
  TypeScript ignorada (§0); major do `mongodb` passa normalmente. *Comportamento do Dependabot com
  pnpm workspace: página oficial não conferida.*

  ```yaml
  version: 2
  updates:
    - package-ecosystem: npm
      directories: [/backend, /frontend, /shared, /]
      schedule: { interval: weekly }
      open-pull-requests-limit: 5
      groups:
        patches: { update-types: [patch] }
      ignore:
        - dependency-name: typescript
          update-types: [version-update:semver-major]
    - package-ecosystem: docker
      directories: [/backend, /frontend]
      schedule: { interval: weekly }
  ```

- **`.gitignore` na raiz**, obrigatório, cada bloco com um comentário dizendo o motivo. Ignora
  `node_modules/`, `build/`, `.output/`, `.env` (o `.env.example` e o `.env.test` são versionados,
  `backend.md` §6), `src/paraglide/`, `project.inlang/cache/` (o `.gitignore` aninhado que o inlang gera nem sempre aparece; relato do jhollyfer.com.br), relatório de teste e de Playwright, e o que a árvore declara
  fora dela: `.idea/`, `.vscode/`, `.claude/worktrees/`, pastas de resultado, e
  `CLAUDE-SECURITY-*/` (relatório de varredura com cenário de exploração não vai para o histórico,
  §10.4).
- **Artefato gerado é commitado e conferido por `--check`**: `openapi.json` e
  `schema.generated.ts` (`openapi:check`), `authz-baseline.json` (`authz:check`),
  `routeTree.gen.ts` (a rodada antes do PR faz o build e reprova `git diff --exit-code` no arquivo, §7). Saída de
  compilador que todo build regenera (`src/paraglide/`, `.output/`, `build/`) não é commitada.

---

## 10. Pronto, revisão e depuração *(opinião da casa)*

Processo das etapas 5 a 7 do `AGENTS.md`. As skills (`systematic-debugging`,
`verification-before-completion`, `code-review`) executam; esta seção diz o que conta como feito.

### 10.1 Definição de pronto

- **Pronto é prova executada no `HEAD` atual.** Cada critério de aceite tem um teste ou comando,
  rodado depois da última mudança, com o comando e o resultado mostrados. Resultado anterior só vale
  se o repositório não mudou desde então.
- **Quatro estados por portão** (lint, typecheck, `pattern:check`, unit, e2e, build): passou,
  falhou, não executado, bloqueado. "Não executado" exige a tentativa registrada (comando + erro,
  como `docker ps` sem daemon); sem tentativa, o portão está não verificado e "pronto" não se diz.
  Falha que já existia fora do diff vira nota com referência, não bloqueio.
- **E2E só na fase final do plano** *(decisão do dono, `DECISIONS.md` #212)*: numa sessão que executa um plano (aplicar o padrão, migração, feature em várias fases), as
  fases constroem padrão, organização e arquitetura com **unitário** (TDD, `domain.md` §6), lint,
  typecheck, `pattern:check` e `depcruise`; o compose de teste não sobe e o `test:e2e` não roda. A
  **última fase do plano** sobe o compose (`docker compose -f backend/docker-compose.yml up -d`, §8.4),
  escreve ou ajusta os E2E que faltam (tabela de `backend.md` §5.4 inclusive) e roda `test:e2e` do
  backend e do frontend sobre o todo. Falha ali volta como tarefa da fase dona, não como remendo no
  teste. **Exceção da fase 0** (`DECISIONS.md` #242): plano que mexe em código que já existe
  (aplicar o padrão, migração, refatoração) abre com uma fase 0 que sobe o compose uma vez, escreve
  ou confere os E2E de caracterização dos fluxos críticos que o plano toca (cadastro, login,
  dinheiro, permissão, webhook) e registra o resultado como linha de base. As fases do meio seguem
  só com unitário; a final roda tudo e compara com a linha de base. Fora de plano, toda branch roda as suítes uma vez antes do PR (§7).
- **E2E local não usa a API de produção**: o `pnpm build` do frontend lê o `.env.production`
  versionado e embute os `VITE_*` de produção; o build do E2E local passa `VITE_API_URL` e
  `VITE_SITE_URL` do ambiente local na linha de comando, ou a suíte falha por CORS contra produção
  (relato do academy, 2026-11-11: 30 falhas falsas).
- **Critério atrás de ENV, sem instância real que se possa exercitar com segurança** (produção, por
  exemplo): prova-se pelo mecanismo de gating já exercitado em outro ambiente, e o relatório diz
  que é evidência indireta, não execução direta.
- **Pronto é a rodada antes do PR verde e, depois do merge na `main`, o deploy do Coolify concluído
  com o healthcheck verde**, os dois feitos ou acompanhados pelo agente até o fim e relatados (§6,
  §7, §8.3, `DECISIONS.md` #298): a rodada de §7 no `HEAD` empurrado, com o resultado no corpo do PR,
  prova portões e suítes; o deploy `finished` no Coolify e o `/health-check` de cada app respondendo
  `200` provam que o merge virou entrega. Vermelho em qualquer um é tarefa do agente na hora
  (§10.3).
- **Depois do primeiro deploy e de toda troca de infraestrutura** (recurso novo no Coolify, proxy,
  Cloudflare, Redis, domínio), pronto inclui a conferência em produção, feita pelo agente e
  relatada com o comando e o resultado (`DECISIONS.md` #296):
  - `curl -fsS <endereço>/health-check` da API e do frontend, `200` nos dois;
  - preflight CORS com credenciais: `curl -i -X OPTIONS <api>/<rota de escrita>` com `Origin` do
    frontend e `Access-Control-Request-Method: POST`, esperando `Access-Control-Allow-Origin` igual à
    origem (nunca `*`) e `Access-Control-Allow-Credentials: true`;
  - tempo de um `POST` de cadastro com corpo inválido: `422` em menos de um segundo. Lento aí é a
    requisição presa antes da validação (Redis, banco, proxy);
  - login de verdade com a conta do dono, pelo navegador ou pelo `curl` com o cookie, e uma rota
    privada respondendo depois dele.
  O E2E local não substitui essa conferência: ele roda sem Cloudflare, Redis de produção nem
  Coolify, e uma suíte E2E inteira verde convive com cadastro e login quebrados em produção.
- **Verificar não amplia escopo**: ao verificar não se edita produto nem se acrescenta teste fora do
  critério. Achado vira linha em `docs/TASKS.md`.
- **Atalho de teste é proibido** e cobrado (§4, §7): `.only`, `.skip` ou `test.fixme` sem motivo e
  tarefa, `.pin()` do Japa esquecido, asserção afrouxada, `--no-verify`, `if (process.env.CI) return`.
  Enfraquecer teste para passar é a regra de `domain.md` §10.
- **Japa**: `tests/bootstrap.ts` registra `disallowPinnedTests({ disallow: Boolean(process.env.CI) })`
  (de `@japa/runner/plugins`) em `plugins`. Com `.pin()` esquecido, o runner roda só o teste fixado
  e a rodada fica verde sem a suíte; com `CI=1` (§7) o plugin reprova (_doc-lib/japa.md#docs/filtering-tests).
- Entrega sem `// TODO` sem dono, sem `// ...` e sem stub no lugar do que foi pedido.

### 10.2 Revisão de código

- **Ferramenta primeiro, olho depois**: `check` e os testes do diff rodam antes da leitura. O que
  lint, typecheck, `pattern:check` e `authz:check` pegam não vira comentário; achado determinístico
  (padrão proibido, nome) vira regra de lint ou de `pattern:check` no mesmo ciclo.
- **Duas trilhas, dois relatórios**: régua (`_standards/`, `docs/RULES.md`, `code-pattern`) e spec
  (`.specs/features/<f>/spec.md` ou a linha de `docs/TASKS.md`), sem fundir nem reordenar. Sem spec,
  a trilha diz "sem spec".
- **Evidência ou silêncio**: achado interno cita `arquivo:linha` relido; achado sobre biblioteca cita
  a entrada da `_doc-lib` e a página oficial (`DECISIONS.md` #114).
- **Decisão sem contrato é bloqueador**: uso de biblioteca novo ou mudado no diff (API, opção,
  padrão) sem a página oficial citada no commit, no PR ou no comentário de "por quê" volta para o
  autor. O revisor abre a mesma página antes de aprovar. Duplicação cita os dois lugares.
  Afirmação de PR ("corrige a corrida") sem teste que falha antes e passa depois vira pergunta.
- **Ordem de leitura**: correção e dado, segurança, manutenção, desempenho, estilo.
- **Segurança**: injeção (SQL, NoSQL, comando), XSS, CSRF, falha de autenticação e de autorização
  (posse do recurso, 404 quando a existência é segredo, `backend.md` §4.6), segredo ou credencial
  no código, desserialização insegura, path traversal em nome de arquivo do storage, SSRF em URL
  vinda do usuário, upload sem teto de tamanho e tipo.
- **Desempenho**: N+1 (relação lida em laço sem `preload`), consulta ou laço sem limite (listagem
  sempre paginada), índice ausente para o filtro novo, recurso que não é liberado.
- **Correção**: entrada vazia, nula e no limite; corrida e concorrência (idempotência por índice
  único, não por `find` antes do `insert`); erro propagado como `Either`, nunca engolido.
- **Bypass que o revisor procura**: `eslint-disable` e `@ts-expect-error` sem motivo ao lado,
  `as unknown as`, `!`, `catch` que engole, `.skip`, retry em volta de bug determinístico, número ou
  texto mágico de regra de negócio, `TODO` sem dono, código comentado.
- **Severidade e veredito**: bloqueador (perda de dado, auth, dinheiro, migration irreversível, PII
  em log) pede mudança; "deve corrigir" comenta; detalhe tem no máximo 5 comentários inline, o resto
  contado; problema pré-existente só no resumo. Rodada 1 completa; a seguinte só confere a correção
  e o que ela introduziu; a terceira fecha (corrigido, tarefa ou fora da thread). Aprova-se quando o
  diff melhora o código, mesmo imperfeito.
- **Voz**: primeira linha diz problema e local (`arquivo:linha: problema. correção.`); correção
  mais barata primeiro (helper do projeto, stdlib, plataforma, dependência instalada, código novo);
  sem elogio, sem emoji, em pt-BR.

### 10.3 Depuração

- **Sem laço vermelho, sem hipótese.** Antes de ler código para teorizar, existe um comando já
  executado que reproduz o sintoma exato: determinístico, em segundos, sem humano. Ordem de
  costura: teste na camada (unitário do use-case com repository em memória, E2E da ação, spec
  Playwright), `curl` contra o servidor de dev, script de replay, `git bisect run`.
- **Minimizar, depois 3 a 5 hipóteses falsificáveis** ("se X é a causa, mudar Y faz sumir"),
  mostradas ao dono antes de testar; uma variável por vez.
- **Log temporário com prefixo único** (`[DEBUG-a4f2]`), removido por `grep` antes do commit; o
  `no-console` (§4) pega o esquecido. Saída mostrada é redigida: segredo vira `<REDACTED>`.
- **Teste de regressão antes do fix, na costura certa**: bug de costura (middleware, policy,
  serialização) no E2E da ação; bug de regra no unitário da entidade ou do use-case. Sem costura que
  reproduza o padrão real, é achado de arquitetura (`docs/TASKS.md`), não teste raso.
- O commit `fix(...)` diz a causa confirmada no corpo.
- **Regressão de desempenho**: medir antes (baseline com `performance.now`, `EXPLAIN`, trace do
  navegador), bisect depois. Log não mede.


### 10.4 Varredura de segurança com `claude-security` *(opinião da casa)*

Plugin oficial `claude-security@claude-plugins-official` (`AGENTS.md`, "Plugins obrigatórios").
Roda dentro da sessão, com as permissões dela; serve para código da casa, não para repositório de
terceiro.

- **Ao entrar num projeto** para aplicar o padrão: "Scan codebase" do repositório inteiro, esforço
  `medium` ou mais. Cada achado confirmado vira linha em `_findings/<projeto>.md` no upstream (seção
  de segurança, com a severidade do relatório) e, no projeto, linha de prioridade Alta em
  `docs/TASKS.md`.
- **Antes do PR**, "Scan changes" em `high` quando o diff toca a borda: rota, middleware, sessão ou
  cookie, policy, validator, upload, webhook, ENV, SQL ou consulta crua, dependência nova. O resto
  do diff fica com a revisão de §10.2.
- **Patch sugerido não se aplica como veio**: entra pelo fluxo normal, com teste que falha antes e
  passa depois (`superpowers:test-driven-development`), `code-pattern` e `check`. A forma da
  correção é a da régua (`backend.md` §4.10, §5.4, §5.5), não a do patch.
- **Relatório fica fora do git**: `CLAUDE-SECURITY-<timestamp>/` está no `.gitignore` (§9). O que
  sobrevive é a linha em `docs/TASKS.md` ou `docs/SECURITY.md`, com arquivo e linha, nunca o
  cenário de exploração nem valor de segredo.
- Falso positivo sai com motivo, como em `_findings/README.md` (`descartado: <motivo>`).

### 10.5 Modelo por etapa: Opus planeja, Sonnet executa *(opinião da casa)*

Todo planejamento é do **Opus 5.5** (`claude-opus-5-5`): brainstorming, spec, design, plano, quebra em
tarefas, decisão de arquitetura e replanejamento quando a execução sai do plano. Toda execução do
plano é do **Sonnet 5.5** (`claude-sonnet-5-5`): implementar tarefa, escrever teste, corrigir lint ou
suíte, migrar arquivo. Revisão final do diff (etapa 7) volta para o Opus, porque é o mesmo julgamento do
plano. Etapas: 1 e 3 Opus; 4 a 6 Sonnet; 7 Opus (`AGENTS.md`, fluxo).

Como se cobra:

- **Sessão:** modelo `opusplan`, que usa Opus no modo de plano e Sonnet fora dele. Por projeto, no
  `.claude/settings.json`; o dono cola, porque o agente não edita esse arquivo:

  ```json
  "model": "opusplan",
  "env": {
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-5-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5-5",
    "CLAUDE_CODE_SUBAGENT_MODEL": "claude-sonnet-5-5"
  }
  ```

  `opusplan` usa o alias `opus` no modo de plano e `sonnet` fora dele. Na API da Anthropic os dois
  apontam hoje para Opus 5.5 e Sonnet 5.5, mas alias acompanha a versão nova sozinho: as duas
  `ANTHROPIC_DEFAULT_*` fixam a versão, e trocar de versão vira decisão registrada. Pede Claude
  Code v2.1.284 ou mais novo (Sonnet 5.5; Opus 5.5 pede v2.1.280). Na sessão em nuvem, as mesmas
  variáveis entram nas variáveis de ambiente do ambiente.
- **Subagente:** executor (implementador de tarefa, `superpowers:subagent-driven-development`,
  `tlc-implement`, `dispatching-parallel-agents` de execução) roda em Sonnet: a variável vale para
  o subagente que não recebe modelo de outro jeito. Ordem da doc: modelo passado na chamada >
  `model` da definição do subagente (inclusive `inherit`) > `CLAUDE_CODE_SUBAGENT_MODEL` > modelo da
  conversa. Então subagente de planejamento ou de revisão final recebe `model: "opus"` na própria
  chamada. Os embutidos `Plan` e `Explore` herdam o modelo da conversa (não leem a variável sem o
  `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`, que a casa não usa): no modo de plano do `opusplan` eles rodam
  em Opus, que é o desejado.
- Sem `opusplan` disponível, o agente diz qual modelo está rodando antes de planejar e pede a troca
  (`/model`) em vez de planejar no modelo de execução.

Conferido em 2026-10-26: `_doc-lib`-equivalente ainda não existe para o Claude Code; as páginas
usadas foram `https://code.claude.com/docs/en/model-config.md` (aliases, `opusplan`, versões, fixar
versão) e `https://code.claude.com/docs/en/sub-agents.md` ("Choose a model", embutidos).

### 10.6 Suíte que não leva horas *(opinião da casa, a partir de Twenty, n8n, Medusa, Cal.com, Payload e Immich; `DECISIONS.md` #253)*

Qualidade é toda rota e toda jornada crítica provadas; tempo é o que decide se a prova roda. Os seis
projetos fazem o mesmo, e a casa adota:

| Peça | Regra | Contrato |
|---|---|---|
| Banco | sobe **uma vez** por execução (compose ou `globalSetup`), migra e semeia uma vez; cada worker ganha um clone: no Postgres, `CREATE DATABASE <worker> TEMPLATE <base>`; no Mongo, banco próprio do worker, limpo por `deleteMany` entre arquivos e reaplicando o seed salvo | `_doc-lib/vitest.md#config/globalsetup`; `_doc-lib/japa.md#docs/test-suites` |
| Aplicação | o kernel sobe uma vez por worker e a rota é chamada por `inject`/`supertest`, sem porta aberta; `isolate: false`, e o spec que suja estado global vai para um projeto isolado à parte | `_doc-lib/vitest.md#config/isolate`, `#improving-performance` |
| Redis e fila | um prefixo por worker (`test:<worker>:`), a mesma regra de namespace de `backend.md` §5.7 item 15; nada de uma instância de Redis por fatia | `backend.md` §5.7 |
| Paralelismo | vários workers (`maxWorkers`), cada um no seu banco e no seu prefixo | `_doc-lib/vitest.md#config/maxworkers` |
| Rodada antes do PR | suíte inteira **uma vez por branch**, antes do PR (§7); shards (`--shard=i/N` no Vitest, no Japa e no Playwright) só quando a rodada passar do tempo aceitável; reexecução só do que falhou (`--last-failed` no Playwright) | `_doc-lib/vitest.md#improving-performance`; `_doc-lib/playwright.md#docs/test-sharding`; `_doc-lib/japa.md#docs/filtering-tests` (shard na mesma máquina tem banco, cache e porta próprios) |
| Navegador | Playwright só nas jornadas críticas (login, dinheiro, a feature principal), login reaproveitado por `storageState` e dado criado pela API, não clicado | `_doc-lib/playwright.md#docs/auth`, `#docs/test-parallel` |
| Tela e componente | Vitest + Testing Library com rede mockada (MSW ou `fetch` mockado); a resposta mockada passa pelo schema Zod de `shared/`, para o front quebrar quando o contrato mudar | `_doc-lib/vitest.md`, `_doc-lib/zod.md#basics` |

**Durante o trabalho, só o afetado; a suíte inteira uma vez, antes do PR.** Enquanto a branch anda, a
sessão roda o unitário, a integração **afetada** (`vitest run --changed origin/main`; no Japa,
`--files` dos specs tocados) e as jornadas Playwright da feature (`--only-changed origin/main`),
pelo script `test:changed` de cada app, que compara com `origin/main` (`DECISIONS.md` #348). Com a
branch pronta, a rodada de §7 roda as suítes inteiras uma vez e o resultado vai no corpo do PR
(`DECISIONS.md` #298). Sem Actions, essa rodada é a última prova antes do merge.

*MSW sem entrada na `_doc-lib`: não coberto; entra quando um projeto o adotar, com a página aberta.*

### 10.7 Orquestração de sessões e agentes *(opinião da casa; `DECISIONS.md` #364)*

Trabalho que passa de um projeto, ou de uma fase dentro de um projeto, é orquestrado: nenhum agente e
nenhuma sessão recebe um bloco grande sozinho. O defeito que isso evita é o agente que carrega uma fase
inteira, perde o contexto no meio, marca como pronto o que não fez e ninguém confere.

Camadas, cada uma com a sua ferramenta:

| Camada | Quem | Ferramenta |
|---|---|---|
| Regente geral (entre projetos e upstream) | a sessão em que o dono conversa | `send_message` para as regentes de projeto, quadro em `_standards/_map/<rodada>/QUADRO.md` |
| Regente do projeto | uma sessão por projeto (`create_session` com o repositório dele) | quebra cada fase do plano em itens, despacha, revisa, abre a PR; não executa item |
| Sub-sessões shared, backend e frontend | uma sessão por pasta do projeto, abertas pela regente (`create_session`, mesmo repositório); projeto sem uma das pastas não tem a sub-sessão dela | executam todo item de resolução, correção e melhoria do seu lado, com seus subagentes; reportam à regente do projeto |
| Item G (fase 2 ou 3 do plano, feature) | subagentes do projeto | `tlc-plan` (plano aprovado pelo dono) e `tlc-implement` (lotes, verificador independente, provas por script) |
| Item P ou M | um subagente por item | `superpowers:subagent-driven-development`, worktree e branch próprias (#311) |
| Mapeamento ou auditoria em massa | fan-out de leitura | `Workflow` (fatia por projeto e lado, cético que tenta refutar cada achado grave, consolidação) |

Regras:

- **Regente e uma sub-sessão por pasta, sempre (`DECISIONS.md` #425).** Todo projeto trabalha com a
  regente do projeto e uma sub-sessão fixa para cada pasta que ele tem: `shared/` (contrato: schema Zod,
  resposta, enum, código de erro, Money), `backend/` e `frontend/`. Toda resolução, correção e melhoria
  passa por elas. A regente não codifica: planeja, distribui, integra, manda verificar e cuida das PRs, e
  é a única que fala com a regente geral. Mudança de contrato nasce na sub-sessão shared, que a anuncia
  às outras antes do commit; backend e frontend confirmam e só então consomem. As três conversam direto
  (`send_message` com o `session_id` umas das outras) e copiam a regente em decisão de contrato,
  bloqueio e fim de item. Item fechado: push, PR em rascunho até o verificador, `docs/TASKS.md` e
  `docs/MEMORY.md` ("Parou em"), aviso às outras sub-sessões e à regente.
- **Um item por agente, escopo fechado.** Item G vira vários. Agente que edita usa worktree e branch
  próprias; ninguém faz commit do trabalho de outro.
- **Autor nunca verifica o próprio trabalho.** Todo item fecha com um verificador novo (o do
  `tlc-implement`, o revisor da `subagent-driven-development` ou o cético do `Workflow`).
  O brief do verificador manda rodar os scripts de Python com `PYTHONDONTWRITEBYTECODE=1` (o das skills,
  como o do `tlc-plan`, grava `__pycache__/` ao lado do script): o cache nasce no worktree de quem
  verifica e, sem isso, vira arquivo não rastreado que alguém commita por engano. A raiz do kit ignora
  `__pycache__/` e `*.pyc`, e o sync não os espelha (`DECISIONS.md` #439).
- **As sessões conversam.** A regente do projeto reporta à regente geral cada item fechado, bloqueio e
  pergunta para o dono por `send_message`; onde a sessão não consegue responder, a regente geral lê o
  transcrito (`list_events`). O estado de cada projeto fica no `docs/TASKS.md` dele, o geral no
  `QUADRO.md`.
- **Comando recusado: pare e relate, não reformule.** Recusa da trava de permissão, do modo automático
  ou de um hook (`maiyu-guard`, `git-guard`) é resposta, não obstáculo: o agente não troca o comando
  por script, arquivo, heredoc ou outro caminho que chegue ao mesmo efeito. Relata à regente, que leva
  ao dono; vale para todo brief de subagente (`DECISIONS.md` #373). A exceção é a recusa que prescreve a
  própria forma aceita sem mudar o risco (a trava de worktree que pede para dividir um comando encadeado
  em comandos simples dentro da worktree, ou caminho absoluto no lugar de valor calculado): seguir a
  forma pedida é permitido e se relata. Recusa por risco (privilégio, rede, código de fora, apagar,
  reescrever histórico, hook de guarda) nunca se contorna.
- **Lacuna de régua ou de kit nunca se corrige no projeto.** A regente do projeto manda para a regente
  geral; a correção sai no `maiyu-pattern` e volta pelo sync (#226).
- **O que um projeto resolve vira roteiro do próximo (`DECISIONS.md` #430).** Problema achado num
  projeto que pode estar em outro, e decisão que serve a mais de um, vão na hora para as regentes dos
  projetos afetados (`send_message`), com a causa, como se resolveu (commit ou PR) e como conferir lá;
  cópia para a regente geral, que repassa aos que a regente do projeto não alcançar e leva ao upstream
  o que for de régua ou de kit. Nenhuma sessão resolve de novo, de outro jeito, o que outro projeto já
  resolveu.
- **Segurança em paralelo, o resto em ordem.** A fase 0 de todos os projetos corre junta; as fases 1 a
  4 seguem a ordem do plano, uma regra de passagem por passo (`--check` limpo, `check` verde, suítes
  pesadas antes da PR).
- **Limites que nenhuma camada passa:** merge, rotação de credencial e reescrita de histórico são do
  dono; nenhuma PR, branch ou commit leva nome de agente (§6). Custo: o fan-out gasta mais token por
  tarefa e compra cobertura e verificação; tarefa pequena (até três passos) não se orquestra.

Ferramenta de terceiro (claude-flow/Ruflo, Agent Army e parecidas) não entra: o TLC cobre a porta de
verificação e a checagem de tarefa marcada como pronta sem prova, e as sessões e o `Workflow` cobrem o
paralelismo.
