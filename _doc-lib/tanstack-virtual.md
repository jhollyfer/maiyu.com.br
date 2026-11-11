# TanStack Virtual

Virtualização headless de lista longa: só o que está na tela vira DOM.

> Conferido contra `@tanstack/react-virtual@3.14.26` (latest).

**O que é:** um utilitário sem marcação nem estilo. O `Virtualizer` calcula, para um elemento que
rola, quais itens estão visíveis, o tamanho total da lista e a posição de cada item; o componente
desenha só esses itens, posicionados à mão. Funciona na vertical, na horizontal e em grade.

**Para que serve:** lista, combobox ou log com milhares de linhas sem travar a página
(`frontend.md`, lista longa). Também cobre o feed invertido (chat, log, saída de IA), que ancora no
fim e carrega histórico no começo.

**Como usar:**

```bash
pnpm add @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function LogList({ rows }: Readonly<{ rows: ReadonlyArray<{ id: string; text: string }> }>): React.JSX.Element {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    // chave estável: a linha é achada pelo id, não pela posição
    getItemKey: (index) => rows[index]?.id ?? index,
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            className="absolute top-0 left-0 w-full"
            style={{ height: item.size, transform: `translateY(${item.start}px)` }}
          >
            {rows[item.index]?.text}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Links:** 5.

**Skills:** `maiyu-frontend`, `react-render-optimization`, `virtual-lists`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com TanStack Virtual: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Montagem

- **O adaptador do React é `@tanstack/react-virtual`; `@tanstack/virtual-core` só sem framework.** O adaptador embrulha o núcleo e liga o elemento que rola. [`#installation`](https://tanstack.com/virtual/latest/docs/installation)
- **A lista tem um elemento que rola com altura fixa e um elemento interno com a altura de `getTotalSize()`; cada item é posicionado à mão.** A lib não renderiza marcação nem estilo. [`#introduction`](https://tanstack.com/virtual/latest/docs/introduction)
- **Rolagem pela janela usa `useWindowVirtualizer`, não `useVirtualizer` com `window`.** Ele já liga a janela como elemento que rola. [`#framework/react/react-virtual`](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual)
- **Com o aviso de `flushSync` no React 19, `useFlushSync: false`.** O padrão `true` força render síncrono na rolagem e dispara o aviso; desligado, o React agrupa as atualizações. [`#framework/react/react-virtual`](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual)

### Feed invertido (chat, log, saída de IA)

- **Feed que cresce no fim usa ancoragem no fim (`anchorTo: 'end'`) e `scrollToEnd()` depois de montar.** É o contrato de rolagem do chat: o novo aparece embaixo, o histórico entra em cima. [`#chat`](https://tanstack.com/virtual/latest/docs/chat)
- **Chave estável por `getItemKey` (o id da mensagem), nunca o índice.** Depois de um prepend todo item muda de índice, e a âncora não reencontra a mesma mensagem. [`#chat`](https://tanstack.com/virtual/latest/docs/chat)
- **Seguir a saída nova só quando o usuário já está no fim (`followOnAppend`, com `scrollEndThreshold`).** Quem rolou para ler o histórico não é puxado de volta. [`#chat`](https://tanstack.com/virtual/latest/docs/chat)

### Altura dos itens

- **Altura que depende de imagem, embed, markdown em bloco ou CSS arbitrário se mede com `measureElement` (ou `resizeItem` quando o conteúdo carrega).** Estimativa por texto não acerta essas linhas. [`#pretext`](https://tanstack.com/virtual/latest/docs/pretext)
- **Estimativa por texto (Pretext) usa exatamente a mesma fonte, `line-height`, `letter-spacing`, `white-space` e `word-break` do CSS, e é refeita depois de `document.fonts.ready` com `virtualizer.measure()`.** Medida feita antes da fonte carregar, ou com entrada diferente do CSS, erra a altura. [`#pretext`](https://tanstack.com/virtual/latest/docs/pretext)

---

## Fundamentos

#### introduction
[doc](https://tanstack.com/virtual/latest/docs/introduction) | [markdown](https://tanstack.com/virtual/latest/docs/introduction.md)

**O que é:** a apresentação do `Virtualizer` e o exemplo mínimo de lista vertical num `div`.
**Para que serve:** entender a forma que toda lista virtual tem: contêiner que rola, elemento interno
com a altura total, itens posicionados por `transform`.
**Quando usar:** antes da primeira lista virtual do projeto.

#### installation
[doc](https://tanstack.com/virtual/latest/docs/installation) | [markdown](https://tanstack.com/virtual/latest/docs/installation.md)

**O que é:** o pacote de cada framework; no React, `@tanstack/react-virtual`.
**Para que serve:** instalar o adaptador certo, sem puxar o núcleo à parte.
**Quando usar:** ao adicionar a dependência.

#### framework/react/react-virtual
[doc](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual) | [markdown](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual.md)

**O que é:** `useVirtualizer`, `useWindowVirtualizer` e a opção `useFlushSync` do adaptador React.
**Para que serve:** escolher entre rolagem por elemento e por janela, e tirar o aviso de `flushSync`
do React 19.
**Quando usar:** ao montar a lista e ao ver o aviso no console.

## Guias

#### chat
[doc](https://tanstack.com/virtual/latest/docs/chat) | [markdown](https://tanstack.com/virtual/latest/docs/chat.md)

**O que é:** o modo ancorado no fim para chat, log e saída de IA: abrir no fim, prepend estável,
seguir o novo só quando já está no fim, manter a resposta em streaming presa embaixo.
**Para que serve:** feed invertido sem salto de rolagem quando o histórico carrega.
**Quando usar:** em toda lista que cresce no fim.

#### pretext
[doc](https://tanstack.com/virtual/latest/docs/pretext) | [markdown](https://tanstack.com/virtual/latest/docs/pretext.md)

**O que é:** estimar a altura de linha de texto com a lib Pretext, sem medir no DOM.
**Para que serve:** feed de texto longo (comentário, notificação, log) sem a correção visível de
altura depois do render.
**Quando usar:** só quando a altura sai do texto, da fonte e da largura; o resto mede no DOM.
