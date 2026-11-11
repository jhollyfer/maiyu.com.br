# tailwind-merge

Junta classes do Tailwind em JavaScript resolvendo conflito: a última classe que conflita vence.

Última verificação: 2026-11-08 (fonte: `packages/tailwind-merge/docs/README.md` de dcastil/tailwind-merge, branch `main`)

> Conferido contra `tailwind-merge@3.7.0` (latest).

**O que é:** uma função (`twMerge`) que recebe strings de classe, entende quais classes do Tailwind
mexem na mesma propriedade (`p-3` contra `px-2`, `bg-red-500` contra `bg-[#B91C1C]`) e devolve só a
que vence, com resultado em cache LRU. Tem `twJoin`, que só junta sem resolver conflito, e
`extendTailwindMerge` para ensinar escala custom do tema. A v3 cobre o Tailwind v4.0 a v4.3; a v2.6
é a do Tailwind v3.

**Para que serve:** deixar o componente aceitar `className` de fora sem que a classe padrão dele
brigue com a passada. Na régua ele mora dentro do `cn()` de `lib/cn.ts`, junto do `clsx`, com
`extendTailwindMerge` quando o tema tem escala custom (`frontend.md`, "Classe e variante";
`typescript.md` §6).

**Como usar:**

```bash
pnpm add tailwind-merge clsx
```

```ts
// lib/cn.ts: o único lugar que importa do pacote
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ReadonlyArray<ClassValue>): string {
  // clsx aceita objeto de condição; twMerge não
  return twMerge(clsx(inputs))
}
```

```tsx
<button className={cn('rounded-md px-4 py-2', { 'opacity-50': disabled }, className)} />
```

**Links:** 11.

**Skills:** `maiyu-frontend`, `shadcn`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com tailwind-merge: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Montagem

- **Com Tailwind v4, tailwind-merge v3; a v2.6 é só para Tailwind v3.** O pacote declara suporte do Tailwind v4.0 ao v4.3. [`#README`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/README.md)
- **Importe `twMerge` de um arquivo do projeto (o `cn` do shadcn serve), nunca do pacote em cada componente.** Configurar depois vira mudança num arquivo só, e a página cita o helper `cn` do shadcn como esse arquivo. [`#configuration`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/configuration.md)
- **Escala custom do tema (tamanho de fonte, espaçamento, grupo de classe novo) entra por `extendTailwindMerge` nesse arquivo; cor custom em `--color-*` não precisa de configuração.** O `twMerge` padrão só conhece o tema padrão, mas aceita qualquer nome de cor. [`#configuration`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/configuration.md)
- **Chame `extendTailwindMerge` (ou `createTailwindMerge`) uma vez e guarde em variável de topo, nunca dentro de função chamada a toda hora.** Cada chamada monta uma estrutura de dados grande. [`#api-reference`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/api-reference.md)
- **Não importe de `tailwind-merge/unstable-do-not-import`.** O que sai dali pode mudar ou sumir em qualquer versão, até em patch, e não é para aplicação. [`#versioning`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/versioning.md)

### Uso no componente

- **O `className` recebido vai como último argumento do merge.** É o uso principal da lib: a classe de fora vence a padrão do componente. [`#when-and-how-to-use-it`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/when-and-how-to-use-it.md)
- **Classe só interna, sem `className` de fora, prefere `twJoin` a `twMerge`, como regra prática.** O `twJoin` não calcula conflito, tem o custo de um `clsx` e obriga o código a não ter conflito. [`#when-and-how-to-use-it`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/when-and-how-to-use-it.md)
- **Objeto de condição (`{ 'is-active': ativo }`) passa pelo `clsx` antes, dentro do `cn`; o `twMerge` aceita string, falsy e array, não objeto.** A página lista só esses tipos, e a receita de aceitar a entrada do `clsx` é envolver o `twMerge` no arquivo próprio. [`#features`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/features.md)

### Limites

- **Classe própria do projeto não imita nome do Tailwind (`text-2xs`); usa prefixo que não casa (`typography-2xs`, `app-`).** A lib trata como Tailwind tudo que tem a forma de Tailwind, mesmo que o tema não defina. [`#limitations`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/limitations.md)
- **Valor arbitrário ambíguo leva rótulo: `font-(family-name:--x)` para família, `bg-[position:...]` e `bg-[size:...]` para fundo.** Sem rótulo a lib não sabe a propriedade e chuta (no `font-*`, peso). [`#limitations`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/limitations.md)
- **Não conte com o merge para classe feita com `@apply` ou CSS próprio, nem entre propriedade arbitrária (`[padding:1rem]`) e classe padrão.** A lib só entende classe do Tailwind e não analisa CSS. [`#limitations`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/limitations.md)
- **Atualização minor ou patch pode mudar a classe que vence; confira a tela ao subir de versão.** A página diz que correção e suporte novo alteram o estilo aplicado sem quebrar a API. [`#versioning`](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/versioning.md)

---

## Começo

#### README
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/README.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/README.md)

**O que é:** a visão geral: o exemplo de `twMerge`, as versões do Tailwind suportadas (v4.0 a v4.3;
Tailwind v3 fica na v2.6) e o índice da doc.
**Para que serve:** conferir se a versão do pacote casa com a do Tailwind.
**Quando usar:** ao instalar e a cada major do Tailwind.

#### what-is-it-for
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/what-is-it-for.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/what-is-it-for.md)

**O que é:** o problema que a lib resolve: sobrescrever um estilo do componente num caso só, sem que
a classe padrão e a passada briguem pela ordem do CSS.
**Para que serve:** entender por que juntar string de classe não basta.
**Quando usar:** antes do primeiro uso.

#### when-and-how-to-use-it
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/when-and-how-to-use-it.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/when-and-how-to-use-it.md)

**O que é:** quando usar e quando não (tamanho do bundle, liberdade demais para quem usa o
componente), `twJoin` para classe interna, `twMerge` com `className`, e as alternativas.
**Para que serve:** decidir entre `twJoin` e `twMerge` no componente.
**Quando usar:** ao escrever componente que aceita `className`.

## Funcionamento

#### features
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/features.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/features.md)

**O que é:** o comportamento do merge (última vence, refinamento, modificadores, valor e variante
arbitrários, `!important`, classe que não é do Tailwind preservada, cor custom), os tipos de
argumento aceitos e o cache.
**Para que serve:** prever o resultado de um merge sem testar.
**Quando usar:** quando o resultado do `cn` surpreende.

#### limitations
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/limitations.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/limitations.md)

**O que é:** o que a lib não resolve: classe que imita Tailwind, valor arbitrário ambíguo sem
rótulo, propriedade e variante arbitrárias contra classe padrão, CSS próprio, string enorme.
**Para que serve:** evitar o conflito que o merge não pega.
**Quando usar:** ao criar classe própria ou usar valor arbitrário.

## Configuração

#### configuration
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/configuration.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/configuration.md)

**O que é:** instalação, o arquivo único de onde o `twMerge` é importado, quando o tema custom exige
configuração, a forma do config (grupos, conflitos, tema) e `extendTailwindMerge`.
**Para que serve:** ensinar ao merge a escala custom do tema do projeto.
**Quando usar:** ao montar o `lib/cn.ts` e quando o tema ganha escala nova.

#### recipes
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/recipes.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/recipes.md)

**O que é:** receitas: escala custom do tema no config, classe feita com `@apply`, e envolver o
`twMerge` para aceitar a entrada do `clsx`.
**Para que serve:** os casos que a configuração básica não cobre.
**Quando usar:** ao adaptar o `cn`.

#### api-reference
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/api-reference.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/api-reference.md)

**O que é:** todas as exportações: `twMerge`, `twJoin`, `getDefaultConfig`, `fromTheme`,
`extendTailwindMerge`, `createTailwindMerge`, `mergeConfigs`, `validators` e os tipos.
**Para que serve:** a assinatura exata de cada função e validador.
**Quando usar:** ao configurar grupo de classe ou tipar o config.

#### writing-plugins
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/writing-plugins.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/writing-plugins.md)

**O que é:** como escrever plugin de tailwind-merge para as classes de um plugin do Tailwind.
**Para que serve:** publicar a configuração de merge junto do plugin do Tailwind.
**Quando usar:** só ao escrever plugin.

## Projeto

#### versioning
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/versioning.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/versioning.md)

**O que é:** a política de SemVer: o que patch, minor e major podem mudar, os canais `alpha`, `beta`
e `dev`, e a entrada instável `tailwind-merge/unstable-do-not-import`.
**Para que serve:** saber o que uma atualização pode mudar na tela.
**Quando usar:** ao subir de versão.

#### similar-packages
[doc](https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/similar-packages.md) | [markdown](https://raw.githubusercontent.com/dcastil/tailwind-merge/main/packages/tailwind-merge/docs/similar-packages.md)

**O que é:** a lista de pacotes parecidos, em TypeScript e em outras linguagens.
**Para que serve:** referência; a régua usa só o tailwind-merge dentro do `cn`.
**Quando usar:** raramente.
