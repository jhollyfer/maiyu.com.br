# uqr

Gerador de QR Code em ES module, sem dependência, que roda em qualquer runtime (navegador, Node, SSR).

Última verificação: 2026-11-12 (fonte: README do repositório `unjs/uqr`, branch padrão `main`)

> Conferido contra `uqr@0.1.3` (latest).

**O que é:** codifica texto ou binário num QR Code e desenha o resultado em SVG, ANSI ou Unicode. A
doc inteira é o README; os tipos das opções estão no `dist/index.d.ts` do pacote.

**Para que serve:** desenhar o QR do Pix "copia e cola" no frontend (`PixCharge` do kit,
`DECISIONS.md` #400), a partir do `brCode` que a API fixou. O código do Pix nunca é montado no
navegador: o QR é só o desenho do texto que veio pronto.

**Como usar:**

```ts
import { renderSVG } from 'uqr'

const svg = renderSVG(brCode, { ecc: 'M', border: 2 })
```

**Links:** 1.

**Skills:** `maiyu-frontend`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313).

- **`renderSVG` devolve a string do SVG, sem DOM.** Serve no SSR e no navegador igual, então o QR sai
  na primeira renderização, sem efeito nem `useEffect`. [`#README`](https://raw.githubusercontent.com/unjs/uqr/main/README.md)
- **O nível de correção é opção (`ecc`), e a borda também (`border`).** O padrão do pacote é o que o
  README mostra; o kit fixa `ecc: 'M'` porque o QR é lido de tela, sem sujeira nem dobra, e o
  BR Code com valor já é longo. [`#README`](https://raw.githubusercontent.com/unjs/uqr/main/README.md)

---

## Documentação

#### README
[doc](https://github.com/unjs/uqr/blob/main/README.md) | [markdown](https://raw.githubusercontent.com/unjs/uqr/main/README.md)

**O que é:** a instalação, o uso de `encode`, `renderSVG`, `renderANSI`, `renderUnicode` e
`renderUnicodeCompact`, e as opções de correção de erro e de borda.
**Para que serve:** escolher a saída (SVG no frontend) e as opções do desenho.
**Quando usar:** antes de mexer no QR do `PixCharge` ou de desenhar outro QR no frontend.
