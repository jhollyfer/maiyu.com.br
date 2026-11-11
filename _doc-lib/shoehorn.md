# shoehorn

Dado parcial em teste sem `as`: o objeto incompleto entra no lugar do tipo completo e o TypeScript
continua checando o que foi passado.

Última verificação: 2026-11-08 (fonte: `rEaDMe.md` de total-typescript/shoehorn, branch `main`)

> Conferido contra `@total-typescript/shoehorn@0.1.2` (latest).

**O que é:** três funções de identidade com tipo: `fromPartial` aceita um parcial profundo do tipo
esperado e reprova o que não casa com ele, `fromExact` exige o objeto inteiro, e `fromAny` aceita
qualquer coisa mantendo o autocomplete. Nenhuma faz nada em runtime além de devolver o valor.

**Para que serve:** dublê e fixture de teste que só precisa de parte de um tipo grande (a requisição
do framework, o contexto HTTP, a resposta de um SDK), sem `as Tipo` nem `as unknown as Tipo`
(`typescript.md` §1, "Dado parcial em teste"; `frontend.md` §11.1). A régua aceita só `fromPartial`, e
só em arquivo de teste.

**Como usar:**

```bash
pnpm add -D @total-typescript/shoehorn
```

```ts
import { fromPartial } from '@total-typescript/shoehorn'
import type { HttpContext } from '@adonisjs/core/http'

test('lê o id do corpo', async ({ assert }) => {
  const ctx = fromPartial<HttpContext>({ request: { input: () => '42' } })
  assert.equal(readOrderId(ctx), '42')
})
```

**Links:** 4.

**Skills:** `maiyu-typescript`, `migrate-to-shoehorn`, `code-pattern`, `superpowers:test-driven-development`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com shoehorn: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

- **Dado parcial em teste entra por `fromPartial`, nunca por `as` nem por `as unknown as`.** O `as` obriga a escrever o tipo à mão e o duplo `as` desliga a checagem; `fromPartial` infere o tipo do lugar e checa o parcial. [`#rEaDMe/problem`](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#problem), [`#rEaDMe/frompartial`](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#frompartial)
- **Antes do `fromPartial`, a função testada pede só o dado que usa; o parcial fica para tipo de terceiro e código legado.** A página diz que precisar passar objeto enorme em teste é sinal de tipo frouxo. [`#rEaDMe/but-isnt-passing-partial-data-to-tests-bad`](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#but-isnt-passing-partial-data-to-tests-bad)
- **`fromAny` não serve como atalho de parcial.** Ele não falha com valor que não casa com o tipo, nem com uma string no lugar do objeto. [`#rEaDMe/fromany`](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#fromany)
- **Para alternar entre parcial e objeto completo sem trocar a forma do teste, `fromExact`.** Ele exige todas as propriedades do tipo. [`#rEaDMe/fromexact`](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#fromexact)

---

## README

#### rEaDMe/problem
[doc](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#problem) | [markdown](https://raw.githubusercontent.com/total-typescript/shoehorn/main/rEaDMe.md)

**O que é:** o problema (`as` em teste, tipo escrito à mão, duplo `as` para dado inválido), a
solução com `fromPartial` e a seção "But isn't passing partial data to tests bad?", que limita o
uso a legado e tipo de terceiro.
**Para que serve:** saber quando o parcial é a resposta e quando o tipo da função é que está largo.
**Quando usar:** antes de escrever o primeiro dublê parcial de um tipo.

#### rEaDMe/frompartial
[doc](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#frompartial) | [markdown](https://raw.githubusercontent.com/total-typescript/shoehorn/main/rEaDMe.md)

**O que é:** `fromPartial`, que aceita um parcial profundo do tipo esperado e reprova valor sem
propriedade em comum com ele.
**Para que serve:** o dublê parcial que a régua permite.
**Quando usar:** em `*.unit.spec.ts`, `*.e2e.spec.ts`, `*.test.ts(x)` e `e2e/` (`typescript.md` §1).

#### rEaDMe/fromany
[doc](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#fromany) | [markdown](https://raw.githubusercontent.com/total-typescript/shoehorn/main/rEaDMe.md)

**O que é:** `fromAny`, que aceita qualquer valor e só mantém o autocomplete do tipo.
**Para que serve:** na régua, nada: dado inválido de propósito vai para quem já aceita `unknown`
(`typescript.md` §1 e §2).
**Quando usar:** não usar; a entrada existe para reconhecer e remover o uso.

#### rEaDMe/fromexact
[doc](https://github.com/total-typescript/shoehorn/blob/main/rEaDMe.md#fromexact) | [markdown](https://raw.githubusercontent.com/total-typescript/shoehorn/main/rEaDMe.md)

**O que é:** `fromExact`, que exige todas as propriedades do tipo.
**Para que serve:** trocar um `fromPartial` por objeto completo mantendo a mesma chamada.
**Quando usar:** quando o teste passa a depender do objeto inteiro.
