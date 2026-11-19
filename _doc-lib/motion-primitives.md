# Motion Primitives

> Conferido em 2026-11-19 contra o `README.md` do repositório `ibelick/motion-primitives` (cru) e as
> páginas `docs/installation`, `docs/text-effect` e `docs/dialog`. **O `LICENSE.md` que o README
> linka responde 404 (`main`): a licença não está conferida por arquivo.** Nada foi instalado.

Componentes de movimento (texto, carrossel, dock, glow) com Motion e Tailwind.

**O que é:** kit em beta, instalado pelo CLI próprio (`npx motion-primitives@latest add
<componente>`) ou copiado à mão. A página de instalação pede Tailwind, `motion`, o helper `cn` em
`lib/utils.ts` e `lucide-react`.

**Para que serve:** só **vitrine e efeito de marketing** (`_standards/frontend.md` §6.4,
`DECISIONS.md` #789): efeito de texto, dock, glow, número animado. Dialog, Accordion, Toolbar e
afins existem no catálogo, mas são primitivos interativos: **não entram**; o kit tem os dele.

**Como usar:** componente de efeito, depois a régua inteira. O `dialog` da página importa `X` do
`lucide-react` e é feito à mão com `createPortal`, o que a régua já proíbe nos dois pontos.

**Links:** 4

**Skills:** `maiyu-frontend`, `design-taste-frontend`, `impeccable`. Dispare junto com a leitura da
entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313).

### Instalação e licença

- **Instalação: Tailwind, `motion`, helper `cn`, `lucide-react`, e depois `npx motion-primitives@latest add <nome>`.** [`#docs/installation`](https://motion-primitives.com/docs/installation)
- **Projeto em beta**: "novos componentes e mudanças significativas de código são esperados"; o arquivo copiado congela a versão, e a atualização é manual. [`#readme`](https://raw.githubusercontent.com/ibelick/motion-primitives/main/README.md)
- **Licença: o README declara MIT e linka `LICENSE.md`, mas esse arquivo não abre (404).** Sem licença conferida por arquivo, o bloco **não entra** até o dono ou o autor esclarecer; não anote "MIT" no topo por inferência. [`#readme`](https://raw.githubusercontent.com/ibelick/motion-primitives/main/README.md)

### Conflito com a régua

- **`lucide-react` é pedido na instalação e usado no código** (`X` no `dialog`): troca por Phosphor (`DECISIONS.md` #195); não se instala `lucide-react`.
- **`motion/react` direto**: envolva em `LazyMotion` `strict` + `m` e `MotionConfig reducedMotion="user"` (`_doc-lib/motion.md`, `DECISIONS.md` #192).
- **Componente interativo escrito à mão** (Dialog, Accordion, Toolbar) é desvio da regra #366; o equivalente vem do shadcn sobre Base UI.

---

## Começo

#### docs/installation
[doc](https://motion-primitives.com/docs/installation)
**O que é:** passos de instalação: Tailwind, Motion, `cn` e ícones, e o comando `add`.
**Para que serve:** saber as dependências que o componente assume antes de copiar.
**Quando usar:** antes do primeiro componente; `lucide-react` não se instala na casa.

#### readme
[markdown](https://raw.githubusercontent.com/ibelick/motion-primitives/main/README.md)
**O que é:** o README: o que é, aviso de beta e link para a licença.
**Para que serve:** o estado do projeto e a licença declarada.
**Quando usar:** ao decidir se o bloco entra; o `LICENSE.md` linkado dá 404 em 2026-11-19, então a licença fica não conferida.

## Componentes

#### docs/text-effect
[doc](https://motion-primitives.com/docs/text-effect)
**O que é:** efeito de texto animado por letra, palavra ou linha.
**Para que serve:** exemplo do tipo de componente de vitrine que cabe aqui.
**Quando usar:** título de hero; `prefers-reduced-motion` por componente (`frontend.md` §10) e texto por chave de i18n.

#### docs/dialog
[doc](https://motion-primitives.com/docs/dialog)
**O que é:** Dialog próprio, com `createPortal` e `X` do `lucide-react`.
**Para que serve:** exemplo do que **não** entra: primitivo interativo à mão, sem o teclado e o foco do Base UI.
**Quando usar:** nunca como Dialog do produto; o Dialog vem do kit (`dialog-pattern`).
