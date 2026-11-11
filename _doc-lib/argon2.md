# node-argon2

Binding nativo da implementação de referência do Argon2 para hash e verificação de senha.

Última verificação: 2026-11-08 (fonte: README de ranisalt/node-argon2, branch `master`, e wiki do repositório)

> Conferido contra `argon2@0.45.2` (latest).

**O que é:** o pacote `argon2` no npm. Gera o hash em formato PHC (`$argon2id$v=19$m=...,t=...,p=...$sal$hash`),
verifica a senha contra esse texto e diz se o hash precisa ser refeito. A variante padrão é
`argon2id` e os parâmetros padrão seguem a recomendação do time do Argon2. É binário nativo: o
`install` roda `node-gyp-build`, que usa o pré-compilado da plataforma ou compila do fonte.

**Para que serve:** hash de senha no Adonis, onde o driver `argon` de `config/hash.ts` exige o
pacote instalado (`backend.md` §5.6, item 6; _doc-lib/adonisjs.md#guides/security/hashing). No
Fastify a régua usa `crypto.argon2` da stdlib, e o README do próprio pacote compara as duas
(seção "Comparison with the node:crypto native implementation"): a nativa gera o hash, mas não
formata nem verifica PHC, não diz se precisa refazer e não traz parâmetro padrão.

**Como usar:**

```bash
pnpm add argon2
```

```ts
// config/hash.ts (Adonis): o driver usa o pacote; o projeto não chama argon2 direto
import { defineConfig, drivers } from '@adonisjs/core/hash'

export default defineConfig({
  default: 'argon',
  list: {
    argon: drivers.argon2({ variant: 'id' }),
  },
})
```

```ts
// uso direto, quando não há driver: padrão do pacote, sem sal nem parâmetro à mão
import * as argon2 from 'argon2'

const hash = await argon2.hash(password)
const ok = await argon2.verify(hash, password)
```

O pacote tem script de build: no pnpm ele entra em `allowBuilds` (`tooling.md` §1).

**Links:** 6.

**Skills:** `maiyu-backend`, `maiyu-node`, `security-best-practices`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com argon2: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Parâmetros

- **Senha usa a variante `argon2id`.** É a híbrida, resistente a ataque por GPU e por troca de tempo por memória, e é o padrão do pacote. [`#wiki/Options`](https://github.com/ranisalt/node-argon2/wiki/Options)
- **Para senha, os parâmetros padrão do pacote ficam como estão.** O README diz que eles seguem a recomendação do time do Argon2 e que, para senha, não há por que mudar. [`#README/usage`](https://github.com/ranisalt/node-argon2/blob/master/README.md#usage), [`#wiki/Options`](https://github.com/ranisalt/node-argon2/wiki/Options)
- **Nunca passar `salt`, `raw` nem `version` para hash de senha.** O sal aleatório já é gerado e gravado no hash, `raw: true` impede o `verify`, e a página põe os três em "Here be dragons". [`#wiki/Options`](https://github.com/ranisalt/node-argon2/wiki/Options)
- **Pepper, quando houver, entra por `secret` como `Buffer`, aleatório e guardado com segurança.** Ao contrário do sal, ele não fica gravado no hash, e a página pede valor imprevisível e protegido. [`#wiki/Options`](https://github.com/ranisalt/node-argon2/wiki/Options)
- **A memória do container comporta `memoryCost` (64 MiB por thread no padrão) vezes o login simultâneo.** A página avisa que valor alto com muita concorrência esgota a memória e trava o sistema. [`#wiki/Options`](https://github.com/ranisalt/node-argon2/wiki/Options)

### Migração e stdlib

- **Hash antigo (scrypt, bcrypt) migra no login: ramifica pelo prefixo do hash gravado, confere com a função antiga e grava o novo com Argon2.** É o caminho gradual da página, sem forçar troca de senha. [`#wiki/Migrating-from-another-hash-function`](https://github.com/ranisalt/node-argon2/wiki/Migrating-from-another-hash-function)
- **Quem usa `crypto.argon2` da stdlib escolhe e grava os parâmetros e faz a verificação por conta própria.** A tabela do README mostra que a nativa não formata PHC, não verifica PHC, não diz se precisa refazer e não traz padrão. [`#README/comparison-with-the-nodecrypto-native-implementation`](https://github.com/ranisalt/node-argon2/blob/master/README.md#comparison-with-the-nodecrypto-native-implementation)

### Instalação

- **A imagem usa o binário pré-compilado (Ubuntu 22.04, Alpine 3.18, macOS, Windows e FreeBSD listados); fora dessa lista, a etapa de build tem `node-gyp`, GCC 5 ou maior (ou Clang 3.3) e Node 22 ou maior.** Sem binário para a plataforma, o pacote compila do fonte. [`#README/prebuilt-binaries`](https://github.com/ranisalt/node-argon2/blob/master/README.md#prebuilt-binaries), [`#README/before-installing`](https://github.com/ranisalt/node-argon2/blob/master/README.md#before-installing)

---

## README

#### README/usage
[doc](https://github.com/ranisalt/node-argon2/blob/master/README.md#usage) | [markdown](https://raw.githubusercontent.com/ranisalt/node-argon2/master/README.md)

**O que é:** `argon2.hash(password)` e `argon2.verify(hash, password)`, as três variantes (`argon2id`
padrão) e o uso em TypeScript com os tipos publicados no pacote.
**Para que serve:** o mínimo para gerar e conferir hash de senha.
**Quando usar:** ao chamar o pacote fora de um driver de framework.

#### README/comparison-with-the-nodecrypto-native-implementation
[doc](https://github.com/ranisalt/node-argon2/blob/master/README.md#comparison-with-the-nodecrypto-native-implementation) | [markdown](https://raw.githubusercontent.com/ranisalt/node-argon2/master/README.md)

**O que é:** a tabela que compara o pacote com `crypto.argon2` do Node (PHC, verificação, rehash,
parâmetros padrão) e o plano de o pacote virar um invólucro mínimo da nativa.
**Para que serve:** saber o que o service de hash do Fastify precisa fazer por conta própria.
**Quando usar:** ao escolher entre pacote e stdlib e ao escrever o service sobre `crypto.argon2`.

#### README/prebuilt-binaries
[doc](https://github.com/ranisalt/node-argon2/blob/master/README.md#prebuilt-binaries) | [markdown](https://raw.githubusercontent.com/ranisalt/node-argon2/master/README.md)

**O que é:** as plataformas com binário pré-compilado (glibc, Alpine, macOS, Windows, FreeBSD).
**Para que serve:** saber se a imagem Docker instala sem compilador.
**Quando usar:** ao escolher a imagem base do backend.

#### README/before-installing
[doc](https://github.com/ranisalt/node-argon2/blob/master/README.md#before-installing) | [markdown](https://raw.githubusercontent.com/ranisalt/node-argon2/master/README.md)

**O que é:** o que a compilação do fonte exige (`node-gyp`, GCC ou Clang, Node 22 ou maior) e o FAQ
de rebuild com `@mapbox/node-pre-gyp`.
**Para que serve:** instalar quando não há binário para a plataforma.
**Quando usar:** quando o `install` falha na imagem ou no CI.

## Wiki

#### wiki/Options
[doc](https://github.com/ranisalt/node-argon2/wiki/Options) | [markdown](https://raw.githubusercontent.com/wiki/ranisalt/node-argon2/Options.md)

**O que é:** cada opção de `argon2.hash`: `hashLength` (32), `timeCost` (3), `memoryCost` (65536 KiB),
`parallelism` (4), `type` (`argon2id`), `secret`, `associatedData`, e as reservadas `raw`, `version`
e `salt`.
**Para que serve:** saber o padrão e o que não se mexe para senha.
**Quando usar:** antes de tocar em qualquer parâmetro, no pacote ou no driver do Adonis.

#### wiki/Migrating-from-another-hash-function
[doc](https://github.com/ranisalt/node-argon2/wiki/Migrating-from-another-hash-function) | [markdown](https://raw.githubusercontent.com/wiki/ranisalt/node-argon2/Migrating-from-another-hash-function.md)

**O que é:** a migração gradual: no login, identificar a função pelo prefixo do hash, verificar com
ela e regravar com Argon2.
**Para que serve:** trocar `scrypt` por Argon2 sem invalidar senha existente.
**Quando usar:** em projeto que já tem hash gravado com outra função (`backend.md` §5.6, item 6).
