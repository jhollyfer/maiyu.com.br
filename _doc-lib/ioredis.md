# ioredis

Cliente Redis para Node.js, escrito em TypeScript, com reconexão automática, fila offline,
prefixo de chave, pipeline, Lua, Pub/Sub, Sentinel e Cluster.

Última verificação: 2026-11-08 (fonte: pasta `content/develop/clients/ioredis/` de redis/docs, branch `main`, e README de redis/ioredis, branch `main`)

> Conferido contra `ioredis@6.0.0` (latest).

**O que é:** o cliente que a stack já carrega por baixo: o BullMQ aceita `ioredis >= 5` como peer,
o `@adonisjs/redis@11` depende de `ioredis ^6` e o store Redis do limiter usa a mesma conexão.
A 6.x é a major atual (Node 20 ou maior, Redis 6.2 ou maior) e passou a negociar RESP3 por padrão.
A página do redis.io diz, sobre projeto novo: "Redis actively maintains and supports `ioredis`
since it is in widespread use, but for new projects, we recommend using our newer Node.js client
`node-redis`."

**Para que serve:** a conexão da fila (`backend.md` §4.12, `backend-fastify.md`, BullMQ), o
contador do rate limit com mais de uma réplica (`backend.md` §4.10, `backend-fastify.md` §11), o
cache, e o prefixo por worker na suíte de teste (`tooling.md` §10.6). Também é onde moram as opções
que decidem quanto tempo uma requisição fica presa quando o Redis cai (`maxRetriesPerRequest`,
`enableOfflineQueue`).

**Como usar:**

```bash
pnpm add ioredis
```

```ts
import { Redis } from 'ioredis'

// URL interna do orquestrador; rediss:// quando o Redis está atrás de TLS
const redis = new Redis(env.REDIS_URL, {
  keyPrefix: 'loja:prod:',
  // falha o comando depois de 1 nova tentativa em vez de 20 (padrão)
  maxRetriesPerRequest: 1,
})

redis.on('error', (error: unknown) => logger.error({ err: error }, 'redis'))

await redis.set('sessao:42', 'ok')
await redis.quit()
```

No Adonis a conexão nasce de `config/redis.ts` (`@adonisjs/redis`), não de `new Redis()` solto; no
Fastify ela é um service injetável que o desligamento fecha (`backend.md` §5.6, item 5). O worker
do BullMQ usa `maxRetriesPerRequest: null` (_doc-lib/bullmq.md#guide/going-to-production).

**Links:** 10.

**Skills:** `maiyu-backend`, `maiyu-node`, `observability-and-instrumentation`, `security-best-practices`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com ioredis: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Escolha do cliente

- **Cliente Redis novo, fora do que BullMQ, `@adonisjs/redis` e o limiter já trazem, compara `node-redis` antes de escolher ioredis.** A página mantém o ioredis pelo uso amplo e recomenda `node-redis` para projeto novo. [`#develop/clients/ioredis`](https://redis.io/docs/latest/develop/clients/ioredis/)
- **Na 6.x, Node 20 ou maior e revisão do handshake RESP3; `protocol: 2` só para manter o protocolo da 5.x ou atravessar proxy que recusa `HELLO`.** A 6.x manda `HELLO 3` ao abrir a conexão e só cai para RESP2 em `NOPROTO` ou comando desconhecido. [`#wiki/Upgrading-from-v5-to-v6`](https://github.com/redis/ioredis/wiki/Upgrading-from-v5-to-v6)

### Conexão

- **Conexão por URL única (`redis://`, ou `rediss://` com TLS) no construtor.** A URL leva host, porta, credencial, banco e TLS de uma vez. [`#develop/clients/ioredis/connect`](https://redis.io/docs/latest/develop/clients/ioredis/connect/), [`#README/connect-to-redis`](https://github.com/redis/ioredis/blob/main/README.md#connect-to-redis)
- **Em produção, TLS e as orientações de segurança do Redis.** É a seção de produção da página de conexão. [`#develop/clients/ioredis/connect`](https://redis.io/docs/latest/develop/clients/ioredis/connect/)
- **Conexão que acabou o uso fecha com `quit()`.** O guia manda fechar com `client.quit()`, e é o único caso, com `disconnect()`, em que a reconexão automática não roda. [`#develop/clients/ioredis`](https://redis.io/docs/latest/develop/clients/ioredis/), [`#README/auto-reconnect`](https://github.com/redis/ioredis/blob/main/README.md#auto-reconnect)

### Redis fora do ar

- **Comando de requisição HTTP usa `maxRetriesPerRequest` baixo; `null` só no worker.** Por padrão o comando pendente só falha a cada 20 tentativas de reconexão, e `null` faz o comando esperar para sempre. [`#README/auto-reconnect`](https://github.com/redis/ioredis/blob/main/README.md#auto-reconnect)
- **Para recusar comando enquanto não há conexão pronta, `enableOfflineQueue: false`; com ele, comando inicial sai do evento `ready`, nunca do `connect`.** Sem a fila offline, o comando enviado antes de `ready` é rejeitado ("Stream isn't writeable and enableOfflineQueue options is false"). [`#README/offline-queue`](https://github.com/redis/ioredis/blob/main/README.md#offline-queue), [`#wiki/Upgrading-from-v5-to-v6`](https://github.com/redis/ioredis/wiki/Upgrading-from-v5-to-v6)
- **Toda conexão tem listener de `error` que loga.** O ioredis só emite `error` quando há ouvinte, então sem ele a falha de conexão some em silêncio. [`#README/auto-reconnect`](https://github.com/redis/ioredis/blob/main/README.md#auto-reconnect)

### Chaves e erros

- **Prefixo de namespace por `keyPrefix`, sabendo que ele não vale para padrão de `KEYS`/`SCAN` nem para nome de chave na resposta.** Limpeza por `SCAN` (prefixo por worker em teste) põe o prefixo no padrão à mão. [`#README/transparent-key-prefixing`](https://github.com/redis/ioredis/blob/main/README.md#transparent-key-prefixing)
- **`showFriendlyErrorStack` nunca em produção.** A página diz que ele derruba o desempenho e serve só para depurar. [`#README/error-handling`](https://github.com/redis/ioredis/blob/main/README.md#error-handling)
- **Instrumentação de comando e conexão pelos canais `tracing:ioredis:*` de `diagnostics_channel`.** O canal já sai com os argumentos sensíveis (valor de `SET`, senha de `AUTH`) trocados por `?`. [`#README/diagnostics-channel`](https://github.com/redis/ioredis/blob/main/README.md#diagnostics-channel)

---

## Guia do redis.io

#### develop/clients/ioredis
[doc](https://redis.io/docs/latest/develop/clients/ioredis/) | [markdown](https://raw.githubusercontent.com/redis/docs/main/content/develop/clients/ioredis/_index.md)

**O que é:** a página do ioredis no guia de clientes do redis.io: instalar, conectar, gravar e ler
string e hash, fechar com `quit()`, e o aviso de que projeto novo deve preferir `node-redis`.
**Para que serve:** o ponto de partida oficial e a posição do Redis sobre qual cliente escolher.
**Quando usar:** ao decidir o cliente de um uso novo de Redis e ao montar a primeira conexão.

#### develop/clients/ioredis/connect
[doc](https://redis.io/docs/latest/develop/clients/ioredis/connect/) | [markdown](https://raw.githubusercontent.com/redis/docs/main/content/develop/clients/ioredis/connect.md)

**O que é:** conexão básica (opções ou URL), Cluster por `Redis.Cluster()`, Sentinel com credencial
separada e `failoverDetector`, e TLS em produção.
**Para que serve:** configurar a conexão do ambiente certo sem descobrir opção por tentativa.
**Quando usar:** ao escrever `config/redis.ts` (Adonis) ou o service de Redis (Fastify), e ao subir
para produção.

## README

#### README/connect-to-redis
[doc](https://github.com/redis/ioredis/blob/main/README.md#connect-to-redis) | [markdown](https://raw.githubusercontent.com/redis/ioredis/main/README.md)

**O que é:** as formas do construtor `new Redis()`: porta, host, socket, objeto de opções e URL
`redis://`/`rediss://` com usuário, senha e banco.
**Para que serve:** passar o `REDIS_URL` direto, sem desmontar a URL em campos.
**Quando usar:** ao ler o `REDIS_URL` em `config/`.

#### README/auto-reconnect
[doc](https://github.com/redis/ioredis/blob/main/README.md#auto-reconnect) | [markdown](https://raw.githubusercontent.com/redis/ioredis/main/README.md)

**O que é:** `retryStrategy` (padrão exponencial até 5 s com jitter), `maxRetriesPerRequest` (padrão
20, `null` espera para sempre), `blockingTimeout` para comando bloqueante, `reconnectOnError` e a
tabela de eventos de conexão (`connect`, `ready`, `error`, `close`, `reconnecting`, `end`, `wait`).
**Para que serve:** decidir quanto tempo um comando espera quando o Redis cai, que é o que segura
ou libera a requisição HTTP.
**Quando usar:** ao configurar a conexão usada por requisição (enfileirar, limiter, cache) e a do
worker, que pedem valores opostos.

#### README/offline-queue
[doc](https://github.com/redis/ioredis/blob/main/README.md#offline-queue) | [markdown](https://raw.githubusercontent.com/redis/ioredis/main/README.md)

**O que é:** a fila de comandos enviados antes de `ready` e a opção `enableOfflineQueue: false`.
**Para que serve:** recusar o comando de imediato em vez de guardá-lo até a conexão voltar.
**Quando usar:** junto com `maxRetriesPerRequest`, ao fazer o enfileiramento falhar rápido.

#### README/transparent-key-prefixing
[doc](https://github.com/redis/ioredis/blob/main/README.md#transparent-key-prefixing) | [markdown](https://raw.githubusercontent.com/redis/ioredis/main/README.md)

**O que é:** `keyPrefix`, que prefixa toda chave de comando, pipeline, transação e comando Lua, com
o aviso de que não cobre padrão de `KEYS`/`SCAN` nem resposta.
**Para que serve:** namespace por projeto e ambiente (`backend.md` §5.7, item 15) e prefixo por
worker em teste (`tooling.md` §10.6).
**Quando usar:** ao montar a conexão e ao escrever limpeza de chave por padrão.

#### README/diagnostics-channel
[doc](https://github.com/redis/ioredis/blob/main/README.md#diagnostics-channel) | [markdown](https://raw.githubusercontent.com/redis/ioredis/main/README.md)

**O que é:** os canais `ioredis:command`, `ioredis:batch` e `ioredis:connect` de
`node:diagnostics_channel`, com argumento sensível sanitizado.
**Para que serve:** medir comando e conexão sem embrulhar o cliente.
**Quando usar:** ao instrumentar Redis no APM ou no log.

#### README/error-handling
[doc](https://github.com/redis/ioredis/blob/main/README.md#error-handling) | [markdown](https://raw.githubusercontent.com/redis/ioredis/main/README.md)

**O que é:** `ReplyError` para erro devolvido pelo servidor e `showFriendlyErrorStack`, só para
depuração.
**Para que serve:** reconhecer erro do Redis e achar a linha do código que o causou.
**Quando usar:** ao tratar falha de comando e ao depurar localmente.

#### wiki/Upgrading-from-v5-to-v6
[doc](https://github.com/redis/ioredis/wiki/Upgrading-from-v5-to-v6) | [markdown](https://raw.githubusercontent.com/wiki/redis/ioredis/Upgrading-from-v5-to-v6.md)

**O que é:** a lista de mudanças da 6.x: Node 20, `HELLO 3` no handshake, `protocol` e
`replyMapping` (`legacy` padrão, `resp3` opcional), Pub/Sub em RESP3, comando de `connect` que
passa para `ready` sem fila offline, opções RESP em Cluster e Sentinel, tipos do TypeScript.
**Para que serve:** subir da 5.x sem quebrar formato de resposta nem conexão.
**Quando usar:** na migração para a 6.x (o `@adonisjs/redis@11` já exige `^6`).

## API Reference

#### api
[doc](https://redis.github.io/ioredis/)

**O que é:** a referência gerada das classes `Redis` e `Cluster` e de `RedisOptions`, sem versão em
markdown.
**Para que serve:** a lista completa de opções que o README não cobre.
**Quando usar:** quando a opção não está no README nem no guia.
