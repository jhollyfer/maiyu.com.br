# react-error-boundary

Error boundary pronta em componente: o React só oferece a boundary como classe, e esta lib a
entrega com fallback, reset e hook.

Última verificação: 2026-11-08 (fonte: README de `bvaughn/react-error-boundary`, branch `main`, e
https://react.dev/llms.txt)

> Conferido contra `react-error-boundary@6.1.6` (latest).

**O que é:** o componente `ErrorBoundary`, construído sobre as error boundaries do React
(`getDerivedStateFromError` e `componentDidCatch`), com três formas de fallback (`fallback`,
`fallbackRender`, `FallbackComponent`), `onError` para log, `onReset` e `resetKeys` para tentar de
novo, e o hook `useErrorBoundary` para mandar à boundary o erro de evento ou de código assíncrono.
Só ESM a partir da 6; quem não roda ESM fica na 5.

**Para que serve:** "tentar de novo" sem recarregar a página (`frontend.md` §5). Em volta do
`Outlet`, junto com o `QueryErrorResetBoundary` do TanStack Query, o botão do fallback limpa o
erro da boundary e o das queries no mesmo clique.

**Como usar:**

```bash
pnpm add react-error-boundary
```

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary'

function AppLayout(): React.JSX.Element {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div role="alert">
              <p>{getErrorMessage(error)}</p>
              <button type="button" onClick={resetErrorBoundary}>
                Tentar de novo
              </button>
            </div>
          )}
        >
          <Outlet />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
```

**Links:** 8.

**Skills:** `maiyu-frontend`, `react-data-fetching`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com react-error-boundary: projeto segue, e regra de `_standards/`
que contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### O que a boundary pega

- **Erro de render de filho se trata com error boundary, nunca com `try/catch` no componente.** `try/catch` não pega erro que acontece durante o render do React; só a boundary pega. [`#reference/eslint-plugin-react-hooks/lints/error-boundaries`](https://react.dev/reference/eslint-plugin-react-hooks/lints/error-boundaries)
- **Não escreva a boundary como classe própria: use `react-error-boundary`.** O React não tem boundary em componente de função e aponta esta lib no lugar da classe. [`#reference/react/Component#catching-rendering-errors-with-an-error-boundary`](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- **Erro de evento e de código assíncrono vai à boundary por `useErrorBoundary`, ou por `startTransition` do `useTransition` no React 19.** A boundary não pega evento, SSR, `setTimeout` nem promise fora do render; a função passada ao `startTransition` é a exceção. [`#README/event-handler-and-async-errors`](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#event-handler-and-async-errors)
- **Ação em `startTransition` que falha mostra o erro pela boundary que envolve o componente que chama `useTransition`.** A página do hook manda envolver esse componente numa error boundary. [`#reference/react/useTransition#displaying-an-error-to-users-with-error-boundary`](https://react.dev/reference/react/useTransition#displaying-an-error-to-users-with-error-boundary)

### Onde e como

- **Boundary onde faz sentido mostrar a mensagem de erro, não em volta de cada componente.** A página do React dá o exemplo: em volta da lista de conversas e de cada mensagem, não de cada avatar. [`#reference/react/Component#catching-rendering-errors-with-an-error-boundary`](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- **O fallback oferece o botão que chama `resetErrorBoundary`, e o estado que causou o erro se limpa em `onReset`.** É o caminho de "tentar de novo" do Quick start. [`#README/quick-start`](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#quick-start)
- **Erro amarrado a um estado identificável reseta a boundary por `resetKeys`.** A boundary volta sozinha quando a chave muda. [`#README/api`](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#api)
- **Log do erro vai em `onError`, que recebe o erro e a pilha de componentes.** É o callback previsto para mandar o erro ao serviço de relatório. [`#README/api`](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#api)
- **Com TanStack Query, `QueryErrorResetBoundary` (ou `useQueryErrorResetBoundary`) passa o `reset` ao `onReset` da `ErrorBoundary`.** Sem ele a query que falhou não sabe que deve tentar de novo no re-render. [`tanstack-query.md#guides/suspense`](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)

### Tipos

- **`react` e `@types/react` na mesma versão.** A divergência entre os dois é a causa de "`ErrorBoundary` cannot be used as a JSX component". [`#README/faq`](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#faq)

---

## README da biblioteca

#### README/quick-start
[doc](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#quick-start) | [markdown](https://raw.githubusercontent.com/bvaughn/react-error-boundary/main/README.md)

**O que é:** instalação e o exemplo mínimo com `fallbackRender`, `onError`, `onReset` e
`getErrorMessage`.
**Para que serve:** montar a primeira boundary com o botão de tentar de novo.
**Quando usar:** ao montar o layout que envolve o `Outlet`.

#### README/what-errors-are-caught
[doc](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#what-errors-are-caught) | [markdown](https://raw.githubusercontent.com/bvaughn/react-error-boundary/main/README.md)

**O que é:** o que a boundary pega (erro de render da árvore abaixo) e o que não pega (SSR,
evento, a própria boundary, código assíncrono depois do render).
**Para que serve:** saber quando a boundary não vai aparecer.
**Quando usar:** quando um erro passa direto pela boundary.

#### README/event-handler-and-async-errors
[doc](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#event-handler-and-async-errors) | [markdown](https://raw.githubusercontent.com/bvaughn/react-error-boundary/main/README.md)

**O que é:** `useErrorBoundary` e a alternativa de `useTransition` do React 19 para erro de evento
e de callback assíncrono.
**Para que serve:** levar à mesma tela de erro o que falha fora do render.
**Quando usar:** em handler de clique, envio ou efeito que pode falhar.

#### README/api
[doc](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#api) | [markdown](https://raw.githubusercontent.com/bvaughn/react-error-boundary/main/README.md)

**O que é:** as props do `ErrorBoundary` (`onError`, `onReset`, `resetKeys`, `fallback`,
`FallbackComponent`, `fallbackRender`) e o aviso de que é componente de cliente.
**Para que serve:** escolher a forma de fallback e o gatilho de reset.
**Quando usar:** ao configurar a boundary além do exemplo mínimo.

#### README/faq
[doc](https://github.com/bvaughn/react-error-boundary/blob/main/README.md#faq) | [markdown](https://raw.githubusercontent.com/bvaughn/react-error-boundary/main/README.md)

**O que é:** o erro de tipo "cannot be used as a JSX component" e a correção por versão alinhada
de `react` e `@types/react`.
**Para que serve:** resolver o erro de tipo sem `as`.
**Quando usar:** quando o TypeScript recusa o `ErrorBoundary` no JSX.

## Error boundaries no React

#### reference/react/Component#catching-rendering-errors-with-an-error-boundary
[doc](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) | [markdown](https://react.dev/reference/react/Component.md)

**O que é:** a seção da referência de `Component` sobre error boundary: o que ela pega e não pega,
`getDerivedStateFromError`, `componentDidCatch`, granularidade e a indicação de
`react-error-boundary`.
**Para que serve:** o contrato do React sobre o qual a lib é construída.
**Quando usar:** ao decidir onde pôr cada boundary.

#### reference/react/useTransition#displaying-an-error-to-users-with-error-boundary
[doc](https://react.dev/reference/react/useTransition#displaying-an-error-to-users-with-error-boundary) | [markdown](https://react.dev/reference/react/useTransition.md)

**O que é:** erro lançado ou promise rejeitada dentro de `startTransition` mostrado pela boundary
mais próxima.
**Para que serve:** tratar a falha de uma Action sem `try/catch` e sem estado de erro à mão.
**Quando usar:** em envio ou mutação disparada por `startTransition`.

#### reference/eslint-plugin-react-hooks/lints/error-boundaries
[doc](https://react.dev/reference/eslint-plugin-react-hooks/lints/error-boundaries) | [markdown](https://react.dev/reference/eslint-plugin-react-hooks/lints/error-boundaries.md)

**O que é:** a regra de lint que recusa `try/catch` em volta de JSX de filho e manda usar error
boundary.
**Para que serve:** a cobrança automática da regra acima, no preset do `eslint-plugin-react-hooks`.
**Quando usar:** quando o lint acusa `error-boundaries`.
