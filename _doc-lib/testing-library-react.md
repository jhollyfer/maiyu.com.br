# React Testing Library

Teste de componente pelo que o usuário vê: renderiza no DOM, acha o elemento por papel e rótulo,
interage como uma pessoa.

Última verificação: 2026-11-08 (fonte: `sidebars.js` de `testing-library/testing-library-docs`,
branch `main`)

> Conferido contra `@testing-library/react@16.3.3` (latest), com `@testing-library/dom@10.4.2`,
> `@testing-library/user-event@14.6.8` e `@testing-library/jest-dom@7.0.1`.

**O que é:** uma camada fina sobre a DOM Testing Library para React: `render`, `screen`,
`renderHook`, `act` e `cleanup`, mais as queries (`getBy`, `queryBy`, `findBy` e as variantes
`All`) que a DOM Testing Library já traz. A interação vem do `@testing-library/user-event`, que
simula a sequência completa de eventos de uma pessoa (ponteiro, teclado, área de transferência),
e as asserções de DOM do `@testing-library/jest-dom`. Funciona com Vitest em `jsdom`.

**Para que serve:** o teste de componente e de hook do frontend (`frontend.md` §11.1,
`tooling.md` tabela de testes): papel e nome acessível no lugar de classe e `data-testid`, e
`userEvent` no lugar de `fireEvent`.

**Como usar:**

```bash
pnpm add -D @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom
```

```ts
// vitest.setup.ts (em `test.setupFiles`): o Vitest não injeta `afterEach` global por padrão
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

test('salva o post', async () => {
  const user = userEvent.setup()
  render(<PostForm />)

  await user.type(screen.getByRole('textbox', { name: m.posts_form_title() }), 'Olá')
  await user.click(screen.getByRole('button', { name: m.posts_form_save() }))

  expect(await screen.findByRole('status')).toHaveTextContent(m.posts_saved())
})
```

**Links:** 40.

**Skills:** `superpowers:test-driven-development`, `javascript-testing-patterns`, `maiyu-frontend`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com React Testing Library: projeto segue, e regra de
`_standards/` que contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página
de onde saiu.

### Montagem

- **Instale `@testing-library/react` junto com a dependência par `@testing-library/dom`.** A página de introdução manda as duas, e com TypeScript também `@types/react` e `@types/react-dom`. [`#react-testing-library/intro`](https://testing-library.com/docs/react-testing-library/intro/)
- **No Vitest sem `globals`, chame `cleanup` num `afterEach` de topo (arquivo de `setupFiles`).** O `cleanup` automático só roda quando o framework injeta `afterEach` global; sem ele a árvore de um teste vaza para o próximo. [`#react-testing-library/setup`](https://testing-library.com/docs/react-testing-library/setup/)
- **Provider comum (Query, Router, tema) entra por `render` customizado com a opção `wrapper`.** A página de setup recomenda a função de `render` própria para os providers. [`#react-testing-library/setup`](https://testing-library.com/docs/react-testing-library/setup/)
- **`act` se importa de `@testing-library/react`, não de `react`.** A página da API recomenda a importação da lib por consistência. [`#react-testing-library/api`](https://testing-library.com/docs/react-testing-library/api/)

### Princípios

- **O teste usa o componente como o usuário usa: nó de DOM, nunca instância nem detalhe de implementação.** É o primeiro dos princípios que guiam a lib. [`#guiding-principles`](https://testing-library.com/docs/guiding-principles/)
- **Prefira `render` a `renderHook`; hook se testa por um componente que o usa.** A página da API diz que `renderHook` interessa sobretudo a quem publica hook e que o componente de teste deixa o teste mais legível e robusto. [`#react-testing-library/api`](https://testing-library.com/docs/react-testing-library/api/)
- **Evite mockar componente.** A FAQ manda evitar, pelos princípios, e só fazer quando não houver outro jeito. [`#react-testing-library/faq`](https://testing-library.com/docs/react-testing-library/faq/)

### Queries

- **Ordem de preferência: `ByRole` (com `name`), `ByLabelText`, `ByPlaceholderText`, `ByText`, `ByDisplayValue`; depois `ByAltText` e `ByTitle`; `ByTestId` por último.** É a prioridade oficial: primeiro o que todo usuário percebe, por fim o que ninguém vê. [`#queries/about`](https://testing-library.com/docs/queries/about/)
- **Consulte por `screen`, não pelo retorno do `render`.** A página das queries recomenda `screen`. [`#queries/about`](https://testing-library.com/docs/queries/about/)
- **Elemento que ainda vai aparecer se espera com `findBy`; condição que não é elemento, com `waitFor`.** `findBy` é `getBy` com `waitFor`, e é o caminho para mudança assíncrona do DOM. [`#dom-testing-library/api-async`](https://testing-library.com/docs/dom-testing-library/api-async/)
- **Ausência se afirma com `queryBy` e `not.toBeInTheDocument()`; sumiço assíncrono, com `waitForElementToBeRemoved`.** `getBy` lança quando não acha, e não serve para provar que algo não está lá. [`#guide-disappearance`](https://testing-library.com/docs/guide-disappearance/)
- **`ByTestId` só quando papel e texto não servem, e com o atributo como contrato explícito.** O usuário não vê nem ouve o `data-testid`, e a página de queries o reserva para quando papel e texto não servem. [`#queries/about`](https://testing-library.com/docs/queries/about/)

### Interação

- **Interação se faz com `user-event`; `fireEvent` só no caso que ele não cobre (ex.: arrastar e soltar).** `fireEvent` dispara um evento só, e a pessoa produz uma sequência inteira. [`#dom-testing-library/api-events`](https://testing-library.com/docs/dom-testing-library/api-events/)
- **`userEvent.setup()` no próprio teste, antes do `render`, e os métodos da instância que ele devolve.** A doc desencoraja `render` e `userEvent` em `beforeEach`/`afterEach` e recomenda a instância no lugar das chamadas diretas. [`#user-event/intro`](https://testing-library.com/docs/user-event/intro/)
- **Com relógio falso, `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`; nunca `delay: null`.** Sem o `advanceTimers` o `user-event` espera um timer que nunca anda; `delay: null` não é recomendado desde a 14.1. [`#user-event/options`](https://testing-library.com/docs/user-event/options/)
- **Relógio falso se desfaz no `afterEach`: avance os pendentes e só então volte ao real.** Trocar sem avançar deixa tarefa agendada sem rodar e o relógio falso vaza para o teste seguinte. [`#using-fake-timers`](https://testing-library.com/docs/using-fake-timers/)

---

## Primeiros passos

#### introduction
[doc](https://testing-library.com/docs/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/intro.mdx)

**O que é:** o problema que a família Testing Library resolve e a ideia central (testar como o
usuário usa).
**Para que serve:** o porquê de toda decisão das outras páginas.
**Quando usar:** no primeiro contato com a lib.

#### guiding-principles
[doc](https://testing-library.com/docs/guiding-principles/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/guiding-principles.mdx)

**O que é:** os três princípios: DOM no lugar de instância, utilidade geral, API simples.
**Para que serve:** decidir um caso que nenhuma página cobre.
**Quando usar:** quando o teste começa a olhar estado interno.

#### dom-testing-library/faq
[doc](https://testing-library.com/docs/dom-testing-library/faq/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/dom-testing-library/faq.mdx)

**O que é:** perguntas gerais (que query usar, por que não testar detalhe de implementação,
elemento que não está acessível).
**Para que serve:** resposta rápida para a dúvida recorrente.
**Quando usar:** quando a query certa não é óbvia.

## React Testing Library

#### react-testing-library/intro
[doc](https://testing-library.com/docs/react-testing-library/intro/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/react-testing-library/intro.mdx)

**O que é:** o que é a lib, a instalação com a dependência par `@testing-library/dom` e o que ela
não é (não é executor de teste).
**Para que serve:** instalar certo.
**Quando usar:** ao adicionar a lib.

#### react-testing-library/example-intro
[doc](https://testing-library.com/docs/react-testing-library/example-intro/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/react-testing-library/example-intro.mdx)

**O que é:** um teste completo comentado: rede mockada, clique, espera e asserção.
**Para que serve:** modelo de teste de componente que carrega dado.
**Quando usar:** ao escrever o primeiro teste de tela.

#### react-testing-library/setup
[doc](https://testing-library.com/docs/react-testing-library/setup/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/react-testing-library/setup.mdx)

**O que é:** `render` customizado com `wrapper`, queries próprias, ambiente `jsdom`, `cleanup`
automático e a seção "Auto Cleanup in Vitest".
**Para que serve:** montar o `setupFiles` e o `render` com os providers do projeto.
**Quando usar:** ao configurar o Vitest do frontend.

#### react-testing-library/api
[doc](https://testing-library.com/docs/react-testing-library/api/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/react-testing-library/api.mdx)

**O que é:** `render` e as opções (`wrapper`, `container`, `onCaughtError`, `reactStrictMode`), o
resultado (`rerender`, `unmount`, `debug`), `cleanup`, `act` e `renderHook`.
**Para que serve:** a referência de cada função exportada.
**Quando usar:** ao usar uma opção além do `render` simples.

#### react-testing-library/faq
[doc](https://testing-library.com/docs/react-testing-library/faq/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/react-testing-library/faq.mdx)

**O que é:** testar error boundary, mockar componente, que nível da árvore testar, e outros casos
de React.
**Para que serve:** caso de React que a página de API não responde.
**Quando usar:** ao testar boundary, portal ou componente com filho pesado.

#### react-testing-library/cheatsheet
[doc](https://testing-library.com/docs/react-testing-library/cheatsheet/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/react-testing-library/cheatsheet.mdx)

**O que é:** a tabela de todas as queries, variantes e utilitários numa página.
**Para que serve:** consulta rápida.
**Quando usar:** ao escrever teste.

## Queries

#### queries/about
[doc](https://testing-library.com/docs/queries/about/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/about.mdx)

**O que é:** tipos de query (`getBy`, `queryBy`, `findBy`, `All`), a prioridade oficial, `screen`
e o `TextMatch`.
**Para que serve:** escolher a query certa.
**Quando usar:** em todo teste; é a página mais importante.

#### queries/byrole
[doc](https://testing-library.com/docs/queries/byrole/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/byrole.mdx)

**O que é:** a query por papel ARIA e as opções (`name`, `hidden`, `selected`, `checked`, `level`
e outras).
**Para que serve:** achar o elemento como a tecnologia assistiva acha.
**Quando usar:** primeira escolha para quase tudo.

#### queries/bylabeltext
[doc](https://testing-library.com/docs/queries/bylabeltext/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/bylabeltext.mdx)

**O que é:** achar o campo pelo rótulo (`<label>`, `aria-labelledby`, `aria-label`).
**Para que serve:** campo de formulário.
**Quando usar:** quando o papel não distingue o campo.

#### queries/byplaceholdertext
[doc](https://testing-library.com/docs/queries/byplaceholdertext/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/byplaceholdertext.mdx)

**O que é:** achar o campo pelo `placeholder`.
**Para que serve:** campo sem rótulo (que já é um defeito de acessibilidade).
**Quando usar:** só quando não há rótulo.

#### queries/bytext
[doc](https://testing-library.com/docs/queries/bytext/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/bytext.mdx)

**O que é:** achar pelo texto visível, com `selector` e `ignore`.
**Para que serve:** elemento não interativo (parágrafo, `div`, `span`).
**Quando usar:** para conteúdo que não tem papel próprio.

#### queries/bydisplayvalue
[doc](https://testing-library.com/docs/queries/bydisplayvalue/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/bydisplayvalue.mdx)

**O que é:** achar `input`, `select` ou `textarea` pelo valor atual.
**Para que serve:** formulário de edição já preenchido.
**Quando usar:** ao conferir o valor carregado num campo.

#### queries/byalttext
[doc](https://testing-library.com/docs/queries/byalttext/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/byalttext.mdx)

**O que é:** achar imagem e área pelo `alt`.
**Para que serve:** imagem com texto alternativo.
**Quando usar:** quando o elemento é imagem.

#### queries/bytitle
[doc](https://testing-library.com/docs/queries/bytitle/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/bytitle.mdx)

**O que é:** achar pelo atributo `title` ou pelo `<title>` de SVG.
**Para que serve:** ícone com título.
**Quando usar:** raramente; o `title` não é lido de forma consistente.

#### queries/bytestid
[doc](https://testing-library.com/docs/queries/bytestid/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/queries/bytestid.mdx)

**O que é:** achar por `data-testid`, e o porquê de ser o último recurso.
**Para que serve:** elemento sem papel nem texto estável.
**Quando usar:** só depois de descartar as outras.

## Ações e espera

#### dom-testing-library/api-events
[doc](https://testing-library.com/docs/dom-testing-library/api-events/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/dom-testing-library/api-events.mdx)

**O que é:** `fireEvent` e `createEvent`, com o aviso de que quase sempre o certo é `user-event`.
**Para que serve:** o caso que o `user-event` não cobre (arrastar e soltar).
**Quando usar:** só nesse caso.

#### dom-testing-library/api-async
[doc](https://testing-library.com/docs/dom-testing-library/api-async/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/dom-testing-library/api-async.mdx)

**O que é:** `findBy`, `waitFor` e `waitForElementToBeRemoved`, com `timeout` e `interval`.
**Para que serve:** esperar o DOM mudar depois de uma resposta ou de um efeito.
**Quando usar:** em todo teste que depende de algo assíncrono.

#### guide-disappearance
[doc](https://testing-library.com/docs/guide-disappearance/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/guide-disappearance.mdx)

**O que é:** esperar algo aparecer, esperar sumir e afirmar que não está presente.
**Para que serve:** carregamento que some, modal que fecha, item removido.
**Quando usar:** ao testar o estado de carregamento e o de vazio.

#### guide-events
[doc](https://testing-library.com/docs/guide-events/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/guide-events.mdx)

**O que é:** por que `fireEvent` não é o que o navegador faz (foco, teclado, interação), e como
contornar quando não há outro jeito.
**Para que serve:** entender o que o `fireEvent` deixa de testar.
**Quando usar:** antes de usar `fireEvent`.

#### using-fake-timers
[doc](https://testing-library.com/docs/using-fake-timers/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/guides-using-fake-timers.mdx)

**O que é:** ligar relógio falso no `beforeEach` e desligar no `afterEach`, avançando os timers
pendentes antes de voltar ao real.
**Para que serve:** debounce, toast com prazo, contagem regressiva.
**Quando usar:** ao usar `vi.useFakeTimers()` num teste de componente.

## Avançado

#### dom-testing-library/api-accessibility
[doc](https://testing-library.com/docs/dom-testing-library/api-accessibility/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/dom-testing-library/api-accessibility.mdx)

**O que é:** `getRoles`, `logRoles` e `isInaccessible`.
**Para que serve:** descobrir o papel e o nome que o elemento realmente tem.
**Quando usar:** quando `getByRole` não acha o que deveria.

#### dom-testing-library/api-custom-queries
[doc](https://testing-library.com/docs/dom-testing-library/api-custom-queries/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/dom-testing-library/api-custom-queries.mdx)

**O que é:** `buildQueries` e `queryHelpers` para criar query própria.
**Para que serve:** caso que nenhuma query padrão resolve.
**Quando usar:** raramente; a doc diz que quase nunca é preciso.

#### dom-testing-library/api-debugging
[doc](https://testing-library.com/docs/dom-testing-library/api-debugging/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/dom-testing-library/api-debugging.mdx)

**O que é:** `screen.debug`, `prettyDOM`, `logTestingPlaygroundURL` e o tamanho da saída.
**Para que serve:** ver o DOM no momento da falha.
**Quando usar:** ao depurar teste vermelho.

#### dom-testing-library/api-within
[doc](https://testing-library.com/docs/dom-testing-library/api-within/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/dom-testing-library/api-within.mdx)

**O que é:** `within(elemento)` para consultar só dentro de um trecho.
**Para que serve:** a linha de uma tabela, o item de uma lista, o diálogo aberto.
**Quando usar:** quando a mesma query acha vários elementos na tela.

#### dom-testing-library/api-configuration
[doc](https://testing-library.com/docs/dom-testing-library/api-configuration/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/dom-testing-library/api-configuration.mdx)

**O que é:** `configure` (`asyncUtilTimeout`, `testIdAttribute`, `defaultHidden`,
`getElementError` e outras).
**Para que serve:** ajustar a lib uma vez, no arquivo de setup.
**Quando usar:** só com necessidade medida (ex.: timeout de `findBy`).

## user-event

#### user-event/intro
[doc](https://testing-library.com/docs/user-event/intro/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/intro.mdx)

**O que é:** o que é o `user-event@14`, a diferença para `fireEvent` e onde chamar
`userEvent.setup()`.
**Para que serve:** escrever a interação do teste.
**Quando usar:** em todo teste que clica, digita ou navega por teclado.

#### user-event/install
[doc](https://testing-library.com/docs/user-event/install/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/install.mdx)

**O que é:** a instalação e o aviso de que `@testing-library/dom` precisa ser a mesma cópia usada
pela React Testing Library.
**Para que serve:** evitar duas cópias da DOM Testing Library.
**Quando usar:** ao adicionar o pacote.

#### user-event/setup
[doc](https://testing-library.com/docs/user-event/setup/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/setup.mdx)

**O que é:** a sessão por `setup()`, as chamadas diretas e o que o `setup()` troca no documento
(área de transferência, por exemplo).
**Para que serve:** entender por que a instância é o caminho recomendado.
**Quando usar:** ao começar o teste.

#### user-event/options
[doc](https://testing-library.com/docs/user-event/options/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/options.mdx)

**O que é:** as opções do `setup()` (`advanceTimers`, `delay`, `pointerEventsCheck`,
`skipHover` e outras).
**Para que serve:** combinar `user-event` com relógio falso.
**Quando usar:** quando o teste usa `vi.useFakeTimers()`.

#### user-event/pointer
[doc](https://testing-library.com/docs/user-event/pointer/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/api-pointer.mdx)

**O que é:** a API de ponteiro (`pointer`) para sequência de mouse e toque.
**Para que serve:** interação que `click` e `hover` não descrevem.
**Quando usar:** em seleção, arrasto curto ou clique com botão específico.

#### user-event/keyboard
[doc](https://testing-library.com/docs/user-event/keyboard/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/api-keyboard.mdx)

**O que é:** a API de teclado (`keyboard`), com a sintaxe de tecla mantida e combinação.
**Para que serve:** atalho, navegação por teclado, `Escape` e `Enter`.
**Quando usar:** ao testar acessibilidade por teclado.

#### user-event/clipboard
[doc](https://testing-library.com/docs/user-event/clipboard/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/api-clipboard.mdx)

**O que é:** `copy`, `cut` e `paste`.
**Para que serve:** botão de copiar e campo que aceita colagem.
**Quando usar:** quando o componente lê ou escreve a área de transferência.

#### user-event/utility
[doc](https://testing-library.com/docs/user-event/utility/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/api-utility.mdx)

**O que é:** `clear`, `selectOptions`, `deselectOptions`, `type` e `upload`.
**Para que serve:** preencher campo, escolher opção, enviar arquivo.
**Quando usar:** em teste de formulário.

#### user-event/convenience
[doc](https://testing-library.com/docs/user-event/convenience/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/user-event/api-convenience.mdx)

**O que é:** `click`, `dblClick`, `tripleClick`, `hover`, `unhover` e `tab`.
**Para que serve:** a interação comum em uma chamada.
**Quando usar:** na maior parte dos testes.

## Ecossistema

#### ecosystem-jest-dom
[doc](https://testing-library.com/docs/ecosystem-jest-dom/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/ecosystem-jest-dom.mdx)

**O que é:** os matchers de DOM (`toBeInTheDocument`, `toHaveTextContent`, `toBeVisible` e
outros).
**Para que serve:** asserção legível sobre o DOM, também no `expect` do Vitest.
**Quando usar:** ao montar o arquivo de setup dos testes.

#### ecosystem-eslint-plugin-testing-library
[doc](https://testing-library.com/docs/ecosystem-eslint-plugin-testing-library/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/ecosystem-eslint-plugin-testing-library.mdx)

**O que é:** o plugin de ESLint com as boas práticas da lib e config por framework (React).
**Para que serve:** reprovar no lint o anti-padrão (query errada, `await` que falta).
**Quando usar:** ao configurar o ESLint do frontend.

#### ecosystem-eslint-plugin-jest-dom
[doc](https://testing-library.com/docs/ecosystem-eslint-plugin-jest-dom/) | [markdown](https://raw.githubusercontent.com/testing-library/testing-library-docs/main/docs/ecosystem-eslint-plugin-jest-dom.mdx)

**O que é:** o plugin de ESLint que troca asserção genérica pelo matcher de `jest-dom` certo.
**Para que serve:** asserção mais clara e mensagem de erro melhor.
**Quando usar:** junto com o `jest-dom`.
