# Components Common

O **kit** do site: peças que mais de uma área alcança. Diferente de
`components/ui` (design system puro sobre Base UI), estas carregam a cara da
Maiyu.

## O critério: rota, não pasta

Da skill `code-pattern` §8, o mesmo do academy: um componente só mora aqui se
**mais de uma rota** o usa, e o que conta é quantas rotas o alcançam, não
quantas vezes ele é importado.

A régua tem uma consequência aqui que o academy também registra: o que é peça
da vitrine e só a vitrine usa mora na casca pública, em
`routes/_public/-components/`, mesmo quando quatro páginas o consomem. É o caso
do `PageHero`, do `reveal.ts`, do `menu.ts` e dos formulários. Sobe para cá o
que uma área **fora** da vitrine também desenha.

| Peça                 | Por que mora aqui                                                              |
| -------------------- | ------------------------------------------------------------------------------ |
| `not-found-page.tsx` | o `router.tsx` desenha o 404 e o erro fora de qualquer casca                   |
| `sky.tsx`            | a página de erro, que é deste diretório, usa o céu; e a vitrine inteira também |
| `pill-button.tsx`    | o botão da marca, como no academy, usado pela vitrine e pela página de erro    |
| `theme-toggle.tsx`   | o mesmo do academy, sem mudança além do texto traduzido                        |

## Compound onde há estado compartilhado

`not-found-page.tsx` é compound sem diretório próprio, como no academy:
`NotFoundPage` com `Title`, `Subtitle`, `Description`, `Actions` e
`HomeButton`. O texto vai por slot; o que fica em prop é o `code` e o destino
do botão.

Peça sem estado compartilhado não vira compound: um provider vazio é só
cerimônia.
