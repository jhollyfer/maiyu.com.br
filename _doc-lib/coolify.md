# Coolify

Plataforma de deploy auto-hospedada onde cada app da casa é construído do Git e publicado.

Última verificação: 2026-11-08 (fonte: fonte da doc em `coollabsio/coolify-docs@8eb3c96` (main, 2026-11-03), `content/docs/`; `https://coolify.io/docs/llms.txt` recusado pelo proxy desta sessão)

> Conferido contra `coollabsio/coolify@v4.6.0` (latest). Não há pacote npm: a versão vem das tags do repositório oficial.

**O que é:** um painel que liga servidores próprios a repositórios Git e cuida de build, troca de
container, proxy (Traefik), domínio, variáveis, healthcheck, bancos gerenciados e backup. Cada app
é um recurso *Application*; banco e Redis são recursos *Database* na mesma rede interna.

**Para que serve:** o deploy da casa sem passo no repositório (`tooling.md` §8.3, `DECISIONS.md`
#290 e #298): o Coolify puxa a `main` pelo GitHub App com *Auto Deploy*, constrói o
`Dockerfile-production`, espera o `/health-check` (`architecture.md` §7), roda a migration no
*Post-deployment command* (`DECISIONS.md` #252) e só então tira o container antigo.

**Como usar:**

```text
Application (API)
  Source            GitHub App, branch main
  Build Pack        Dockerfile
  Base Directory    /
  Dockerfile        /backend/Dockerfile-production
  Watch Paths       backend/**
                    shared/**
                    pnpm-lock.yaml
  Auto deploy       Deploy on push (webhooks)        (Advanced > Deployment)
  Pre-deployment    (vazio)
  Post-deployment   node ace migration:run --force && node ace db:seed
  Healthcheck       HEALTHCHECK do Dockerfile-production, /health-check
```

**Links:** 35.

**Skills:** `maiyu-backend`, `security-audit`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com Coolify: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Origem e disparo

- **Repositório privado entra por GitHub App, com instalação automática no GitHub.com.** Ela configura permissões, webhook e credenciais de uma vez; deploy key só quando não dá para instalar o app. [`#applications/sources/github/app`](https://coolify.io/docs/applications/sources/github/app)
- **GitHub App de instância self-hosted fica sem *System wide*, salvo quando todo time deve usá-lo.** *System wide* expõe o app a todos os times da instância. [`#applications/sources/github/app`](https://coolify.io/docs/applications/sources/github/app)
- **O deploy automático é *Auto deploy* = *Deploy on push (webhooks)* em *Advanced > Deployment*.** Com GitHub App ele já vem ligado e não precisa de webhook manual. [`#applications/deployments/automatic-deployments`](https://coolify.io/docs/applications/deployments/automatic-deployments)
- **Em *Watch Paths*, um padrão por linha.** Vírgula não separa: `a/**,b/**` vira um padrão só e não casa com nenhum dos dois; o último padrão que casa vence, e `!` nega. [`#applications/deployments/automatic-deployments`](https://coolify.io/docs/applications/deployments/automatic-deployments)
- **Prove os *Watch Paths* com um commit só de documentação antes de confiar neles.** Eles só filtram evento do provedor Git e não seguram deploy manual nem o *Deploy Webhook*. [`#applications/deployments/automatic-deployments`](https://coolify.io/docs/applications/deployments/automatic-deployments)
- **Token que dispara deploy é só de deploy e mora no cofre de segredos, nunca no workflow nem no repositório.** O token de deploy não tem leitura nem escrita geral na API, e o Coolify o mostra uma vez. [`#core/automation/deploy-webhooks`](https://coolify.io/docs/core/automation/deploy-webhooks)

### Build

- ***Base Directory* é o contexto do build e a *Dockerfile Location* se resolve a partir dela.** Os dois começam com `/`, e `COPY`/`ADD` só alcançam o que está dentro da *Base Directory*. [`#applications/configuration/general`](https://coolify.io/docs/applications/configuration/general)
- **Use *Force deploy (without cache)* para reconstruir o mesmo commit.** O Coolify reaproveita a imagem com a tag do commit quando ela existe e a configuração de build não mudou. [`#core/build-deployment-model`](https://coolify.io/docs/core/build-deployment-model)
- **Variável que só o app lê depois de subir vai como *Not available during build*.** Variável nova nasce disponível no build e no container. [`#applications/configuration/environment-variables`](https://coolify.io/docs/applications/configuration/environment-variables)
- **Valor sensível de build vai por *Docker BuildKit secrets*.** Build arg comum pode aparecer nos metadados da imagem. [`#applications/configuration/environment-variables`](https://coolify.io/docs/applications/configuration/environment-variables)
- **Valor com `$` que não pode expandir usa *Literal*; chave privada ou certificado, *Multiline*.** Sem *Literal* o Coolify pode expandir a referência dentro do valor. [`#applications/configuration/environment-variables`](https://coolify.io/docs/applications/configuration/environment-variables)

### Comandos de deploy

- **Migration vai no *Post-deployment command*.** O *Pre-deployment* roda no container que está no ar, antes do build, e é pulado no primeiro deploy; o *Post-deployment* roda no container novo. [`#applications/configuration/general`](https://coolify.io/docs/applications/configuration/general)
- **Falha do *Post-deployment* se confere no log do deploy.** O deploy já está marcado como concluído e continua com sucesso mesmo quando o comando falha. [`#applications/configuration/general`](https://coolify.io/docs/applications/configuration/general)

### Healthcheck e troca de container

- **Em app de Dockerfile, o `HEALTHCHECK` da imagem é o que vale; o do painel só entra sem ele.** O Coolify detecta a instrução da imagem e a usa no lugar do check do painel; para passar ao do painel, remova a instrução e redeploye. [`#applications/configuration/health-checks`](https://coolify.io/docs/applications/configuration/health-checks)
- **Check HTTP do painel exige `curl` ou `wget` na imagem final.** Ele roda dentro do container, e *Expected code* e *Expected response text* não são comparados: vale só o código de saída. [`#applications/configuration/health-checks`](https://coolify.io/docs/applications/configuration/health-checks)
- **O healthcheck falha até o app atender requisição de verdade.** Sem healthcheck, container iniciado conta como pronto e o antigo sai antes da hora. [`#applications/deployments/rolling-updates`](https://coolify.io/docs/applications/deployments/rolling-updates)
- **Para ter rolling update: nenhuma porta publicada no host, nenhum nome de container fixo ou customizado, e app que não é Compose.** Qualquer um desses faz o Coolify parar o container atual antes de subir o novo. [`#applications/deployments/rolling-updates`](https://coolify.io/docs/applications/deployments/rolling-updates)
- **O app trata o sinal de término e sai dentro do *Stop Grace Period* (30 s por padrão).** Aumentar o prazo não dá desligamento gracioso a quem não o implementa. [`#applications/deployments/rolling-updates`](https://coolify.io/docs/applications/deployments/rolling-updates)
- **Migration, API, fila e cache funcionam com as duas versões no ar ao mesmo tempo.** No rolling update a versão velha e a nova rodam juntas por um tempo. [`#applications/deployments/rolling-updates`](https://coolify.io/docs/applications/deployments/rolling-updates)

### Rollback

- **Rollback troca só a imagem: não desfaz migration, não restaura volume, e usa as variáveis atuais.** Só é seguro com schema compatível com a imagem antiga. [`#applications/deployments/rollbacks`](https://coolify.io/docs/applications/deployments/rollbacks)
- **Defina *Images to keep* em *Image retention*.** Sem registry, imagem apagada pela limpeza deixa de ser alvo de rollback. [`#applications/deployments/rollbacks`](https://coolify.io/docs/applications/deployments/rollbacks)

### Dados e operação

- **Arquivo que precisa sobreviver ao deploy fica em mount persistente, gravável pelo usuário do container.** O container é substituível, e o que ele grava no próprio sistema de arquivos some no redeploy. [`#applications/configuration/persistent-storage`](https://coolify.io/docs/applications/configuration/persistent-storage)
- **Tarefa agendada é o comando como roda dentro do container, sem `docker exec`, no fuso do servidor.** O Coolify roda o comando por `sh` no container em execução; o timeout padrão é 300 s. [`#applications/operations/scheduled-tasks`](https://coolify.io/docs/applications/operations/scheduled-tasks)
- **Preview de PR nunca recebe credencial de produção e fica em *Repository members only*.** O código do PR roda no servidor de deploy. [`#applications/deployments/preview-deployments`](https://coolify.io/docs/applications/deployments/preview-deployments)

### Bancos e backup

- **App fala com banco e Redis pela URL interna, na mesma rede de destino; porta pública só para cliente externo, com firewall.** Banco novo nasce sem endpoint público. [`#databases`](https://coolify.io/docs/databases)
- **Ao ligar SSL no banco, copie a URL nova para o app.** O app só usa SSL quando a configuração de conexão dele pede. [`#databases/ssl`](https://coolify.io/docs/databases/ssl)
- **Backup só vale depois de restaurado num banco descartável.** Backup com sucesso prova só que o arquivo foi criado. [`#databases/backups`](https://coolify.io/docs/databases/backups)
- **Antes de importar, pare a escrita do app e faça backup do destino.** A importação pode sobrescrever dado e credencial. [`#databases/restore`](https://coolify.io/docs/databases/restore)
- **O bucket do S3 existe antes de cadastrar e validar o storage.** A validação lista o bucket e falha sem ele. [`#core/s3-storage/overview`](https://coolify.io/docs/core/s3-storage/overview)
- **Guarde o `APP_KEY` da instância fora do servidor.** Ele cifra os segredos salvos, e o backup da instância não o inclui. [`#core/backup-and-recovery/instance-backup`](https://coolify.io/docs/core/backup-and-recovery/instance-backup)

---

## Começar

#### deploy-your-first-app
[doc](https://coolify.io/docs/deploy-your-first-app) | [markdown](https://coolify.io/docs/deploy-your-first-app.md)

**O que é:** o tutorial de primeiro deploy: projeto, recurso *Docker Image* com `nginx:alpine`, porta
`80` e URL gerada.
**Para que serve:** conhecer o fluxo do painel (projeto, ambiente, recurso, deploy, log) antes de
configurar um app de verdade.
**Quando usar:** na primeira instância ou servidor novo.

#### core/build-deployment-model
[doc](https://coolify.io/docs/core/build-deployment-model) | [markdown](https://coolify.io/docs/core/build-deployment-model.md)

**O que é:** como o Coolify constrói ou puxa a imagem e troca o container: gatilhos, reaproveitamento
de imagem pela tag do commit, servidor de build e servidor só de deploy.
**Para que serve:** saber quando o deploy reconstrói e quando reaproveita a imagem.
**Quando usar:** ao estranhar um deploy que não refletiu a mudança, ou ao separar servidor de build.

## Aplicações

#### applications
[doc](https://coolify.io/docs/applications) | [markdown](https://coolify.io/docs/applications.md)

**O que é:** a visão geral de *Application*: entender, implantar, configurar e operar.
**Para que serve:** mapa das páginas de aplicação.
**Quando usar:** ao criar o primeiro recurso de app.

#### applications/choose-deployment-method
[doc](https://coolify.io/docs/applications/choose-deployment-method) | [markdown](https://coolify.io/docs/applications/choose-deployment-method.md)

**O que é:** a escolha entre repositório Git, Dockerfile sem Git, Docker Compose do Git e imagem
existente.
**Para que serve:** confirmar que o app da casa é repositório Git com *Build Pack* Dockerfile.
**Quando usar:** ao criar o recurso.

### Origem do código

#### applications/sources/github/overview
[doc](https://coolify.io/docs/applications/sources/github/overview) | [markdown](https://coolify.io/docs/applications/sources/github/overview.md)

**O que é:** as formas de ligar um repositório do GitHub: público, GitHub App, deploy key.
**Para que serve:** escolher a origem do repositório privado.
**Quando usar:** antes de criar o recurso de um projeto novo.

#### applications/sources/github/app
[doc](https://coolify.io/docs/applications/sources/github/app) | [markdown](https://coolify.io/docs/applications/sources/github/app.md)

**O que é:** a criação do GitHub App (instalação automática pelo manifest ou manual), permissões,
*System wide* e escolha de repositórios.
**Para que serve:** dar ao Coolify acesso só aos repositórios escolhidos, com webhook de push e PR.
**Quando usar:** ao ligar a instância ao GitHub, uma vez por organização.

#### applications/sources/github/auto-deploy
[doc](https://coolify.io/docs/applications/sources/github/auto-deploy) | [markdown](https://coolify.io/docs/applications/sources/github/auto-deploy.md)

**O que é:** deploy automático do GitHub por GitHub App, GitHub Actions ou webhook do repositório, com
o segredo do webhook.
**Para que serve:** confirmar que o push na `main` dispara o build.
**Quando usar:** ao ligar o *Auto Deploy* ou quando o push não gerou deploy.

#### applications/sources/github/actions
[doc](https://coolify.io/docs/applications/sources/github/actions) | [markdown](https://coolify.io/docs/applications/sources/github/actions.md)

**O que é:** construir e publicar a imagem no GitHub Actions e então disparar o Coolify, com recurso
de imagem e token de API.
**Para que serve:** referência do modelo que a casa abandonou (`DECISIONS.md` #298): o Coolify
constrói do Git e o repositório não tem workflow.
**Quando usar:** ao migrar projeto que ainda publica imagem por workflow.

### Build

#### applications/builds/overview
[doc](https://coolify.io/docs/applications/builds/overview) | [markdown](https://coolify.io/docs/applications/builds/overview.md)

**O que é:** comparação dos métodos de build, onde o build roda, cache e push para registry.
**Para que serve:** entender o que muda entre Nixpacks, Railpack, Static, Dockerfile e Compose.
**Quando usar:** ao escolher o *Build Pack* ou investigar cache de build.

#### applications/builds/dockerfile
[doc](https://coolify.io/docs/applications/builds/dockerfile) | [markdown](https://coolify.io/docs/applications/builds/dockerfile.md)

**O que é:** build a partir do Dockerfile do repositório: *Base Directory*, *Dockerfile Location*,
porta, variáveis de build e comandos de pré e pós-deploy.
**Para que serve:** configurar o `Dockerfile-production` da API e do frontend.
**Quando usar:** ao criar ou revisar o recurso de cada app.

#### applications/builds/docker-compose
[doc](https://coolify.io/docs/applications/builds/docker-compose) | [markdown](https://coolify.io/docs/applications/builds/docker-compose.md)

**O que é:** deploy de um Docker Compose do Git ou guardado no Coolify.
**Para que serve:** saber o que se perde com Compose (rolling update, página de healthcheck do painel).
**Quando usar:** só se um projeto pedir vários serviços num recurso; a casa usa um recurso por app.

### Configuração

#### applications/configuration/overview
[doc](https://coolify.io/docs/applications/configuration/overview) | [markdown](https://coolify.io/docs/applications/configuration/overview.md)

**O que é:** o mapa das abas de configuração de uma aplicação já criada.
**Para que serve:** achar onde mora cada campo do quadro de `tooling.md` §8.3.
**Quando usar:** ao configurar ou trocar o recurso.

#### applications/configuration/general
[doc](https://coolify.io/docs/applications/configuration/general) | [markdown](https://coolify.io/docs/applications/configuration/general.md)

**O que é:** a aba *General*: identidade, método de build, *Base Directory*, *Dockerfile Location*,
*Watch Paths*, domínios, portas e os comandos *Pre-deployment* e *Post-deployment*.
**Para que serve:** o contrato de onde roda cada comando de deploy e de como o contexto do build se
resolve.
**Quando usar:** ao preencher o quadro de `tooling.md` §8.3, principalmente a migration.

#### applications/configuration/environment-variables
[doc](https://coolify.io/docs/applications/configuration/environment-variables) | [markdown](https://coolify.io/docs/applications/configuration/environment-variables.md)

**O que é:** variáveis de build e de runtime, *Developer view*, valores de preview, *Literal*,
*Multiline*, BuildKit secrets e redação de log.
**Para que serve:** pôr as variáveis de runtime no recurso, com o escopo certo.
**Quando usar:** ao cadastrar ou copiar variáveis de um recurso para outro.

#### applications/configuration/health-checks
[doc](https://coolify.io/docs/applications/configuration/health-checks) | [markdown](https://coolify.io/docs/applications/configuration/health-checks.md)

**O que é:** healthcheck HTTP ou por comando no painel, no Dockerfile ou no Compose, e qual deles vale.
**Para que serve:** garantir que o Coolify espere o `/health-check` antes de tirar o container antigo.
**Quando usar:** ao configurar o recurso e ao ver `404` ou `No available server` no domínio.

#### applications/configuration/persistent-storage
[doc](https://coolify.io/docs/applications/configuration/persistent-storage) | [markdown](https://coolify.io/docs/applications/configuration/persistent-storage.md)

**O que é:** mounts de volume, diretório e arquivo para dados fora do container.
**Para que serve:** guardar o disco local de arquivos entre deploys.
**Quando usar:** em app com storage local gravável (`tooling.md` §8.2, `ENTRYPOINT` com `su-exec`).

#### applications/configuration/resource-limits
[doc](https://coolify.io/docs/applications/configuration/resource-limits) | [markdown](https://coolify.io/docs/applications/configuration/resource-limits.md)

**O que é:** limite de CPU e memória do container (`0` é sem limite).
**Para que serve:** impedir que um app derrube os vizinhos no mesmo servidor.
**Quando usar:** depois de medir o uso real do app.

### Deploys

#### applications/deployments/overview
[doc](https://coolify.io/docs/applications/deployments/overview) | [markdown](https://coolify.io/docs/applications/deployments/overview.md)

**O que é:** gatilhos, histórico, logs e ações do ciclo de vida de um deploy.
**Para que serve:** acompanhar o deploy até `finished`, como `tooling.md` §8.3 exige.
**Quando usar:** depois de todo merge na `main`.

#### applications/deployments/automatic-deployments
[doc](https://coolify.io/docs/applications/deployments/automatic-deployments) | [markdown](https://coolify.io/docs/applications/deployments/automatic-deployments.md)

**O que é:** deploy automático por integração Git, webhook do repositório ou CI externo, *Watch Paths*
e como desligar o deploy por push.
**Para que serve:** ligar o *Auto Deploy* e limitar o deploy aos caminhos de cada app no monorepo.
**Quando usar:** ao configurar o recurso e ao mexer nos *Watch Paths*.

#### applications/deployments/preview-deployments
[doc](https://coolify.io/docs/applications/deployments/preview-deployments) | [markdown](https://coolify.io/docs/applications/deployments/preview-deployments.md)

**O que é:** deploy separado por PR, com acesso, variáveis e domínios próprios.
**Para que serve:** ambiente por PR, se um projeto o adotar; a casa não usa hoje.
**Quando usar:** só com decisão registrada; código de PR é código não confiável no servidor.

#### applications/deployments/rolling-updates
[doc](https://coolify.io/docs/applications/deployments/rolling-updates) | [markdown](https://coolify.io/docs/applications/deployments/rolling-updates.md)

**O que é:** como o Coolify sobrepõe o container velho e o novo, o que o app precisa fazer e as
configurações que desligam o rolling update.
**Para que serve:** deploy sem queda: healthcheck de prontidão, desligamento gracioso, versões
compatíveis.
**Quando usar:** ao escrever o shutdown do app e ao planejar migration em expandir e contrair.

#### applications/deployments/rollbacks
[doc](https://coolify.io/docs/applications/deployments/rollbacks) | [markdown](https://coolify.io/docs/applications/deployments/rollbacks.md)

**O que é:** voltar a uma imagem anterior ainda guardada no servidor, e a retenção de imagens.
**Para que serve:** o passo de rollback que todo PR com migration registra (`tooling.md` §8.3).
**Quando usar:** ao planejar o rollback de uma entrega e quando o deploy novo se provou ruim.

### Operação

#### applications/operations/scheduled-tasks
[doc](https://coolify.io/docs/applications/operations/scheduled-tasks) | [markdown](https://coolify.io/docs/applications/operations/scheduled-tasks.md)

**O que é:** comando recorrente dentro do container da aplicação, com agenda, container, timeout e
histórico.
**Para que serve:** o cron do orquestrador para comando da aplicação (como `payments:expire`), no
lugar de `setInterval` no processo web.
**Quando usar:** ao agendar um comando `ace` ou script recorrente.

## Automação e time

#### core/automation/deploy-webhooks
[doc](https://coolify.io/docs/core/automation/deploy-webhooks) | [markdown](https://coolify.io/docs/core/automation/deploy-webhooks.md)

**O que é:** disparo de deploy de recurso ou tag por URL autenticada, com token só de deploy.
**Para que serve:** disparar deploy de fora, quando inevitável; a casa usa só o *Auto Deploy*.
**Quando usar:** ao precisar de deploy fora do push (ferramenta externa, redeploy em lote).

#### core/team/shared-variables
[doc](https://coolify.io/docs/core/team/shared-variables) | [markdown](https://coolify.io/docs/core/team/shared-variables.md)

**O que é:** variáveis de time, projeto, ambiente e servidor referenciadas como `{{team.NOME}}`.
**Para que serve:** um valor só para vários recursos (o worker e a API com o mesmo `DATABASE_URL`).
**Quando usar:** quando dois recursos repetem a mesma variável.

## Bancos

#### databases
[doc](https://coolify.io/docs/databases) | [markdown](https://coolify.io/docs/databases.md)

**O que é:** a visão geral dos bancos gerenciados: motores, rede interna, porta pública, proxy TCP,
firewall e o que fica com o dono do servidor.
**Para que serve:** a regra de banco sem porta pública (`tooling.md` §8.3).
**Quando usar:** ao criar banco ou Redis e ao revisar porta exposta.

#### databases/postgresql
[doc](https://coolify.io/docs/databases/postgresql) | [markdown](https://coolify.io/docs/databases/postgresql.md)

**O que é:** o recurso PostgreSQL: imagens (18, 17, 16 e de extensão), credenciais, URL interna e
pública, scripts de init e configuração.
**Para que serve:** subir o Postgres da API e copiar o `DATABASE_URL` interno.
**Quando usar:** ao criar o banco de produção ou de homologação.

#### databases/redis
[doc](https://coolify.io/docs/databases/redis) | [markdown](https://coolify.io/docs/databases/redis.md)

**O que é:** o recurso Redis: senha gerada, volume em `/data`, TLS, URL interna e pública.
**Para que serve:** o `REDIS_URL` interno com senha que a fila usa.
**Quando usar:** ao ligar fila ou cache num projeto.

#### databases/backups
[doc](https://coolify.io/docs/databases/backups) | [markdown](https://coolify.io/docs/databases/backups.md)

**O que é:** backup agendado por motor (no Postgres, `pg_dump` em formato custom ou `pg_dumpall`
gzip), retenção local e envio para S3.
**Para que serve:** o backup do banco de produção.
**Quando usar:** ao subir o banco de produção, e revisado a cada troca de storage.

#### databases/restore
[doc](https://coolify.io/docs/databases/restore) | [markdown](https://coolify.io/docs/databases/restore.md)

**O que é:** restauração por upload, arquivo no servidor ou S3, com detecção de formato e opção de
substituir objetos.
**Para que serve:** provar o backup num banco descartável e recuperar dado.
**Quando usar:** no teste de restauração e num incidente.

#### databases/ssl
[doc](https://coolify.io/docs/databases/ssl) | [markdown](https://coolify.io/docs/databases/ssl.md)

**O que é:** SSL nos bancos gerenciados, modo de verificação e o certificado da CA do Coolify.
**Para que serve:** cifrar a conexão quando o banco sai da rede interna.
**Quando usar:** antes de expor um banco a cliente externo.

## Storage S3

#### core/s3-storage/overview
[doc](https://coolify.io/docs/core/s3-storage/overview) | [markdown](https://coolify.io/docs/core/s3-storage/overview.md)

**O que é:** o cadastro de storage S3 compatível para os backups (Amazon S3, R2 e outros), com
validação por listagem do bucket.
**Para que serve:** o destino remoto dos backups de banco e da instância.
**Quando usar:** antes de ligar o envio de backup para S3.

#### core/s3-storage/r2
[doc](https://coolify.io/docs/core/s3-storage/r2) | [markdown](https://coolify.io/docs/core/s3-storage/r2.md)

**O que é:** o passo a passo do Cloudflare R2: bucket, token de API, chave de acesso e endpoint.
**Para que serve:** usar o R2, o mesmo storage dos arquivos do app, como destino de backup.
**Quando usar:** ao cadastrar o R2 no Coolify.

## Backup e recuperação da instância

#### core/backup-and-recovery/instance-backup
[doc](https://coolify.io/docs/core/backup-and-recovery/instance-backup) | [markdown](https://coolify.io/docs/core/backup-and-recovery/instance-backup.md)

**O que é:** backup do próprio Coolify (banco da instância) e a guarda do `APP_KEY`.
**Para que serve:** não perder recursos, variáveis e segredos se o servidor do Coolify cair.
**Quando usar:** ao instalar a instância, e revisado a cada atualização.

#### core/backup-and-recovery/instance-restore
[doc](https://coolify.io/docs/core/backup-and-recovery/instance-restore) | [markdown](https://coolify.io/docs/core/backup-and-recovery/instance-restore.md)

**O que é:** restaurar a instância na mesma máquina ou numa substituta.
**Para que serve:** o roteiro de recuperação da plataforma de deploy.
**Quando usar:** num incidente do servidor do Coolify ou na troca de máquina.
