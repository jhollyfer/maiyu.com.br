# Configuração de ambiente

**Maiyu** · variáveis que o app precisa para rodar, local e em produção

> Exemplo e documentação usam placeholder; segredo real fica fora do Git.
> Variável nova entra aqui **e** em `.env.example` no mesmo commit. Quem valida é o schema do
> leitor de ENV (`_standards/backend.md` §6, `backend-fastify.md` §7); este arquivo explica.

O `backend/` (API AdonisJS, `ARCHITECTURE.md` §1) lê as chaves do `backend/.env.example`, validadas no
boot por `backend/start/env.ts`; a seção 1.1 diz cada uma. O frontend lê `VITE_API_URL`, `VITE_SITE_URL`
e `VITE_UPLOAD_MAX_SIZE` no build (`src/env.ts`) e `SITE_ENV`, `SERVER_API_URL`, `STORAGE_PUBLIC_URL` e
`SECURITY_CONTACT` por requisição no servidor (`src/lib/server-env.ts`, `src/server.ts`). O
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
| `DRIVE_DISK` | api | sim | não | disco dos anexos: `s3` (o bucket abaixo, MinIO em dev e teste) ou `fs` (`tmp/uploads`, sem multipart nem URL assinada, então sem fluxo de upload); sem default | `s3` |
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

Mesma ordem de blocos do `frontend/.env.example`. O `frontend/.env.test` (versionado) leva `VITE_API_URL` e `VITE_SITE_URL` fixos para o Vitest.

| Variável | App | Obrigatória | Segredo | O que é | Exemplo |
|---|---|---|---|---|---|
| `VITE_API_URL` | web | sim, no build | não | raiz da API que o `request()` do kit chama; o `build-env.ts` do kit recusa o build sem ela. Em produção é `https://api.maiyu.com.br` (decisão do dono, 2026-11-11), em `frontend/.env.production`; o site ainda não chama a API | `http://localhost:3333` |
| `SERVER_API_URL` | web | não | não | endereço da API visto pelo SSR; sem uso aqui | `http://api:3333` |
| `VITE_SITE_URL` | web | sim, no build | não | origem pública do site, sem barra no fim: canônico, hreflang, sitemap, `robots.txt` e JSON-LD; `SITE_URL` de `lib/site.ts` lê dela. Produção em `frontend/.env.production` (`https://maiyu.com.br`) | `http://localhost:3000` |
| `SITE_ENV` | web | sim em produção | não | onde o site roda, lida pelo `server.ts` a cada requisição; só `production` deixa indexar, ausente ou outro valor responde `X-Robots-Tag: noindex, nofollow` e `Disallow: /` | `development` |
| `SECURITY_CONTACT` | web | não | não | contato de segurança de `/.well-known/security.txt` (`mailto:` ou `https:`); ausente, a rota responde 404. O contato do site é `contato@maiyu.com.br` (`DECISIONS.md` #17) | `mailto:security@example.com` |
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

O `.gitignore` da raiz ignora `.env` e `.env.*` em qualquer pasta, com quatro exceções:
os modelos `.env.example` e `.env.e2e.example` (só placeholder), o `.env.test` (valor fixo de teste)
e o `frontend/.env.production` (só valor público de `VITE_*`, `_standards/tooling.md` §8.2). O `.gitleaks.toml` da raiz é o da régua, para a varredura de segredo
antes do PR (`_standards/tooling.md` §7). Do backend se versionam só o `.env.example` e o
`.env.test`; as variáveis de runtime da API de produção se cadastram no recurso do Coolify
(`_standards/tooling.md` §8.3). O `backend/.adonisjs/server/routes.json` também fica fora: é o arquivo
de passagem que o Adonis grava a cada boot fora de produção para o dev server ler e apagar; o resto
de `backend/.adonisjs/` é versionado. Os segredos do
CI/CD ficam nos secrets do repositório (aba Secrets, não Variables): `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID` e `VITE_SITE_URL` (`DECISIONS.md` #14). `VITE_SITE_URL` em `https://`, sem barra no fim; vazios, o build de publicação reprova
(`ARCHITECTURE.md` §9.1).

## 4. Por ambiente

| Ambiente | De onde vêm os valores | Observação |
|---|---|---|
| Desenvolvimento | `backend/.env` copiado de `backend/.env.example`; o frontend não precisa de `.env` | site na porta 3000, API na 3333, infra local por `docker compose` |
| Teste | `backend/.env.test` versionado; `DATABASE_URL` do processo vence o arquivo | banco `maiyu_test` e bucket `maiyu-test` |
| Preview | Não se aplica: não há ambiente de preview | |
| Produção | painel do Coolify, um recurso por app | API: as de runtime da seção 1.1, nunca no repositório; site: `SITE_ENV=production` obrigatória (sem ela toda resposta sai com `noindex` e o site some dos buscadores); healthcheck e porta também ficam no painel |

## 5. Primeira configuração

- [ ] `pnpm install` na raiz (workspace com `backend`, `frontend` e `shared`)
- [ ] `pnpm --filter ./backend build:deps` (compila o `shared/`, que o backend importa de `dist/`; sem
  ele o `tsc` e as suítes não acham `@maiyu/shared`)
- [ ] `cp backend/.env.example backend/.env`, `node ace generate:key` em `backend/` e as senhas locais.
  As suítes também precisam dele: o `.env.test` só sobrepõe banco, bucket, CORS e o seed, e o resto
  (`APP_KEY`, `PORT`, `HOST`...) vem do `.env`
- [ ] `docker compose -f backend/docker-compose.yml up -d` e `node ace migration:run` em `backend/`
- [ ] `cd frontend`
- [ ] `pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/paraglide`
- [ ] `pnpm dev` e abrir http://localhost:3000
- [ ] Reiniciar o `pnpm dev` depois de mudar mensagens em `messages/`
