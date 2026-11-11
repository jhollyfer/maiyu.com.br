# Shiki

Realce de código por gramática TextMate, a mesma do VS Code: o código sai em HTML, HAST ou tokens,
com as cores do tema.

Última verificação: 2026-11-08 (fonte: `docs/.vitepress/config.ts` de shikijs/shiki, branch `main`)

> Conferido contra `shiki@4.6.0` (latest).

**O que é:** um realçador que roda no Node e no navegador. Cada linguagem é uma gramática TextMate e
cada tema um tema do VS Code; um motor de regex (Oniguruma em WASM ou o motor em JavaScript) aplica a
gramática. A entrada `shiki` traz todas as linguagens e temas como chunks carregados sob demanda; a
entrada `shiki/core` não traz nenhum, e o projeto importa só os que usa.

**Para que serve:** realçar o código que o usuário lê (aula, documentação, post técnico) e a saída de
terminal. Na régua o Shiki entra só pelo `lib/highlighter.tsx` que o `code-block` do shadcn instala
(`tooling.md` §0.1, `frontend.md` §6.6, `_doc-lib/shadcn.md#code-block`); nenhum outro realçador.

**Como usar:**

```bash
pnpm add shiki
```

```ts
import githubDark from '@shikijs/themes/github-dark'
import githubLight from '@shikijs/themes/github-light'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

// uma instância só, criada uma vez: montar o highlighter é caro
const highlighterPromise = createHighlighterCore({
  themes: [githubLight, githubDark],
  langs: [import('@shikijs/langs/typescript'), import('@shikijs/langs/bash')],
  engine: createJavaScriptRegexEngine(),
})

export class CodeHighlighter {
  async tokens(code: string, lang: 'typescript' | 'bash') {
    const highlighter = await highlighterPromise
    // tokens atravessam a rede numa server function; nó React não
    return highlighter.codeToTokens(code, {
      lang,
      themes: { light: 'github-light', dark: 'github-dark' },
    })
  }
}
```

**Links:** 21.

**Skills:** `maiyu-frontend`, `server-side-rendering`, `vite-bundle-optimization`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com Shiki: projeto segue, e regra de `_standards/` que contradiga
uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Montagem

- **Crie o highlighter uma vez e reutilize a instância; chame `dispose()` quando ela não for mais usada.** Criar a instância é caro, e ela não é coletada pelo GC sozinha. [`#guide/best-performance`](https://shiki.style/guide/best-performance)
- **App web usa o bundle fino (`shiki/core` com `@shikijs/langs/*` e `@shikijs/themes/*` importados um a um), não a entrada `shiki`.** As linguagens e temas da entrada cheia não carregam se não usados, mas somam no tamanho do build do navegador. [`#guide/bundles`](https://shiki.style/guide/bundles)
- **Liste as linguagens e os temas explicitamente.** A doc diz que é o que dá o melhor desempenho, e no bundle fino só o importado entra no build. [`#guide/install`](https://shiki.style/guide/install)
- **No navegador, motor JavaScript (`createJavaScriptRegexEngine`); Oniguruma só no Node ou no build, quando tamanho e WASM não importam.** O motor JavaScript dispensa o WASM e sobe mais rápido; o Oniguruma dá a compatibilidade máxima de gramática. [`#guide/regex-engines`](https://shiki.style/guide/regex-engines)
- **Não use as linguagens pré-compiladas (`@shikijs/langs-precompiled`).** A página avisa que ainda não são suportadas, por um defeito conhecido que afeta muitas linguagens. [`#guide/regex-engines`](https://shiki.style/guide/regex-engines)
- **Render próprio (fora do `codeToHtml`) parte de `codeToTokens` ou `codeToHast`.** São a estrutura intermediária que a doc oferece para quem monta o HTML. [`#guide/install`](https://shiki.style/guide/install)
- **Highlighter síncrono (`createHighlighterCoreSync`) recebe temas e linguagens como objeto e um motor explícito; o Oniguruma é resolvido antes.** O motor Oniguruma só nasce de forma assíncrona. [`#guide/sync-usage`](https://shiki.style/guide/sync-usage)

### Tema claro e escuro

- **Dois temas vão em `themes: { light, dark }`, e o CSS do projeto troca para `--shiki-dark` pela classe (`html.dark .shiki`) ou pela media query.** O Shiki só grava as cores do segundo tema em variáveis CSS; sem o CSS a página não reage ao tema. [`#guide/dual-themes`](https://shiki.style/guide/dual-themes)
- **Para controlar a cor sem `!important`, `defaultColor: false` e as variáveis no CSS do projeto.** Sem cor padrão o HTML sai sem estilo próprio. [`#guide/dual-themes`](https://shiki.style/guide/dual-themes)
- **Saída de terminal com cor usa a linguagem `ansi`.** É a linguagem especial que a doc oferece para saída de terminal. [`#languages`](https://shiki.style/languages)

### Transformers e rehype

- **Os transformers de `@shikijs/transformers` só aplicam classes; o CSS deles é do projeto.** O pacote não traz estilo. [`#packages/transformers`](https://shiki.style/packages/transformers)
- **Com `@shikijs/rehype` e bundle fino, use `rehypeShikiFromHighlighter` de `@shikijs/rehype/core` com o highlighter do projeto.** O plugin padrão importa o bundle cheio. [`#packages/rehype`](https://shiki.style/packages/rehype)
- **No `@shikijs/rehype`, não conte com o hook `postprocess`.** Ele só roda quando a saída é string HTML (`codeToHtml`), e o rehype opera sobre HAST. [`#packages/rehype`](https://shiki.style/packages/rehype)

### Versão

- **Shiki 4 exige Node 20 ou mais; da v3 sobe direto para a v4.** A v4 só tirou o Node 18 e as APIs depreciadas. [`#guide/migrate`](https://shiki.style/guide/migrate)
- **Não use `@shikijs/compat`.** O pacote de compatibilidade da v0 não é mantido desde a v3. [`#guide/compat`](https://shiki.style/guide/compat)

---

## Guia

#### guide
[doc](https://shiki.style/guide/) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/index.md)

**O que é:** a apresentação do Shiki: gramática e tema do VS Code, tudo em ESM carregado sob demanda,
e a tabela de tamanho de cada bundle.
**Para que serve:** entender o que a lib faz e quanto pesa antes de escolher a entrada.
**Quando usar:** antes do primeiro uso no projeto.

#### guide/install
[doc](https://shiki.style/guide/install) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/install.md)

**O que é:** instalação, os atalhos (`codeToHtml`), o `createHighlighter`, `codeToTokens` e
`codeToHast`, o bundle fino, CJS, CDN e Cloudflare Workers.
**Para que serve:** escolher entre atalho e instância, e pegar tokens para render próprio.
**Quando usar:** ao montar o `lib/highlighter.tsx` ou a server function que devolve tokens.

#### guide/bundles
[doc](https://shiki.style/guide/bundles) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/bundles.md)

**O que é:** os bundles prontos (`shiki/bundle/full`, `shiki/bundle/web`) e o bundle fino sobre
`shiki/core`.
**Para que serve:** pôr no build só as linguagens e os temas que o projeto exibe.
**Quando usar:** em todo uso no navegador.

#### guide/dual-themes
[doc](https://shiki.style/guide/dual-themes) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/dual-themes.md)

**O que é:** saída com tema claro e escuro (ou vários) por variáveis CSS, o CSS por classe ou por
media query, `defaultColor: false` e `light-dark()`.
**Para que serve:** o bloco de código seguir o tema da página sem realçar duas vezes.
**Quando usar:** sempre que o projeto tem modo escuro.

#### guide/shorthands
[doc](https://shiki.style/guide/shorthands) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/shorthands.md)

**O que é:** os atalhos assíncronos que carregam tema e linguagem no primeiro uso e mantêm um
highlighter interno, e como criar atalhos sobre o bundle fino.
**Para que serve:** reduzir o tempo de subida quando o realce pode ser assíncrono.
**Quando usar:** ao decidir entre atalho e instância criada à mão.

#### guide/best-performance
[doc](https://shiki.style/guide/best-performance) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/best-performance.md)

**O que é:** as práticas de desempenho: instância única, bundle fino, atalhos, motor JavaScript e
worker.
**Para que serve:** realce que não pesa na subida nem trava a thread principal.
**Quando usar:** ao montar o highlighter e ao revisar o tamanho do bundle.

#### guide/decorations
[doc](https://shiki.style/guide/decorations) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/decorations.md)

**O que é:** a API de decorações, que envolve um intervalo do código com classe e atributo.
**Para que serve:** marcar trecho (linha destacada, palavra) por posição, sem comentário no código.
**Quando usar:** ao destacar parte do código exibido.

#### guide/transformers
[doc](https://shiki.style/guide/transformers) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/transformers.md)

**O que é:** os hooks que alteram o resultado (`preprocess`, `tokens`, `span`, `line`, `code`, `pre`,
`root`, `postprocess`), o `meta` e a ordem dos transformers (`enforce: 'pre' | 'post'`).
**Para que serve:** mudar a marcação gerada sem pós-processar string.
**Quando usar:** ao escrever transformer próprio.

#### guide/theme-colors
[doc](https://shiki.style/guide/theme-colors) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/theme-colors.md)

**O que é:** cor que não é hex no tema, `colorReplacements` e o tema de variáveis CSS.
**Para que serve:** ligar as cores do realce aos tokens do tema do projeto.
**Quando usar:** quando o tema pronto não casa com a identidade visual.

#### guide/regex-engines
[doc](https://shiki.style/guide/regex-engines) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/regex-engines.md)

**O que é:** os dois motores (Oniguruma em WASM e JavaScript), o `target` do motor JavaScript e as
linguagens pré-compiladas.
**Para que serve:** escolher o motor por ambiente: JavaScript no navegador, Oniguruma onde a
compatibilidade pesa mais que o tamanho.
**Quando usar:** ao criar o highlighter.

#### guide/sync-usage
[doc](https://shiki.style/guide/sync-usage) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/sync-usage.md)

**O que é:** o `createHighlighterCoreSync` e o que ele exige: temas e linguagens como objeto e motor
explícito.
**Para que serve:** realçar em contexto que não pode esperar promessa.
**Quando usar:** só quando a parte assíncrona não cabe na inicialização.

#### guide/grammar-state
[doc](https://shiki.style/guide/grammar-state) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/grammar-state.md)

**O que é:** o `GrammarState`, que realça um trecho a partir do contexto de gramática de outro
(`getLastGrammarState`, `grammarState`).
**Para que serve:** realçar fragmento solto (um tipo, uma expressão) como se estivesse no arquivo.
**Quando usar:** ao exibir trecho que fora de contexto sai com cor errada.

#### guide/load-theme
[doc](https://shiki.style/guide/load-theme) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/load-theme.md)

**O que é:** carregar tema próprio passando o objeto do tema em `themes`.
**Para que serve:** usar um tema que não vem no pacote.
**Quando usar:** quando nenhum tema pronto serve (veja `themes` antes).

#### guide/load-lang
[doc](https://shiki.style/guide/load-lang) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/load-lang.md)

**O que é:** carregar gramática TextMate própria em `langs` e criar apelido de linguagem.
**Para que serve:** realçar linguagem que não vem no pacote ou aceitar outro nome para ela.
**Quando usar:** quando a linguagem falta na lista (veja `languages` antes).

#### guide/migrate
[doc](https://shiki.style/guide/migrate) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/migrate.md)

**O que é:** o roteiro de migração por versão (v3, v2, v1, v0.14 e Shikiji), com as quebras de cada
uma.
**Para que serve:** subir de major sem quebra calada.
**Quando usar:** a cada nova major.

#### guide/compat
[doc](https://shiki.style/guide/compat) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/compat.md)

**O que é:** o build de compatibilidade para quem vinha da v0, sem manutenção desde a v3.
**Para que serve:** saber que ele existe e que não deve ser usado.
**Quando usar:** só ao migrar código antigo que ainda o importa.

## Referências

#### themes
[doc](https://shiki.style/themes) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/themes.md)

**O que é:** a lista dos temas que vêm no pacote e os temas especiais.
**Para que serve:** achar o id do tema antes de importar `@shikijs/themes/<id>`.
**Quando usar:** ao escolher o tema claro e o escuro.

#### languages
[doc](https://shiki.style/languages) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/languages.md)

**O que é:** a lista das linguagens que vêm no pacote e as especiais (`text` e `ansi`).
**Para que serve:** achar o id da linguagem e o apelido aceito.
**Quando usar:** ao montar a lista `langs` do `lib/highlighter.tsx` e ao exibir saída de terminal.

#### references/engine-js-compat
[doc](https://shiki.style/references/engine-js-compat) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/references/engine-js-compat.md)

**O que é:** a tabela de compatibilidade de cada gramática com o motor JavaScript.
**Para que serve:** conferir se a linguagem exibida realça igual sem o Oniguruma.
**Quando usar:** ao adicionar linguagem nova com o motor JavaScript.

## Pacotes

#### packages/transformers
[doc](https://shiki.style/packages/transformers) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/packages/transformers.md)

**O que é:** os transformers prontos de `@shikijs/transformers`: diff, destaque de linha e de
palavra, foco, nível de erro, espaço visível, guia de indentação, número de linha, e o
`matchAlgorithm` da notação em comentário.
**Para que serve:** marcar diff, destaque e foco por comentário no código, sem transformer próprio.
**Quando usar:** ao exibir diff ou destacar linha no bloco de código.

#### packages/rehype
[doc](https://shiki.style/packages/rehype) | [markdown](https://raw.githubusercontent.com/shikijs/shiki/main/docs/packages/rehype.md)

**O que é:** o plugin `@shikijs/rehype` para o pipeline unified (remark e rehype), o
`rehypeShikiFromHighlighter` para bundle fino, código inline e o limite do `postprocess`.
**Para que serve:** realçar o código de markdown renderizado (post, documentação) com o mesmo
highlighter.
**Quando usar:** quando o texto rico chega como markdown e passa por rehype.
