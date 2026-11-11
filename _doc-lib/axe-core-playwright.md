# @axe-core/playwright

API encadeável do axe-core para o Playwright: injeta o motor em todos os frames da página e devolve
as violações de acessibilidade.

Última verificação: 2026-11-08 (fonte: `packages/playwright/` de dequelabs/axe-core-npm, branch `develop`)

> Conferido contra `@axe-core/playwright@4.14.0` (latest).

**O que é:** o `AxeBuilder`, que recebe a `Page` do Playwright, escolhe o que analisar (`include`,
`exclude`), quais regras rodam (`withTags`, `withRules`, `disableRules`, `options`) e roda
`analyze()`, que devolve o resultado do axe-core (`violations`, `passes`, `incomplete`). O pacote
não segue SemVer: major e minor são os do axe-core que ele embute (a 4.14.0 depende de
`axe-core ~4.14.0`).

**Para que serve:** a checagem automática de acessibilidade do E2E: fluxo crítico e
`responsive.spec.ts` reprovam violação `serious`/`critical` (`frontend.md` §11.2). Como montar a
varredura dentro do Playwright Test (fixture `makeAxeBuilder`, `withTags` de WCAG, snapshot de
violação conhecida, anexo do resultado) está na página do Playwright, já em
_doc-lib/playwright.md#docs/accessibility-testing; este arquivo cobre só o que é do pacote.

**Como usar:**

```bash
pnpm add -D @axe-core/playwright
```

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('página inicial sem violação séria', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // interior de iframe de terceiro fora, o <iframe> continua checado (frontend.md §11.2)
    .exclude({ fromFrames: ['iframe', 'body'] })
    .analyze()
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(blocking).toEqual([])
})
```

O objeto `{ fromFrames: [...] }` não aparece no README, que documenta só seletor em string; ele é
aceito pelo tipo publicado (`exclude(selector: SerialFrameSelector)`, que inclui o seletor por
frames do axe-core).

**Links:** 3.

**Skills:** `playwright-skill`, `web-accessibility`, `maiyu-frontend`, `superpowers:test-driven-development`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com `@axe-core/playwright`: projeto segue, e regra de
`_standards/` que contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página
de onde saiu. As decisões da varredura dentro do teste (esperar o estado da página, fingerprint no
snapshot, teste manual junto) estão em _doc-lib/playwright.md, "Decisões que a doc impõe".

### Versão

- **A versão do `@axe-core/playwright` se lê como a do axe-core embutido, não como SemVer: minor novo é axe-core novo.** O pacote não segue SemVer, e major e minor são os do axe-core que ele usa. [`#packages/playwright/README/getting-started`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md#getting-started)

### Montagem

- **`new AxeBuilder({ page })` recebe a `Page` do teste.** O construtor exige a instância do Playwright como primeiro argumento. [`#packages/playwright/README/axebuilder`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md#axebuilder-page-playwrightpage)
- **Mais de um seletor em `include` ou `exclude` se passa em chamadas encadeadas, uma por seletor.** Array de seletores com mais de um item não é suportado. [`#packages/playwright/README/axebuilder`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md#axebuilder-page-playwrightpage)
- **`options()` não se mistura com `withTags()`, `withRules()` ou `disableRules()` no mesmo builder.** `options()` sobrescreve tudo o que foi configurado antes, inclusive tags e regras, e as chamadas seguintes sobrescrevem as anteriores. [`#packages/playwright/README/axebuilder`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md#axebuilder-page-playwrightpage)

### Frames e erros

- **O contexto do navegador do teste não liga bloqueio de popup.** Desde a 4.3 o `analyze()` abre uma janela nova no fim da rodada para juntar o resultado, e o bloqueio impede isso. [`#packages/playwright/error-handling`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md)
- **`setLegacyMode()` não entra.** É último recurso, está depreciado para sair na v5.0 e desliga a checagem de frame de outra origem (o `frame-tested` passa a listar o que ficou sem teste). [`#packages/playwright/error-handling`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md), [`#packages/playwright/README/axebuilder`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md#axebuilder-page-playwrightpage)

---

## Pacote

#### packages/playwright/README/getting-started
[doc](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md#getting-started) | [markdown](https://raw.githubusercontent.com/dequelabs/axe-core-npm/develop/packages/playwright/README.md)

**O que é:** a instalação, a regra de versão (major e minor do axe-core, sem SemVer) e o exemplo
mínimo com `new AxeBuilder({ page }).analyze()`.
**Para que serve:** saber o que muda numa atualização e o formato mínimo da chamada.
**Quando usar:** ao adicionar a dependência e a cada atualização dela.

#### packages/playwright/README/axebuilder
[doc](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md#axebuilder-page-playwrightpage) | [markdown](https://raw.githubusercontent.com/dequelabs/axe-core-npm/develop/packages/playwright/README.md)

**O que é:** cada método do `AxeBuilder`: `analyze()`, `include()`, `exclude()` (encadeados, um
seletor por chamada), `options()` (que sobrescreve os demais), `withRules()`, `withTags()`,
`disableRules()` e `setLegacyMode()`.
**Para que serve:** escolher área e regras da varredura sem uma configuração apagar a outra.
**Quando usar:** ao escrever a fixture do axe e ao excluir área que não é do projeto.

#### packages/playwright/error-handling
[doc](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md) | [markdown](https://raw.githubusercontent.com/dequelabs/axe-core-npm/develop/packages/playwright/error-handling.md)

**O que é:** os dois problemas da técnica de janela nova do `analyze()` (desde a 4.3): bloqueio de
popup e o `setLegacyMode()`, depreciado para a v5.0.
**Para que serve:** diagnosticar o `analyze()` que falha sem violação nenhuma.
**Quando usar:** quando a varredura quebra no CI ou num navegador específico.
