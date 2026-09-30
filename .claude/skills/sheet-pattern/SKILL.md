---
name: sheet-pattern
description: >-
  Padrão único de componentes Sheet (painel lateral) em React. Use SEMPRE que
  criar, editar ou revisar qualquer Sheet (`components/ui/sheet`) — painéis de
  filtro, menu mobile, drawers de formulário, painéis de configuração, e
  qualquer coisa que abra da borda da tela. Dispare quando o usuário falar em
  "drawer", "painel lateral", "sheet", "gaveta", ou pedir para
  padronizar/revisar sheets existentes. Há UM único padrão válido
  (trigger-forward + `ref`, uncontrolled), reproduzido inteiro aqui — siga-o
  exatamente, não improvise outra forma. Modal central usa [[dialog-pattern]];
  o estilo de código é [[code-pattern]].
---

# Padrão de Sheet

`Sheet` é o painel lateral: `components/ui/sheet`, normalmente a mesma primitiva
do Dialog com posicionamento na borda. Existe **UM único padrão**, reproduzido
abaixo. Não há variação, não há "modelo alternativo": todo Sheet novo copia essa
forma. É o irmão do [[dialog-pattern]] — mesma forma, componente diferente.

## Antes de escrever

1. **Alias de import.** Leia `tsconfig.json` (`compilerOptions.paths`) ou
   `package.json` (`imports`). Os exemplos aqui usam `#/`; troque pelo alias do
   projeto (`@/`, `~/`, relativo).
2. **Primitiva de UI.** Abra `components/ui/sheet.tsx`. Tem prop **`render`**? É
   Base UI. Tem **`asChild`**? É Radix/shadcn. Use a que estiver lá — é a única
   coisa que muda entre as duas, o resto da forma é idêntico.
3. **Exemplo canônico do projeto.** Se existir `components/common/sheet-example.tsx`
   (ou equivalente), **ele vence esta skill**. Senão, o código abaixo é a referência.
4. **Validação e roteamento.** O exemplo usa VineJS e TanStack Router; troque pelo
   validador e pelo router do projeto. A forma não muda.

**Sheet ou Dialog?** A diferença prática é o que fica visível atrás: o Sheet abre
na borda e a listagem continua à vista, então serve filtro, navegação e contexto
lateral. O Dialog escurece o resto e serve a tarefa que precisa de foco.
Confirmação destrutiva não é nem um nem outro — é `ConfirmDialog`, ver
[[dialog-pattern]].

## A referência (fonte da verdade)

```tsx
import * as React from 'react'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { useDismissableDialog } from '#/hooks/use-dismissable-dialog'
import type { Merge } from '#/lib/interfaces'

type SheetExamplePayload = { name: string }

type SheetExampleProps = Merge<
  Omit<React.ComponentProps<typeof SheetTrigger>, 'onSubmit'>,
  { onSubmit?: (payload: SheetExamplePayload) => Promise<void> }
>

export function SheetExample({
  ref,
  onSubmit,
  ...rest
}: SheetExampleProps): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger {...rest} ref={ref} />
      <SheetContent>
        {/* Interno montado só quando aberto → estado self-reseta ao fechar. */}
        <SheetExampleContent onSubmit={onSubmit} />
      </SheetContent>
    </Sheet>
  )
}

function SheetExampleContent({
  onSubmit,
}: {
  onSubmit?: (payload: SheetExamplePayload) => Promise<void>
}): React.JSX.Element {
  const { closeRef, close } = useDismissableDialog()
  const [name, setName] = React.useState('')

  async function handleSave(): Promise<void> {
    if (!onSubmit) return
    await onSubmit({ name })
    close()
  }

  return (
    <React.Fragment>
      <SheetHeader>
        <SheetTitle>Editar perfil</SheetTitle>
        <SheetDescription>
          Faça as alterações e clique em salvar quando terminar.
        </SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="sheet-example-name">Nome</FieldLabel>
            <Input
              id="sheet-example-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
        </FieldGroup>
      </div>
      <SheetFooter>
        <Button type="submit" onClick={handleSave}>
          Salvar
        </Button>
        <SheetClose
          render={
            <Button ref={closeRef} variant="outline">
              Cancelar
            </Button>
          }
        />
      </SheetFooter>
    </React.Fragment>
  )
}
```

Os dois usos mais comuns saem daí sem mudar a forma: painel de filtros
(`side="left"`, controles navegando pela URL — regra 11) e menu mobile (os links
dentro de `SheetClose` — regra 14).

## As regras (todas obrigatórias)

1. **Trigger-forward + `ref`.** O componente tipa as props como
   `Merge<React.ComponentProps<typeof SheetTrigger>, { ...extras }>`,
   desestrutura `{ ref, ...rest }` e espalha
   `<SheetTrigger {...rest} ref={ref} />`. O `<Sheet>` é **uncontrolled**: abre e
   fecha pela primitiva e pelo `SheetClose`. Nunca `open`/`onOpenChange`, nunca
   `useState` de abertura.
2. **Header sempre com `SheetTitle` E `SheetDescription`.** Acessibilidade: a
   primitiva anuncia os dois. Precisa esconder? `className="sr-only"` — nunca
   omitir.
3. **Corpo** em `<div className="grid flex-1 auto-rows-min gap-6 px-4">`. Campo
   de formulário usa os componentes de campo do catálogo
   (`Field`/`FieldGroup`/`FieldLabel`/`FieldError`), mais `InputGroup*` quando
   houver ícone ou addon.
4. **Footer** com a ação primária + `SheetClose` no cancelar. Nunca
   `onClick={() => onOpenChange(false)}`.
5. **Retorno tipado `React.JSX.Element`.** Se o arquivo não tem React em escopo,
   `import * as React from 'react'`.
6. **Estilo de código:** [[code-pattern]]. Sem ternário de controle, sem `any`,
   sem `as` (use `satisfies`), `type` nunca `interface`, `Merge` no lugar de `&`,
   lookup object em 3+ casos, `async/await` nunca `.then().catch()`.
7. **`side`** só quando não for o default: `side="left"` para filtro e navegação,
   direita para contexto do registro. Escolha uma e mantenha na tela inteira.

## Formulário dentro do Sheet

8. **`useForm` + resolver do validador, sempre** — igual ao [[dialog-pattern]].
   Campo ligado por `Controller`, nunca por `register`: componentes de catálogo
   trabalham com `value`/`onValueChange`, não com `ref` de input nativo.
   `mode: 'onTouched'`. Estado cru com `useState`, como na referência, só quando
   não há nada a validar nem a submeter.
9. **O schema vem do módulo de validação do projeto**, nunca do pacote cru. Esses
   módulos costumam configurar um singleton (provider de mensagens, coerção de
   string vazia para `null`), e um schema criado direto do pacote compila com a
   configuração errada dependendo da ordem de carga dos módulos. Mensagem
   traduzida vem do mapa de mensagens, por chave `campo.regra`, nunca inline no
   campo.
10. **Erro do servidor volta para o campo.** No `onError` da mutation, mapeie a
    resposta de validação da API para os campos do form (um helper tipo
    `applyHTTPErrorToForm({ form, error, fields: X_FIELDS })`). Se ele resolver,
    terminou. Se não, `5xx` e rede viram `toast.error` com `id` fixo e ação
    "Tentar de novo"; o resto vira `form.setError('root', ...)`.
11. **Filtro de listagem não é estado do Sheet.** Filtro, página e ordenação
    moram nos search params da URL (no TanStack Router, via `validateSearch`). O
    Sheet só desenha os controles e navega; ele não guarda o filtro, e por isso
    não precisa sincronizar nada ao abrir. Errar essa camada — guardar filtro em
    `useState` dentro do painel — é o engano mais comum aqui: fecha o Sheet e o
    filtro some, recarrega a página e some de novo, e o link não é
    compartilhável.

## Como o caller abre o Sheet

> **REGRA DE OURO — zero botão escondido.** Em lugar nenhum do padrão existe
> `<button className="hidden">`, `aria-hidden`, `sr-only` num gatilho, nem
> `render` embrulhando um elemento oculto. Só há dois jeitos de abrir ou fechar:
> (a) um elemento **visível** via `render`
> (`<XSheet render={<Button>…</Button>} />`), ou (b) o componente **nu**
> disparado por `ref` (`<XSheet ref={ref} />`). Se te pegar querendo esconder um
> botão para segurar um ref, pare: use o nu (abrir) ou ancore o ref no botão
> visível que já existe (fechar).

12. **Gatilho nu quando abre por `ref`** (menu, linha de tabela, programático).
    Renderize o componente **nu**: `<XSheet ref={triggerRef} ...props />`,
    autofechado, sem filhos. O `<SheetTrigger>` sem filho já é o botão que
    `triggerRef.current?.click()` aciona. Use `render` **só** quando o próprio
    elemento visível é o gatilho.
13. **Fechar no sucesso da mutation, sem `useState`.** Um hook
    `useDismissableDialog()` que devolve `{ closeRef, close }` — se o projeto não
    tiver, são cinco linhas: um `ref` de botão e um `close()` que clica nele.
    Ancore o `closeRef` no **botão de fechar visível** do
    footer (`<SheetClose render={<Button ref={closeRef}>Cancelar</Button>} />`) e
    chame `close()` no `onSuccess` ou após `await onSubmit`. **PROIBIDO** um
    `<SheetClose className="hidden" />` só para segurar o ref — reaproveite o
    Cancelar que já existe; se não houver botão de fechar visível, acrescente um.
    Erro mantém o Sheet aberto, e o toast reporta.
    Quando o caller é dono da mutation, o Sheet expõe `onConfirm: (close) => void`
    e o caller fecha via **`mut.mutateAsync(vars, { onSuccess: close })`** — o
    callback da própria mutation. Sem argumentos:
    `mutateAsync(undefined, { onSuccess: close })`. **NUNCA**
    `mutateAsync(...).then(close).catch(() => {})`, nem `void` na frente.
14. **Item de navegação fecha o Sheet.** Menu mobile: o `Link` vai dentro de
    `<SheetClose render={<Link …/>} />`, e não com `onClick` fechando na mão.
15. **Alvo dinâmico aberto de menu ou linha** (qual item). No caller: estado
    `{ alvo, nonce }` + `triggerRef` + `useEffect` que clica o ref quando muda +
    `<XSheet key={nonce} ref={triggerRef} … />`. O `key` remonta e evita prop
    stale; o `nonce` permite reabrir o mesmo item.
16. **Conteúdo com dado de abertura ou reset por abertura.** Extraia um
    componente **interno** renderizado dentro do `<SheetContent>` — a primitiva
    monta o content só quando aberto, então o estado self-inicializa e reseta ao
    fechar, o que dispensa `useEffect` keyado em `open`. Passe `close` para o
    interno.
17. **`Merge` intersecta chaves em conflito**, não sobrescreve. Se uma prop colide
    com atributo DOM do trigger (`onSubmit`, `onError`, `title`…), faça
    `Omit<React.ComponentProps<typeof SheetTrigger>, 'onSubmit'>` antes do
    `Merge`, como na referência. `Merge` vem do módulo de tipos do projeto
    ([[code-pattern]] §5).

### O caller, em código

O que muda entre bibliotecas é só a prop de composição — **`render`** no Base UI,
`asChild` no Radix — e o alias de import. O resto da forma é o mesmo.

```tsx
export function ProductRowActions({
  product,
}: {
  product: Product
}): React.JSX.Element {
  const editRef = React.useRef<HTMLButtonElement>(null)

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <DotsThreeIcon />
            </Button>
          }
        />
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem onClick={() => editRef.current?.click()}>
            <PencilSimpleIcon />
            Editar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Gatilho nu, IRMÃO do menu — nunca dentro do DropdownMenuContent. */}
      <ProductEditSheet ref={editRef} product={product} />
    </React.Fragment>
  )
}
```

Numa célula de tabela é o mesmo desenho, com o botão visível no lugar do item:

```tsx
<TableCell className="text-right">
  <Button variant="outline" size="sm" onClick={() => editRef.current?.click()}>
    Ver
  </Button>
</TableCell>
```

18. **O Sheet nu é irmão do `<DropdownMenu>`, fora do `DropdownMenuContent`.**
    O Content desmonta ao fechar, e um Sheet montado lá dentro morre junto com o
    menu. O item usa `onClick` normal — o menu fechar depois é o comportamento
    certo. `closeOnClick={false}` é o oposto disso: serve só quando o **próprio
    item é o gatilho** (caso do `ConfirmDialog`, [[dialog-pattern]] regra 18);
    aqui ele deixaria o menu aberto por cima do Sheet.
19. **Um `ref` por Sheet, não por lugar que abre.** Menu e botão da linha
    apontando para o mesmo Sheet compartilham o mesmo `ref` — duplicar o
    `<ProductEditSheet>` monta dois Sheets para um alvo só. Alvos diferentes na
    mesma tela: regra 15 (`key={nonce}`).

## Antes de terminar

Releia o diff: props via `Merge<React.ComponentProps<typeof SheetTrigger>, …>`;
`{ ref, ...rest }` no `SheetTrigger`; sem `open`/`onOpenChange`; header com Title
**e** Description; footer com `SheetClose render={…}`; a prop de composição da
primitiva do projeto (`render` no Base UI, `asChild` no Radix) e o alias de
import dele; retorno `React.JSX.Element`; **gatilho nu `<XSheet ref={ref} />` sem
hidden-button**; fechar via `useDismissableDialog`; schema vindo do módulo de
validação do projeto; **Sheet nu como irmão do `<DropdownMenu>`, nunca dentro do
`DropdownMenuContent`**; filtro na URL e não no Sheet. Depois rode o lint e o
typecheck do projeto (normalmente `npm run lint` e `npx tsc --noEmit`).
