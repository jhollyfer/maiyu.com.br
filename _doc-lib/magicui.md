# Magic UI

> Conferido em 2026-11-19 contra `magicui.design/llms.txt`, a página de instalação e a de dois
> componentes (versão `.md` de cada uma) e contra o `LICENSE.md` do repositório
> `magicuidesign/magicui` (cru). Nada foi instalado nem executado.

Registry de componentes de landing page animados, instalável pelo CLI do shadcn.

**O que é:** coleção de componentes React com Tailwind (fundo animado, texto com efeito, mockup de
dispositivo, lista animada, globo), publicada como registry do shadcn: `npx shadcn@latest add
@magicui/<nome>`. O código vira arquivo do projeto. A instalação é a mesma do shadcn/ui.

**Para que serve:** só **vitrine e efeito de marketing** (`_standards/frontend.md` §6.4,
`DECISIONS.md` #789): hero, fundo, texto animado, seção de landing. Formulário, tabela, Dialog,
menu e qualquer primitivo interativo seguem o shadcn sobre Base UI do kit.

**Como usar:** `pnpm dlx shadcn@latest add @magicui/<nome>` copia o componente para
`components/ui/` e instala as dependências npm dele (por exemplo `motion`, e `cobe` no `globe`).
Depois o arquivo passa pela régua inteira (§6.4): `LazyMotion` + `m`, ícone Phosphor, cor por
token, texto por chave de i18n, licença anotada no topo.

**Links:** 4

**Skills:** `maiyu-frontend`, `design-taste-frontend` (direção da vitrine), `impeccable`. Dispare
junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão com Magic UI: projeto segue, e regra de `_standards/` que contradiga uma destas
linhas está errada.

### Instalação e licença

- **A instalação é a do shadcn/ui: `npx shadcn@latest init` e depois `npx shadcn@latest add @magicui/<nome>`.** O namespace `@magicui` já resolve no CLI. [`#docs/installation`](https://magicui.design/docs/installation.md)
- **O componente declara as dependências npm na própria página** (o `globe` pede `cobe` e `motion`). Dependência fora de `motion` (Motion) só entra com `_doc-lib/<lib>.md` e linha em `docs/DECISIONS.md`; sem isso, o componente não entra. [`#docs/components/globe`](https://magicui.design/docs/components/globe.md)
- **Licença MIT** ("Copyright (c) Magic UI"), com a nota de copyright no `LICENSE.md` do repositório; anote no topo do arquivo copiado. [`#license`](https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md)

### Conflito com a régua

- **`motion` sem `LazyMotion`**: o código copiado importa `motion/react` direto; envolva em `LazyMotion` `strict` + `m` e `MotionConfig reducedMotion="user"` (`_doc-lib/motion.md`, `DECISIONS.md` #192).
- **Ícone**: se o componente importar `lucide-react`, troca por Phosphor (`DECISIONS.md` #195). Confira cada componente; a página dele não é a lista completa.
- **Primitivo de Radix** no código copiado vira Base UI ou o bloco não entra.

---

## Começo

#### docs/installation
[doc](https://magicui.design/docs/installation) | [markdown](https://magicui.design/docs/installation.md)
**O que é:** instalação: igual à do shadcn/ui, com `init` e `add @magicui/<nome>`.
**Para que serve:** saber que o registry usa o CLI e o `components.json` do shadcn, sem pacote próprio.
**Quando usar:** ao trazer o primeiro componente. A instalação roda no projeto que já tem o kit do shadcn.

#### license
[markdown](https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md)
**O que é:** o `LICENSE.md` do repositório: MIT, "Copyright (c) Magic UI".
**Para que serve:** a licença que se anota no topo do arquivo copiado (`frontend.md` §6.4).
**Quando usar:** antes de copiar. Sem a licença conferida, o bloco não entra.

## Componentes

#### docs/components/animated-shiny-text
[doc](https://magicui.design/docs/components/animated-shiny-text) | [markdown](https://magicui.design/docs/components/animated-shiny-text.md)
**O que é:** texto com brilho que passa por cima; um efeito de CSS (`animate-shine`), com `motion-safe`/`motion-reduce` no estilo.
**Para que serve:** exemplo de componente de vitrine sem dependência de JS de animação.
**Quando usar:** destaque de selo ou chamada na landing. Cor por token do tema, não pelas cores do original.

#### docs/components/globe
[doc](https://magicui.design/docs/components/globe) | [markdown](https://magicui.design/docs/components/globe.md)
**O que é:** globo 3D em canvas, com `cobe` e `motion` (`useMotionValue`, `useSpring`).
**Para que serve:** exemplo de componente que puxa dependência nova (`cobe`) e é efeito pesado.
**Quando usar:** só com decisão para `cobe` (`_doc-lib/<lib>.md` + `DECISIONS.md`) e `lazy`, fora do caminho crítico (§9.4, §9.8).
