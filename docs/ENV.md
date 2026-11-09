# Configuração de ambiente

**Maiyu** · variáveis que o app precisa para rodar, local e em produção

> Exemplo e documentação usam placeholder; segredo real fica fora do Git.
> Variável nova entra aqui **e** em `.env.example` no mesmo commit. Quem valida é o schema do
> leitor de ENV (`_standards/backend.md` §6, `backend-fastify.md` §7); este arquivo explica.

O `backend/` (API AdonisJS, `ARCHITECTURE.md` §1) lê as chaves do `backend/.env.example`, validadas no
boot por `backend/start/env.ts`; a seção 1.1 diz cada uma. O frontend ainda não lê **nenhuma** variável
de ambiente em tempo de execução (`import.meta.env.DEV` é o único acesso, e é flag do Vite). O
`frontend/.env.example` é o modelo fechado da casa e traz chaves que o site ainda não usa
(`DECISIONS.md` #9); a seção 1.2 diz, chave a chave, o que vale aqui.

## 1. Variáveis

### 1.1 Backend

Mesma ordem de blocos do `backend/.env.example` (`_standards/backend.md` §6.2). Sem e-mail, fila nem
JWT: os blocos opcionais `mail`, `queue` e `jwt` do modelo ficam de fora, inteiros.

| Variável | App | Obrigatória | Segredo | O que é | Exemplo |
|---|---|---|---|---|---|
| `NODE_ENV` | api | sim | não | `development`, `production` ou `test` | `development` |
| `PORT` | api | sim | não | porta HTTP | `3333` |
| `HOST` | api | sim | não | interface de escuta; `0.0.0.0` em container | `localhost` |
| `TZ` | api | não | não | fuso do processo, `UTC` em todo ambiente | `UTC` |
| `LOG_LEVEL` | api | sim | não | nível do logger | `info` |
| `APP_KEY` | api | sim | **sim** | chave de cifra, gerada por `node ace generate:key` | `<segredo>` |
| `APP_SERVER_URL` | api | sim | não | endereço público da API | `http://localhost:3333` |
| `APP_CLIENT_URL` | api | só com app e API em sites diferentes | não | origem pública do site; decide o `sameSite` do cookie | `https://maiyu.com.br` |
| `TRUSTED_PROXIES` | api | em produção atrás de proxy | não | proxies de que `X-Forwarded-For` vale; ausente vale `loopback`; nunca `true` | `uniquelocal` |
| `COOKIE_DOMAIN` | api | em produção com hosts irmãos | não | domínio dos cookies de sessão | `.maiyu.com.br` |
| `CORS_ORIGINS` | api | sim fora de dev | não | origens do navegador que podem escrever, separadas por vírgula | `http://localhost:3000` |
| `DATABASE_URL` | api | sim | **sim** | conexão com o Postgres, só no servidor | `postgres://maiyu:<senha>@localhost:5440/maiyu` |
| `DATABASE_SSL` | api | não | não | TLS na conexão; ausente é desligado | `false` |
| `UPLOAD_MAX_SIZE` | api | sim | não | teto por arquivo, em bytes | `1073741824` |
| `MINIO_ROOT_USER` | compose | só em dev | não | root do MinIO local, usado pelo setup | `minio-root` |
| `MINIO_ROOT_PASSWORD` | compose | só em dev | **sim** | senha do root do MinIO local | `<segredo>` |
| `STORAGE_KEY` | api | sim | não | usuário do bucket, escopo mínimo | `maiyu` |
| `STORAGE_SECRET` | api | sim | **sim** | segredo do usuário do bucket | `<segredo>` |
| `STORAGE_BUCKET` | api | sim | não | bucket privado dos anexos | `maiyu` |
| `STORAGE_ENDPOINT` | api | sim | não | endereço S3 (MinIO em dev e teste, S3 ou R2 em produção) | `http://localhost:9016` |
| `STORAGE_FORCE_PATH_STYLE` | api | só com MinIO | não | endereço `endpoint/bucket/key`; sai em produção | `true` |
| `SEED_OWNER_EMAIL` | api | não | não | e-mail do dono criado pelo seeder | `administrator@maiyu.com.br` |
| `SEED_OWNER_PASSWORD` | api | não | **sim** | senha do dono; vazia pula o seeder | `<segredo>` |
| `SEED_DEMO_PASSWORD` | api | não | **sim** | senha das contas de demonstração; o projeto não tem demonstração | vazio |
| `DB_PORT`, `STORAGE_PORT`, `STORAGE_CONSOLE_PORT` | compose | só em dev | não | portas do `backend/docker-compose.yml`, nunca lidas pela API | `5440`, `9016`, `9017` |

O `backend/.env.test` (versionado) só tem banco e bucket de teste locais, `CORS_ORIGINS` e o par
`SEED_OWNER_*` que a suíte usa; a guarda de `tests/database-guard.ts` recusa banco sem `_test` no nome
ou fora da máquina.

### 1.2 Frontend

Mesma ordem de blocos do `frontend/.env.example`.

| Variável | App | Obrigatória | Segredo | O que é | Exemplo |
|---|---|---|---|---|---|
| `VITE_API_URL` | web | não | não | endereço da API; o frontend ainda não fala com o backend (RB.5 de `TASKS.md`) | `http://localhost:3333` |
| `SERVER_API_URL` | web | não | não | endereço da API visto pelo SSR; sem uso aqui | `http://api:3333` |
| `VITE_SITE_URL` | web | não | não | origem pública do site; hoje `SITE_URL` é constante em `lib/site.ts` | `http://localhost:3000` |
| `SITE_ENV` | web | não | não | `production` ou outro valor; hoje sem leitor no código | `development` |
| `STORAGE_PUBLIC_URL` | web | não | não | origem do bucket para a CSP; o site não tem bucket | `http://localhost:9002` |
| `VITE_UPLOAD_MAX_SIZE` | web | não | não | teto de upload em bytes; o site não tem upload | `1073741824` |
| `E2E_*` | web | não | `E2E_*_PASSWORD` sim | só para Playwright; o site não tem E2E | ver `.env.example` |

Regras (detalhe em `backend.md` §6):

- Segredo e credencial não têm default.
- `VITE_*` vai para o navegador: nunca segredo.
- Variável que passar a ser lida pelo código sobe de "não" para "sim" em Obrigatória e ganha leitor validado.

## 2. Exemplo

O `backend/.env.example` e o `frontend/.env.example` (versionados, só placeholder) são os modelos da
casa, com os valores de exemplo deste projeto (portas 5440, 9016 e 9017). Para rodar só o site em
desenvolvimento nenhuma variável é necessária; para a API, `backend/.env` copiado do exemplo, com
`APP_KEY`, `MINIO_ROOT_PASSWORD` e `STORAGE_SECRET` preenchidos.

## 3. Segredo fora do Git

O `.gitignore` da raiz ignora `.env` em qualquer pasta, e o do `frontend/` ignora `.env` e `.env.*`, com
exceção do `.env.example`. Do backend se versionam só o `.env.example` e o `.env.test`. As variáveis
de runtime da API de produção se cadastram no recurso do Coolify (`_standards/tooling.md` §8.3). Os segredos do
CI/CD ficam nos secrets do repositório (aba Secrets, não Variables): `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID` e `VITE_SITE_URL` (`DECISIONS.md` #14). `VITE_SITE_URL` em `https://`, sem barra no fim; vazios, o build de publicação reprova
(`ARCHITECTURE.md` §9.1).

## 4. Por ambiente

| Ambiente | De onde vêm os valores | Observação |
|---|---|---|
| Desenvolvimento | `backend/.env` copiado de `backend/.env.example`; o frontend não precisa de `.env` | site na porta 3000, API na 3333, infra local por `docker compose` |
| Teste | `backend/.env.test` versionado; `DATABASE_URL` do processo vence o arquivo | banco `maiyu_test` e bucket `maiyu-test` |
| Preview | Não se aplica: não há ambiente de preview | |
| Produção | painel do Coolify, um recurso por app | API: as de runtime da seção 1.1, nunca no repositório; o site ainda sem variável de aplicação |

## 5. Primeira configuração

- [ ] `pnpm install` na raiz (workspace com `backend`, `frontend` e `shared`)
- [ ] `pnpm --filter ./shared build`
- [ ] `cp backend/.env.example backend/.env`, `node ace generate:key` em `backend/` e as senhas locais
- [ ] `docker compose -f backend/docker-compose.yml up -d` e `node ace migration:run` em `backend/`
- [ ] `cd frontend`
- [ ] `pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/paraglide`
- [ ] `pnpm dev` e abrir http://localhost:3000
- [ ] Reiniciar o `pnpm dev` depois de mudar mensagens em `messages/`
