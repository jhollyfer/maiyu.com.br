# Fontsource

Fontes de código aberto empacotadas no npm, para auto-hospedar pelo bundler.

Última verificação: 2026-11-08 (fonte: https://fontsource.org/llms.txt)

> Conferido contra `@fontsource-variable/inter@5.3.0` (latest; todo pacote `@fontsource-variable/*` segue a mesma versão do gerador).

**O que é:** cada família vira um pacote npm com os arquivos woff2 e um CSS de `@font-face`. O
pacote `@fontsource-variable/<família>` traz a fonte variável (um arquivo por subconjunto cobre a
faixa inteira de peso); `@fontsource/<família>` traz os pesos estáticos. O CSS usa `unicode-range`,
então o navegador baixa só os subconjuntos que a página usa.

**Para que serve:** a fonte auto-hospedada, com hash de build e na mesma origem, que
`frontend.md` §9.6 exige, sem CSS de fonte de terceiro no caminho crítico; e o arquivo da fonte
principal para o `preload` de `frontend.md` §9.5.

**Como usar:**

```bash
pnpm add @fontsource-variable/figtree
```

```css
/* src/styles.css: um import por família, uma vez, no CSS de entrada */
@import '@fontsource-variable/figtree/wght.css';

@theme {
  --font-sans: 'Figtree Variable', ui-sans-serif, system-ui, sans-serif;
}
```

```tsx
// src/routes/__root.tsx: só o arquivo latino da fonte principal, com a URL final do build
import figtreeLatin from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url'

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: 'preload', as: 'font', type: 'font/woff2', href: figtreeLatin, crossOrigin: 'anonymous' }],
  }),
})
```

**Links:** 9.

**Skills:** `maiyu-frontend`, `preload`, `core-web-vitals`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com Fontsource: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Pacote e import

- **Use o pacote `@fontsource-variable/<família>`; o `@fontsource/<família>` estático só quando a família não tem variável.** A página de instalação parte do variável e manda cair no estático só na falta dele. [`#getting-started/install`](https://fontsource.org/docs/getting-started/install)
- **Importe a fonte uma vez, no arquivo de entrada (no Start, o CSS de entrada ou o `__root.tsx`).** O import decide quais arquivos entram no bundle, e o CSS precisa de um bundler que o processe. [`#getting-started/install`](https://fontsource.org/docs/getting-started/install)
- **No Vite, não copie arquivo de fonte para `public/` nem configure loader.** O Vite reescreve os `url()` do CSS do pacote e emite os arquivos com hash na mesma origem. [`#guides/vite`](https://fontsource.org/docs/guides/vite)
- **Não escolha subconjunto à mão.** O CSS padrão usa `unicode-range` e já baixa só o que a página usa; import por subconjunto nem existe no pacote variável. [`#getting-started/subsets`](https://fontsource.org/docs/getting-started/subsets)

### Fonte variável

- **Um único import por família e estilo: `wght.css` (ou o padrão) para peso, `standard.css` para vários eixos padrão, `full.css` para todos; itálico pelo arquivo `-italic`.** Cada import já inclui o eixo `wght`, e combinar imports de eixos diferentes não é suportado. [`#getting-started/variable`](https://fontsource.org/docs/getting-started/variable)
- **O `font-family` do pacote variável é `"<Família> Variable"` (com espaço).** É o nome que o CSS do pacote declara desde a v5; o antigo `"<Família>Variable"` não casa. [`#getting-started/migrate-v5`](https://fontsource.org/docs/getting-started/migrate-v5)

### Carregamento

- **Preload só do arquivo crítico (subconjunto latino, estilo da primeira tela), pela URL do `?url` do Vite, com `as="font"`, `type="font/woff2"` e `crossorigin`.** O bundler troca o nome por hash, e preload de todos os arquivos aumenta o tempo de carga inicial e piora o Core Web Vitals. [`#getting-started/preload`](https://fontsource.org/docs/getting-started/preload)
- **`font-display` é `swap` por padrão; outro valor só com `@font-face` próprio apontando para o arquivo do pacote.** O pacote não expõe opção; a página manda gerar a regra e incluí-la no CSS global. [`#getting-started/display`](https://fontsource.org/docs/getting-started/display)
- **Com `noUncheckedSideEffectImports` ligado, declare `@fontsource-variable/*` (e `*.css`) num `globals.d.ts`.** Sem a declaração o TypeScript reprova o import de efeito colateral do pacote. [`#getting-started/faq`](https://fontsource.org/docs/getting-started/faq)

---

## Getting Started

#### getting-started/introduction
[doc](https://fontsource.org/docs/getting-started/introduction) | [markdown](https://fontsource.org/docs/getting-started/introduction.md)

**O que é:** por que auto-hospedar fonte aberta pelo Fontsource.
**Para que serve:** entender o ganho (mesma origem, versão fixa no lockfile, sem terceiro no caminho crítico).
**Quando usar:** antes de escolher a fonte de um projeto novo.

#### getting-started/install
[doc](https://fontsource.org/docs/getting-started/install) | [markdown](https://fontsource.org/docs/getting-started/install.md)

**O que é:** pré-requisito de bundler, escolha entre pacote variável e estático, import recomendado e import por peso.
**Para que serve:** instalar e importar a família do jeito que o pacote espera.
**Quando usar:** ao adicionar a dependência.

#### getting-started/variable
[doc](https://fontsource.org/docs/getting-started/variable) | [markdown](https://fontsource.org/docs/getting-started/variable.md)

**O que é:** imports por eixo (`wght`, `wdth`, `opsz`, `standard`, `full`, itálico), `font-variation-settings` e fallback por `@supports`.
**Para que serve:** pegar o eixo que o design usa sem puxar arquivo a mais.
**Quando usar:** ao importar fonte variável com mais de um eixo ou com itálico.

#### getting-started/subsets
[doc](https://fontsource.org/docs/getting-started/subsets) | [markdown](https://fontsource.org/docs/getting-started/subsets.md)

**O que é:** import de um subconjunto isolado, só no pacote estático, e o aviso de que o `unicode-range` padrão é mais eficiente.
**Para que serve:** saber que não se recorta subconjunto à mão.
**Quando usar:** quando alguém propõe importar só o `latin`.

#### getting-started/display
[doc](https://fontsource.org/docs/getting-started/display) | [markdown](https://fontsource.org/docs/getting-started/display.md)

**O que é:** o `font-display: swap` padrão e o `@font-face` próprio para trocar o valor.
**Para que serve:** decidir o comportamento enquanto a fonte carrega.
**Quando usar:** ao mexer em `font-display` ou na métrica de fallback.

#### getting-started/preload
[doc](https://fontsource.org/docs/getting-started/preload) | [markdown](https://fontsource.org/docs/getting-started/preload.md)

**O que é:** preload do woff2 com a URL do `?url` do Vite e o aviso contra preload de todos os arquivos.
**Para que serve:** antecipar só a fonte da primeira tela.
**Quando usar:** ao montar o `head()` de `__root.tsx` (`frontend.md` §9.5).

#### getting-started/faq
[doc](https://fontsource.org/docs/getting-started/faq) | [markdown](https://fontsource.org/docs/getting-started/faq.md)

**O que é:** erro de TypeScript no import do pacote, bundle grande, fonte variável que não aplica.
**Para que serve:** resolver o erro comum sem inventar configuração.
**Quando usar:** quando o `tsc` reprova o import ou a fonte não muda de peso.

#### getting-started/migrate-v5
[doc](https://fontsource.org/docs/getting-started/migrate-v5) | [markdown](https://fontsource.org/docs/getting-started/migrate-v5.md)

**O que é:** a mudança para `@fontsource-variable/*`, o novo nome de `font-family` e os arquivos renomeados.
**Para que serve:** migrar import e CSS de projeto que ainda usa `@fontsource/<família>/variable.css`.
**Quando usar:** ao achar o formato antigo num projeto.

## Guides

#### guides/vite
[doc](https://fontsource.org/docs/guides/vite) | [markdown](https://fontsource.org/docs/guides/vite.md)

**O que é:** o Vite importa o CSS do pacote sem configuração, emite os arquivos com hash e dá a URL final por `?url`.
**Para que serve:** é o guia do bundler da casa (TanStack Start roda sobre Vite).
**Quando usar:** ao ligar a fonte no projeto e ao montar o preload.
