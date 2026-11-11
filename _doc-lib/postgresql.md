# PostgreSQL

Banco relacional da casa nos projetos AdonisJS (Lucid) e no driver de dados do Fastify.

Última verificação: 2026-11-08 (fonte: fonte SGML da doc em `postgres/postgres@REL_18_STABLE`, `doc/src/sgml/`; www.postgresql.org recusado pelo proxy desta sessão)

> Conferido contra PostgreSQL 18 (tag `REL_18_6`, latest; a 19 está em `REL_19_RC1`, sem GA). Não há pacote npm: a versão vem das tags do repositório oficial.

**O que é:** o servidor de banco relacional e as ferramentas de cliente que vêm com ele: `pg_dump`
(dump de um banco), `pg_dumpall` (do cluster inteiro, com papéis e tablespaces), `pg_restore` (lê o
formato de arquivo do `pg_dump`) e `psql` (terminal interativo e executor de script). A doc não tem
versão em markdown: só o `[doc]`.

**Para que serve:** provar que o achatamento de migrations não mudou o schema, comparando dois
`pg_dump --schema-only` (`backend.md` §4.13, `DECISIONS.md` #309); clonar o banco migrado e semeado
para cada worker de teste com `CREATE DATABASE <worker> TEMPLATE <base>` (`tooling.md` §10.6,
`DECISIONS.md` #253); e entender o que o backup do Coolify gera (`pg_dump` em formato custom).

**Como usar:**

```bash
# prova do achatamento (backend.md §4.13): mesma chave de \restrict nos dois dumps
pg_dump --schema-only --restrict-key=prova -d app_antes  > antes.sql
pg_dump --schema-only --restrict-key=prova -d app_depois > depois.sql
diff antes.sql depois.sql
```

```sql
-- clone por worker (tooling.md §10.6): nenhuma sessão aberta no banco base durante a cópia
CREATE DATABASE app_test_w1 TEMPLATE app_test_base;
```

**Links:** 12.

**Skills:** `maiyu-backend`, `migration`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com PostgreSQL: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Dump e comparação de schema

- **Para comparar dois dumps em texto, passe a mesma `--restrict-key` nos dois.** Sem ela, o `pg_dump` gera uma chave aleatória para o `\restrict` a cada execução; a opção existe para saída repetível, como comparar arquivos de dump. [`#app-pgdump`](https://www.postgresql.org/docs/current/app-pgdump.html)
- **Nunca use `--restrict-key` fixa em dump de produção que outro vai restaurar.** A página diz que ela não é para uso geral: um servidor malicioso que conhece a chave pode injetar código executado no `psql` de quem restaura. [`#app-pgdump`](https://www.postgresql.org/docs/current/app-pgdump.html)
- **`--schema-only` é o dump de definições; não confunda com `--schema`.** Ele tira dados e estatísticas; `--schema` filtra por schema do banco, outro sentido da palavra. [`#app-pgdump`](https://www.postgresql.org/docs/current/app-pgdump.html)
- **Rode o `pg_dump` com major igual ou maior que a do servidor.** Ele recusa servidor de major mais nova, e o dump não tem garantia de carregar em servidor de major mais antiga. [`#app-pgdump`](https://www.postgresql.org/docs/current/app-pgdump.html)
- **Papéis e tablespaces saem só do `pg_dumpall`.** O `pg_dump` cobre um banco; o que é do cluster inteiro fica de fora dele. [`#app-pg-dumpall`](https://www.postgresql.org/docs/current/app-pg-dumpall.html)

### Restauração

- **Restaure dump em banco criado de `template0`.** Os dumps são relativos a `template0`; um `template1` com objetos locais faz a restauração conflitar. [`#backup-dump`](https://www.postgresql.org/docs/current/backup-dump.html)
- **Script de dump roda com `psql -X --set ON_ERROR_STOP=on` (e `-1` quando tudo ou nada importa).** Sem isso o `psql` segue depois do erro e deixa o banco restaurado pela metade. [`#backup-dump`](https://www.postgresql.org/docs/current/backup-dump.html)
- **Depois de restaurar, `ANALYZE` em cada banco.** O otimizador precisa das estatísticas que a restauração não refez. [`#backup-dump`](https://www.postgresql.org/docs/current/backup-dump.html)
- **`--single-transaction` do `pg_restore` não combina com `--jobs`, e em banco grande prefira `--transaction-size`.** Uma transação só trava cada objeto restaurado e pode esgotar a tabela de locks. [`#app-pgrestore`](https://www.postgresql.org/docs/current/app-pgrestore.html)

### Banco por clone (template)

- **Feche toda conexão com o banco base antes de `CREATE DATABASE ... TEMPLATE`.** O comando falha se houver outra sessão no template quando começa, e bloqueia conexões novas a ele até terminar. [`#sql-createdatabase`](https://www.postgresql.org/docs/current/sql-createdatabase.html)
- **`CREATE DATABASE` fora de transação.** A página proíbe executá-lo dentro de um bloco de transação. [`#sql-createdatabase`](https://www.postgresql.org/docs/current/sql-createdatabase.html)
- **Configuração de banco (`ALTER DATABASE ... SET`) e `GRANT` de banco se reaplicam no clone.** Nenhum dos dois é copiado do template. [`#sql-createdatabase`](https://www.postgresql.org/docs/current/sql-createdatabase.html)
- **Template pequeno usa a estratégia padrão `WAL_LOG`; `FILE_COPY` só para template grande.** `FILE_COPY` força checkpoint antes e depois da criação. [`#sql-createdatabase`](https://www.postgresql.org/docs/current/sql-createdatabase.html)
- **Marque o banco base com `datistemplate` quando quem clona não é superusuário nem dono.** Com a flag, qualquer papel com `CREATEDB` clona; sem ela, só superusuário e dono. [`#manage-ag-templatedbs`](https://www.postgresql.org/docs/current/manage-ag-templatedbs.html)

---

## Ferramentas de cliente

#### app-pgdump
[doc](https://www.postgresql.org/docs/current/app-pgdump.html)

**O que é:** a referência do `pg_dump`: formatos (texto, custom, directory, tar), seleção de objeto,
`--schema-only`, `--restrict-key` e compatibilidade entre versões.
**Para que serve:** gerar o dump de schema que prova o achatamento de migrations e o dump de um banco
para cópia ou backup.
**Quando usar:** antes de escrever o comando de comparação de schema ou de backup manual.

#### app-pgrestore
[doc](https://www.postgresql.org/docs/current/app-pgrestore.html)

**O que é:** a referência do `pg_restore`, que lê os formatos custom, directory e tar: `--clean`,
`--if-exists`, `--single-transaction`, `--transaction-size`, `--jobs`.
**Para que serve:** restaurar o backup em formato custom que o Coolify gera para um banco só.
**Quando usar:** ao restaurar backup em banco descartável para provar que ele se recupera.

#### app-pg-dumpall
[doc](https://www.postgresql.org/docs/current/app-pg-dumpall.html)

**O que é:** o dump do cluster inteiro em script, com papéis, tablespaces e todos os bancos.
**Para que serve:** levar papéis e permissões de cluster, que o `pg_dump` não leva; é o que o backup
"All databases" do Coolify usa.
**Quando usar:** ao migrar o cluster de servidor ou restaurar o backup de todos os bancos.

#### app-psql
[doc](https://www.postgresql.org/docs/current/app-psql.html)

**O que é:** a referência do `psql`: opções de linha de comando (`-X`, `-1`, `--set`), variáveis
como `ON_ERROR_STOP` e os meta-comandos, entre eles `\restrict` e `\unrestrict`.
**Para que serve:** executar dump em texto e scripts SQL parando no primeiro erro.
**Quando usar:** ao restaurar dump em texto ou rodar SQL à mão num ambiente.

## Backup

#### backup-dump
[doc](https://www.postgresql.org/docs/current/backup-dump.html)

**O que é:** o capítulo "SQL Dump": restaurar com `psql`, criar o destino de `template0`, parar no
erro, restaurar em uma transação, `pg_dumpall` e banco grande.
**Para que serve:** o roteiro de dump e restauração que as páginas de referência pressupõem.
**Quando usar:** antes de planejar backup, restauração ou cópia de banco entre servidores.

## Bancos

#### sql-createdatabase
[doc](https://www.postgresql.org/docs/current/sql-createdatabase.html)

**O que é:** a referência de `CREATE DATABASE`: `TEMPLATE`, `STRATEGY` (`WAL_LOG` ou `FILE_COPY`),
encoding e locale, e as notas sobre conexões no template e o que não é copiado.
**Para que serve:** clonar o banco de teste migrado e semeado, um por worker.
**Quando usar:** ao escrever o `globalSetup` que cria os bancos dos workers.

#### manage-ag-templatedbs
[doc](https://www.postgresql.org/docs/current/manage-ag-templatedbs.html)

**O que é:** como `template0` e `template1` funcionam, quando usar cada um, e as flags
`datistemplate` e `datallowconn`.
**Para que serve:** entender por que o clone exige o template sem sessões e quem pode clonar.
**Quando usar:** ao montar o banco base dos testes ou criar banco para restaurar dump.

## Desempenho de consulta

#### using-explain
[doc](https://www.postgresql.org/docs/current/using-explain.html)

**O que é:** como ler o plano do `EXPLAIN` e do `EXPLAIN (ANALYZE, BUFFERS)`: custo estimado, linhas,
tempo real e leitura de bloco por nó.
**Para que serve:** a medida com volume que a #382 pede no PR que mexe em listagem.
**Quando usar:** antes e depois de criar índice ou reescrever filtro de listagem.

#### indexes-multicolumn
[doc](https://www.postgresql.org/docs/current/indexes-multicolumn.html)

**O que é:** índice de várias colunas e quando a coluna da esquerda serve sozinha.
**Para que serve:** saber se um composto que começa pela coluna de `sort` já a atende.
**Quando usar:** ao decidir se uma coluna de ordenação precisa de índice próprio.

#### indexes-ordering
[doc](https://www.postgresql.org/docs/current/indexes-ordering.html)

**O que é:** índice que entrega a ordem do `ORDER BY` sem `Sort`, em `ASC` e `DESC`.
**Para que serve:** listagem paginada por coluna escolhida pelo usuário.
**Quando usar:** ao indexar coluna de `sort`.

#### indexes-partial
[doc](https://www.postgresql.org/docs/current/indexes-partial.html)

**O que é:** índice com `WHERE`; o planejador só o usa quando o predicado da consulta implica o do
índice, e predicado com parâmetro não casa.
**Para que serve:** `deleted_at is null` dos ativos e `deleted_at is not null` da lixeira.
**Quando usar:** em tabela com soft delete; o predicado vai literal na consulta.

#### jit-decision
[doc](https://www.postgresql.org/docs/current/jit-decision.html)

**O que é:** quando o JIT liga: custo estimado acima de `jit_above_cost` (100000 por padrão).
**Para que serve:** explicar consulta de listagem lenta por compilação JIT, como filtro "pertence a"
escrito com `OR EXISTS`.
**Quando usar:** quando o `EXPLAIN ANALYZE` mostra tempo de JIT relevante.
