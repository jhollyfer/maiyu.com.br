---
name: dialog-pattern
description: >-
  Padrão único de componentes Dialog (modal central) em React. Use SEMPRE que
  criar, editar ou revisar qualquer Dialog (`components/ui/dialog`) — modais de
  formulário, criação rápida a partir de um combobox, detalhe, configuração — e
  também para toda confirmação destrutiva, que é AlertDialog e tem regra própria
  aqui. Dispare quando o usuário falar em "dialog", "modal", "confirmação",
  "popup", ou pedir para padronizar/revisar dialogs existentes. Há UM único
  padrão válido (trigger-forward + `ref`, uncontrolled), reproduzido inteiro
  aqui — siga-o exatamente, não improvise outra forma. Painel lateral usa
  [[sheet-pattern]]; o estilo de código é [[code-pattern]].
---

# Padrão de Dialog

`Dialog` é o modal central: `components/ui/dialog`, wrapper da primitiva de UI do
projeto. Existe **UM único padrão**, reproduzido abaixo. Não há variação, não há
"modelo alternativo": todo Dialog novo copia essa forma. É o irmão do
[[sheet-pattern]] — mesma forma, componente diferente.

## Antes de escrever

1. **Alias de import.** Leia `tsconfig.json` (`compilerOptions.paths`) ou
   `package.json` (`imports`). Os exemplos aqui usam `#/`; troque pelo alias do
   projeto (`@/`, `~/`, relativo).
2. **Primitiva de UI.** Abra `components/ui/dialog.tsx`. Tem prop **`render`**? É
   Base UI. Tem **`asChild`**? É Radix/shadcn. Use a que estiver lá — é a única
   coisa que muda entre as duas, o resto da forma é idêntico.
3. **Exemplo canônico do projeto.** Se existir `components/common/dialog-example.tsx`
   (ou equivalente), **ele vence esta skill**. Senão, o código abaixo é a referência.
4. **Validação.** O exemplo usa VineJS; se o projeto usa Zod, Valibot ou Yup, troque
   o schema e o resolver. A forma do `Controller` e do tratamento de erro não muda.

## A referência (fonte da verdade)

```tsx
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { vineResolver } from '@hookform/resolvers/vine'
import type { Infer } from '@vinejs/vine/types'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '#/components/ui/field'
import { useDismissableDialog } from '#/hooks/use-dismissable-dialog'
import { vine } from '#/lib/validator'

const FormValidator = vine.create({
  name: vine.string().trim(),
})

type FormType = Infer<typeof FormValidator>

export function DialogExample({
  ref,
  ...rest
}: React.ComponentProps<typeof DialogTrigger>): React.JSX.Element {
  return (
    <Dialog>
      <DialogTrigger {...rest} ref={ref} />
      <DialogContent className="sm:max-w-xl">
        <DialogExampleForm />
      </DialogContent>
    </Dialog>
  )
}

function DialogExampleForm(): React.JSX.Element {
  const { closeRef, close } = useDismissableDialog()
  const form = useForm<FormType>({
    resolver: vineResolver(FormValidator),
    defaultValues: { name: '' },
  })

  function onValid(_data: FormType): void {
    close()
  }

  return (
    <form onSubmit={form.handleSubmit(onValid)}>
      <DialogHeader>
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogDescription>
          Faça as alterações e clique em salvar quando terminar.
        </DialogDescription>
      </DialogHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4 py-4">
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="dialog-example-name">Nome</FieldLabel>
                <Input
                  {...field}
                  id="dialog-example-name"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </div>
      <DialogFooter>
        <Button type="submit">Salvar</Button>
        <DialogClose
          render={
            <Button ref={closeRef} variant="outline" type="button">
              Cancelar
            </Button>
          }
        />
      </DialogFooter>
    </form>
  )
}
```

Dialog que **salva** alguma coisa é a mesma forma acrescida de mutation,
mapeamento de erro do servidor pros campos e invalidação de cache — regras 7 a 9.
Se o projeto já tiver um desses (um `*-create-dialog.tsx`), copie dele.

## As regras (todas obrigatórias)

1. **Trigger-forward + `ref`.** O componente tipa as props como
   `React.ComponentProps<typeof DialogTrigger>` — ou
   `Merge<React.ComponentProps<typeof DialogTrigger>, { ...extras }>` quando
   houver props próprias —, desestrutura `{ ref, ...rest }` e espalha
   `<DialogTrigger {...rest} ref={ref} />`. O `<Dialog>` é **uncontrolled**:
   abre e fecha pela primitiva e pelo `DialogClose`. Nunca `open`/`onOpenChange`,
   nunca `useState` de abertura.
2. **Header sempre com `DialogTitle` E `DialogDescription`.** Acessibilidade: a
   primitiva anuncia os dois, e o `DialogTitle` ausente derruba o leitor de tela.
   Precisa esconder? `className="sr-only"` — nunca omitir.
3. **Corpo** em `<div className="grid flex-1 auto-rows-min gap-6 px-4 py-4">`.
   Campo de formulário usa os componentes de campo do catálogo
   (`Field`/`FieldGroup`/`FieldLabel`/`FieldError`), mais `InputGroup*` quando
   houver ícone ou addon.
4. **Footer** com a ação primária + `DialogClose` no cancelar. Nunca
   `onClick={() => onOpenChange(false)}`.
5. **Retorno tipado `React.JSX.Element`.** Se o arquivo não tem React em escopo,
   `import * as React from 'react'`.
6. **Estilo de código:** [[code-pattern]]. Sem ternário de controle, sem `any`,
   sem `as` (use `satisfies`), `type` nunca `interface`, `Merge` no lugar de `&`,
   lookup object em 3+ casos, `async/await` nunca `.then().catch()`.

## Formulário dentro do Dialog

7. **`useForm` + resolver do validador, sempre.** Campo ligado por `Controller`,
   nunca por `register`: componentes de catálogo trabalham com
   `value`/`onValueChange`, não com `ref` de input nativo — `register` só liga em
   input DOM. `mode: 'onTouched'` para o campo acusar ao sair dele, e não só no
   submit.
8. **O schema vem do módulo de validação do projeto**, nunca do pacote cru.
   Esses módulos costumam configurar um singleton (provider de mensagens, coerção
   de string vazia para `null`), e um schema criado direto do pacote compila com a
   configuração errada dependendo da ordem de carga dos módulos. Mensagem
   traduzida vem do mapa de mensagens, por chave `campo.regra`, nunca inline no
   campo.
9. **Erro do servidor volta para o campo.** No `onError` da mutation, mapeie a
   resposta de validação da API para os campos do form (um helper tipo
   `applyHTTPErrorToForm({ form, error, fields: X_FIELDS })`). Se ele resolver,
   terminou. Se não, `5xx` e rede viram `toast.error` com `id` fixo e ação
   "Tentar de novo"; o resto vira `form.setError('root', ...)`. A lista de campos
   fica ao lado deles, no `*-form-fields.tsx`.

## Como o caller abre o Dialog

> **REGRA DE OURO — zero botão escondido.** Em lugar nenhum do padrão existe
> `<button className="hidden">`, `aria-hidden`, `sr-only` num gatilho, nem
> `render` embrulhando um elemento oculto. Só há dois jeitos de abrir ou fechar:
> (a) um elemento **visível** via `render`
> (`<XDialog render={<Button>…</Button>} />`), ou (b) o componente **nu**
> disparado por `ref` (`<XDialog ref={ref} />`). Se te pegar querendo esconder um
> botão para segurar um ref, pare: use o nu (abrir) ou ancore o ref no botão
> visível que já existe (fechar).

10. **Gatilho nu quando abre por `ref`** (menu, linha de tabela, programático).
    Renderize o componente **nu**: `<XDialog ref={triggerRef} ...props />`,
    autofechado, sem filhos. O `<DialogTrigger>` sem filho já é o botão que
    `triggerRef.current?.click()` aciona. Use `render` **só** quando o próprio
    elemento visível é o gatilho.
11. **Fechar no sucesso da mutation, sem `useState`.** Um hook
    `useDismissableDialog()` que devolve `{ closeRef, close }` — se o projeto não
    tiver, são cinco linhas: um `ref` de botão e um `close()` que clica nele.
    Ancore o `closeRef` no **botão de fechar visível** do
    footer (`<DialogClose render={<Button ref={closeRef}>Cancelar</Button>} />`)
    e chame `close()` no `onSuccess` ou após `await onSubmit`. **PROIBIDO** um
    `<DialogClose className="hidden" />` só para segurar o ref — reaproveite o
    Cancelar que já existe; se não houver botão de fechar visível, acrescente um.
    Erro mantém o Dialog aberto, e o toast reporta.
    Quando o caller é dono da mutation, o Dialog expõe `onConfirm: (close) => void`
    e o caller fecha via **`mut.mutateAsync(vars, { onSuccess: close })`** — o
    callback da própria mutation. Sem argumentos:
    `mutateAsync(undefined, { onSuccess: close })`. **NUNCA**
    `mutateAsync(...).then(close).catch(() => {})`, nem `void` na frente.
12. **Alvo dinâmico aberto de menu ou linha** (qual item). No caller: estado
    `{ alvo, nonce }` + `triggerRef` + `useEffect` que clica o ref quando muda +
    `<XDialog key={nonce} ref={triggerRef} … />`. O `key` remonta e evita prop
    stale; o `nonce` permite reabrir o mesmo item.
13. **Conteúdo com dado de abertura ou reset por abertura.** Extraia um
    componente **interno** renderizado dentro do `<DialogContent>` — a primitiva
    monta o content só quando aberto, então o form self-inicializa e reseta ao
    fechar, o que dispensa `useEffect` keyado em `open`. Passe `close` para o
    interno. Depois de salvar, `form.reset()` antes do `close()`, senão o segundo
    cadastro começa com o texto do primeiro.
14. **View-only aberto por URL ou estado**, sem gatilho: `<Dialog defaultOpen>` +
    `DialogClose` no botão; efeito colateral de fechar vai em `onEscapeKeyDown` /
    `onPointerDownOutside` no `DialogContent`.
15. **`Merge` intersecta chaves em conflito**, não sobrescreve. Se uma prop colide
    com atributo DOM do trigger (`onSubmit`, `onError`, `title`…), faça
    `Omit<React.ComponentProps<typeof DialogTrigger>, 'onSubmit'>` antes do
    `Merge`. `Merge` vem do módulo de tipos do projeto ([[code-pattern]] §5).

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
      <ProductEditDialog ref={editRef} product={product} />
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

16. **Duas ligações válidas, e a escolha decide onde o Dialog mora:**
    - **Gatilho nu por `ref`** (o de cima): o Dialog é **irmão** do
      `<DropdownMenu>`, fora do `DropdownMenuContent`. O Content desmonta ao
      fechar, e um Dialog montado lá dentro morre junto com o menu. O item usa
      `onClick` normal — o menu fechar depois é o comportamento certo.
    - **O item É o gatilho** (caso do `ConfirmDialog`, regra 18): aí o componente
      fica **dentro** do Content mesmo, e o item leva `closeOnClick={false}` —
      sem isso o menu fecha e leva o gatilho antes do alerta abrir.

    `closeOnClick={false}` **só** na segunda. Na primeira ele deixa o menu aberto
    por cima do Dialog.
17. **Um `ref` por Dialog, não por lugar que abre.** Menu e botão da linha
    apontando para o mesmo Dialog compartilham o mesmo `ref` — duplicar o
    `<ProductEditDialog>` monta dois Dialogs para um alvo só. Alvos diferentes na
    mesma tela: regra 12 (`key={nonce}`).

## Confirmação destrutiva é AlertDialog, não Dialog

18. **Toda ação que arquiva, restaura ou remove passa por um `ConfirmDialog`** —
    o do projeto, se houver; senão `AlertDialog` direto. É `AlertDialog` e não
    `Dialog`. A diferença que importa: o alerta **não fecha ao clicar fora nem no
    Esc**, e um clique distraído não pode ser a resposta a "apagar de vez?".
19. **O título nomeia o registro.** `Remover a categoria Alimentos?`, nunca
    `Tem certeza?`. Ação sem volta leva `destructive`.
20. **Não escreva um AlertDialog novo à mão a cada tela.** Um `ConfirmDialog`
    único serve todas. Se o projeto ainda não tiver esse componente, crie-o na
    primeira vez.
21. **O `ConfirmDialog` é compound: o texto vai por slot, não por prop.** Em
    prop fica só o que a confirmação inteira compartilha — a pendência, o peso
    (`destructive`) e a ação —, e isso chega às partes por contexto. Título,
    descrição e o rótulo dos botões são markup, e markup é filho:

    ```tsx
    <ConfirmDialog
      ref={triggerRef}
      isPending={remove.isPending}
      onConfirm={(close) => remove.mutateAsync(id, { onSuccess: close })}
    >
      <ConfirmDialogHeader>
        <ConfirmDialogMedia><TrashIcon /></ConfirmDialogMedia>
        <ConfirmDialogTitle>Remover a categoria Alimentos?</ConfirmDialogTitle>
        <ConfirmDialogDescription>…</ConfirmDialogDescription>
      </ConfirmDialogHeader>
      <ConfirmDialogFooter>
        <ConfirmDialogCancel />
        <ConfirmDialogConfirm>Remover</ConfirmDialogConfirm>
      </ConfirmDialogFooter>
    </ConfirmDialog>
    ```

    Uma prop de texto por pedaço obriga a tela fora da curva — a que precisa de
    um `<Alert>` na descrição ou de uma contagem no rodapé — a virar mais uma
    prop opcional para todas as outras. O slot resolve isso sem API nova.
22. **O `children` é o conteúdo do alerta, nunca o do gatilho.** O que aparece
    dentro do botão que abre mora no elemento do `render`
    (`render={<Button><TrashIcon />Excluir</Button>}`), ou na prop `trigger`,
    quando o projeto usa essa forma. O gatilho costuma ser um
    `DropdownMenuItem` com `closeOnClick={false}` — sem isso o menu fecha e leva
    o gatilho antes do alerta abrir.
23. **Peça sem estado compartilhado não vira compound.** A própria
    [[compound-pattern]] avisa: sem estado a dividir entre as partes, o contexto
    é só sobrecarga. Coleção de widgets ganha barrel, não provider. E há um caso
    em que o contexto é impossível: a instância genérica do TanStack Table não
    cabe num `React.Context` sem um `as`/`any` (o `Context` não carrega o
    genérico de quem o provê), então ela segue por prop.

## Antes de terminar

Releia o diff: props via `React.ComponentProps<typeof DialogTrigger>` (ou
`Merge<…>`); `{ ref, ...rest }` no `DialogTrigger`; sem `open`/`onOpenChange`;
header com Title **e** Description; footer com `DialogClose render={…}`; a prop
de composição da primitiva do projeto (`render` no Base UI, `asChild` no Radix) e
o alias de import dele; retorno `React.JSX.Element`; **gatilho nu
`<XDialog ref={ref} />` sem hidden-button**; fechar via `useDismissableDialog`;
schema vindo do módulo de validação do projeto; **Dialog nu como irmão do
`<DropdownMenu>`, nunca dentro do `DropdownMenuContent`**; `closeOnClick={false}`
só quando o item é o gatilho; confirmação destrutiva via `ConfirmDialog`, com o
texto nas **partes** e não em prop. Depois
rode o lint e o typecheck do projeto (normalmente `npm run lint` e
`npx tsc --noEmit`).
