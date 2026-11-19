# Animate UI

> Conferido em 2026-11-19 contra `animate-ui.com/llms.txt`, as páginas de instalação, de primitivos
> e do `dialog` do Base UI, e contra o `LICENSE.md` do repositório `imskyleen/animate-ui` (cru).
> Nada foi instalado nem executado.

Primitivos animados com Motion, em versões Radix UI, Base UI e React Aria, mais componentes próprios.

**O que é:** pacote `@animate-ui/react` (com `motion`) e registry do shadcn. Os "primitivos" são
versões animadas dos de Radix, Base UI e React Aria com a mesma API, e há componentes próprios
(botão, fundo, cursor, ícones). O instalador troca as importações dos componentes do shadcn pelas
do Animate UI e remove as classes de animação de CSS que o Motion substitui.

**Para que serve:** só **vitrine e efeito de marketing** (`_standards/frontend.md` §6.4,
`DECISIONS.md` #789). É o registry mais próximo da régua por oferecer a variante **Base UI**, mas
trocar o primitivo de `components/ui/` por outro vai contra o kit único e a regra #366: não se
usa para reescrever o kit.

**Como usar:** componente avulso de vitrine pelo registry; da família Base UI quando houver
primitivo equivalente. `@animate-ui/react` é dependência nova: só com decisão do projeto.

**Links:** 4

**Skills:** `maiyu-frontend`, `design-taste-frontend`, `impeccable`. Dispare junto com a leitura da
entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313).

### Instalação e licença

- **Instale `@animate-ui/react` e `motion`, depois adicione o componente do shadcn pelo CLI.** O instalador do Animate UI localiza os componentes pelo `components.json`. [`#docs/installation`](https://animate-ui.com/docs/installation)
- **Primitivo Base UI existe** (Accordion, Dialog, Drawer, Menu e outros) com a API exata do Base UI, mais primitivos próprios. [`#docs/primitives`](https://animate-ui.com/docs/primitives)
- **Sob `prefers-reduced-motion` o popup só faz fade**, sem inclinação, escala ou deslize: o próprio componente respeita a preferência. [`#docs/primitives/base-ui/dialog`](https://animate-ui.com/docs/primitives/base-ui/dialog)
- **Licença "MIT + Commons Clause"** ("Copyright (c) 2025 Elliot Sutton"): uso comercial permitido como parte de aplicação, site ou produto; **vender ou redistribuir os componentes em si, sozinhos ou em pacote, é proibido.** O projeto da casa é aplicação, então cabe; anote no topo do arquivo copiado. [`#license`](https://raw.githubusercontent.com/imskyleen/animate-ui/main/LICENSE.md)

### Conflito com a régua

- **Família Radix** do Animate UI vira Base UI ou não entra.
- **Ícones**: há grupos "Lucide Icons" e "Hugeicons" no catálogo; troca por Phosphor (`DECISIONS.md` #195).
- **`motion` sem `LazyMotion`**: envolva em `LazyMotion` `strict` + `m` e `MotionConfig reducedMotion="user"` (`_doc-lib/motion.md`, `DECISIONS.md` #192).
- **Primitivo de `components/ui/`** continua do kit; Animate UI não o substitui.

---

## Começo

#### docs/installation
[doc](https://animate-ui.com/docs/installation)
**O que é:** instalação de `@animate-ui/react` e `motion`, e o fluxo para animar componentes do shadcn.
**Para que serve:** saber o que muda no projeto: importações trocadas e classes de CSS removidas.
**Quando usar:** antes do primeiro componente. O instalador mexe em `components/ui/`, que é do kit: rode só para componente de vitrine.

#### docs/primitives
[doc](https://animate-ui.com/docs/primitives)
**O que é:** o catálogo dos primitivos animados (Radix, Base UI, React Aria) e dos próprios.
**Para que serve:** ver o que existe na variante Base UI.
**Quando usar:** ao pensar em efeito de vitrine em cima de um primitivo; formulário e painel ficam no kit.

#### docs/primitives/base-ui/dialog
[doc](https://animate-ui.com/docs/primitives/base-ui/dialog)
**O que é:** o `Dialog` do Base UI animado, citado como o primitivo sob o `Sheet` do shadcn.
**Para que serve:** exemplo de como a redução de movimento é tratada (fade sem escala/deslize).
**Quando usar:** só como leitura; Dialog e Sheet do painel vêm do kit (`dialog-pattern`, `sheet-pattern`).

#### license
[markdown](https://raw.githubusercontent.com/imskyleen/animate-ui/main/LICENSE.md)
**O que é:** o `LICENSE.md` do repositório: MIT + Commons Clause.
**Para que serve:** a licença anotada no topo do arquivo copiado e a restrição de revenda.
**Quando usar:** antes de copiar. Commons Clause não é OSS puro: a anotação diz isso.
