# proxy-addr

Descobre o endereço real do cliente atrás de proxy, confiando só nos saltos que a configuração aceita.

Última verificação: 2026-11-08 (fonte: README de jshttp/proxy-addr, branch `master`)

> Conferido contra `proxy-addr@2.0.8` (latest).

**O que é:** o pacote que lê `X-Forwarded-For` de trás para a frente e para no primeiro endereço que
não é confiável. A confiança é uma função `(addr, i) => boolean`, ou o que o `compile` transforma
nela: um endereço, ou um array de endereços, CIDR (`10.0.0.0/8`), IP/máscara
(`10.0.0.0/255.0.0.0`) e os nomes `loopback`, `linklocal` e `uniquelocal`. É o que roda por baixo do
`trustProxy` do AdonisJS e do Fastify.

**Para que serve:** o `app/core/trusted-proxies.ts` da casa (igual em todo projeto, levado pelo sync
de `_templates/code/`, `DECISIONS.md` #280 e #294) divide `TRUSTED_PROXIES` por vírgula, troca
`cloudflare` pelas faixas publicadas, recusa "confiar em todos" e entrega o array ao
`proxyAddr.compile` uma vez, no boot. O `request.ip()` e o rate limit por IP dependem disso
(`backend.md` §6.2).

**Como usar:**

```bash
pnpm add proxy-addr
pnpm add -D @types/proxy-addr
```

```ts
import proxyAddr from 'proxy-addr'

// array: cada entrada é um endereço, um CIDR ou um nome pré-definido
const trust = proxyAddr.compile(['loopback', 'uniquelocal'])

trust('10.0.1.5', 0) // true: faixa privada
trust('203.0.113.7', 0) // false: endereço público

// string só aceita UM valor; a lista por vírgula é lida como um endereço só
proxyAddr.compile('loopback,uniquelocal') // TypeError: invalid IP address: loopback,uniquelocal
```

**Links:** 3.

**Skills:** `maiyu-backend`, `security-best-practices`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com `proxy-addr`: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Formato da confiança

- **Lista de proxies vai como array; string só carrega um valor.** A doc aceita "um único endereço em string ou um array", e o pacote não divide por vírgula: `'loopback,uniquelocal'` vira um endereço inválido e o `compile` lança `invalid IP address` (conferido contra 2.0.8). [`#README/proxyaddrreq-trust`](https://github.com/jshttp/proxy-addr/blob/master/README.md#proxyaddrreq-trust)
- **Cada entrada é endereço IPv4 ou IPv6, CIDR, IP/máscara ou um dos nomes `loopback`, `linklocal`, `uniquelocal`.** São os formatos que a doc lista; IPv6 é normalizado e IPv4 mapeado em IPv6 casa sem entrada à parte. [`#README/proxyaddrreq-trust`](https://github.com/jshttp/proxy-addr/blob/master/README.md#proxyaddrreq-trust)
- **`uniquelocal` cobre as faixas privadas IPv4 e o unique-local IPv6; `linklocal`, o link-local; `loopback`, `127.0.0.1` e `::1`.** É a expansão que a doc dá para cada nome. [`#README/proxyaddrreq-trust`](https://github.com/jshttp/proxy-addr/blob/master/README.md#proxyaddrreq-trust)

### Compilação

- **Compile a confiança uma vez, na configuração, e reuse a função em toda requisição.** A doc recomenda `compile` adiantado porque a função compilada é a otimizada para rodar por requisição. [`#README/proxyaddrcompileval`](https://github.com/jshttp/proxy-addr/blob/master/README.md#proxyaddrcompileval)

---

## README

#### README/proxyaddrreq-trust
[doc](https://github.com/jshttp/proxy-addr/blob/master/README.md#proxyaddrreq-trust) | [markdown](https://raw.githubusercontent.com/jshttp/proxy-addr/master/README.md)

**O que é:** `proxyaddr(req, trust)` e os formatos de `trust`: função `(addr, i)`, um endereço em
string ou array de endereços, CIDR e IP/máscara, IPv6 normalizado, IPv4 mapeado em IPv6, e os nomes
`loopback`, `linklocal` e `uniquelocal` com o que cada um expande.
**Para que serve:** saber o que pode entrar em `TRUSTED_PROXIES` e por que a lista precisa virar array.
**Quando usar:** ao mexer em `app/core/trusted-proxies.ts`, no catálogo de ENV (`backend.md` §6.2) ou
no `trustProxy` de qualquer backend.

#### README/proxyaddrallreq-trust
[doc](https://github.com/jshttp/proxy-addr/blob/master/README.md#proxyaddrallreq-trust) | [markdown](https://raw.githubusercontent.com/jshttp/proxy-addr/master/README.md)

**O que é:** `proxyaddr.all(req, [trust])`, a cadeia inteira do mais próximo (o socket) ao mais
distante, parando no primeiro não confiável quando há `trust`.
**Para que serve:** depurar o que o proxy da frente está escrevendo em `X-Forwarded-For`.
**Quando usar:** ao investigar `request.ip()` errado atrás de Traefik ou Cloudflare.

#### README/proxyaddrcompileval
[doc](https://github.com/jshttp/proxy-addr/blob/master/README.md#proxyaddrcompileval) | [markdown](https://raw.githubusercontent.com/jshttp/proxy-addr/master/README.md)

**O que é:** `proxyaddr.compile(val)`, que transforma os mesmos formatos de `trust` numa função
otimizada, e a recomendação de compilar uma vez e reusar.
**Para que serve:** é a chamada que o `TrustedProxies.compile` faz e que o `trustProxy` do Adonis
aceita pronta (`_doc-lib/adonisjs.md#guides/basics/request`, seção "Trusting proxy servers").
**Quando usar:** ao validar `TRUSTED_PROXIES` no boot e ao montar o `config/app.ts`.
