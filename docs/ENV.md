# Configuração de ambiente

**Maiyu** · variáveis que o app precisa para rodar, local e em produção

> Exemplo e documentação usam placeholder; segredo real fica fora do Git.
> Variável nova entra aqui **e** em `.env.example` no mesmo commit. Quem valida é o schema do
> leitor de ENV (`_standards/backend.md` §6, `backend-fastify.md` §7); este arquivo explica.

O site não tem backend, e o código não lê **nenhuma** variável de ambiente em tempo de execução
(`import.meta.env.DEV` é o único acesso, e é flag do Vite). O `frontend/.env.example` é o modelo
fechado da casa e traz chaves que o site não usa (`DECISIONS.md` #9); a tabela abaixo diz, chave a
chave, o que vale aqui.

## 1. Variáveis

Mesma ordem de blocos do `frontend/.env.example`.

| Variável | App | Obrigatória | Segredo | O que é | Exemplo |
|---|---|---|---|---|---|
| `VITE_API_URL` | web | não | não | endereço da API; o site não tem API, a chave existe só pelo modelo | `http://localhost:3333` |
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

O `frontend/.env.example` (versionado, só placeholder) é o do modelo da casa. Para rodar o site em
desenvolvimento nenhuma variável é necessária.

## 3. Segredo fora do Git

O `.gitignore` da raiz ignora `.env` e `.env.*` em qualquer pasta, com quatro exceções:
os modelos `.env.example` e `.env.e2e.example` (só placeholder), o `.env.test` (valor fixo de teste)
e o `frontend/.env.production` (só valor público de `VITE_*`, `_standards/tooling.md` §8.2). O `.gitleaks.toml` da raiz é o da régua, para a varredura de segredo
antes do PR (`_standards/tooling.md` §7). Os segredos do
CI/CD ficam nos secrets do repositório (aba Secrets, não Variables): `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID` e `VITE_SITE_URL` (`DECISIONS.md` #14). `VITE_SITE_URL` em `https://`, sem barra no fim; vazios, o build de publicação reprova
(`ARCHITECTURE.md` §9.1).

## 4. Por ambiente

| Ambiente | De onde vêm os valores | Observação |
|---|---|---|
| Desenvolvimento | nenhum `.env` é necessário | `pnpm dev` na porta 3000 |
| Teste | nenhum | `pnpm test` roda sem variável |
| Preview | Não se aplica: não há ambiente de preview | |
| Produção | painel do Coolify | hoje sem variável de aplicação; healthcheck e porta ficam no painel |

## 5. Primeira configuração

- [ ] `cd frontend && pnpm install`
- [ ] `pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/paraglide`
- [ ] `pnpm dev` e abrir http://localhost:3000
- [ ] Reiniciar o `pnpm dev` depois de mudar mensagens em `messages/`
