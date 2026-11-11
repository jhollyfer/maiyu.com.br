# MinIO

Storage de API S3 que a régua sobe só em teste (dev, sessão de agente, e2e), nunca em produção.

Última verificação: 2026-11-08 (fonte: README de `minio/minio` no branch `master`, fonte da doc em `minio/docs` no branch `main`, README de `minio/mc` no branch `master`)

> **Projeto comunitário sem manutenção.** O README de `minio/minio` abre com "THIS REPOSITORY IS NO
> LONGER MAINTAINED" e aponta como alternativa o AIStor Free e o AIStor Enterprise (commit
> "update README.md format and clarify state of the project", 2026-02-12). A edição comunitária só
> distribui código-fonte; os binários antigos "will not receive updates"; a última tag do servidor
> é `RELEASE.2025-10-15T17-29-55Z` e a do `mc` é `RELEASE.2025-08-13T08-35-41Z`. A doc saiu do ar em
> 2025-10-10 (README de `minio/docs`) e só existe como fonte para compilar. A imagem `minio/minio` não
> existe mais no Docker Hub (manifest `latest` responde 401 com token anônimo de pull, contra 200 de
> `library/alpine`, testado em 2026-11-08). Arquivamento do repositório: relatado em busca web
> (2026-04-25), não confirmado na página do GitHub, que respondeu 403 no proxy.

> Conferido contra `minio` `RELEASE.2025-10-15T17-29-55Z` e `mc` `RELEASE.2025-08-13T08-35-41Z`
> (últimas tags publicadas; não há pacote npm).

**O que é:** servidor de objetos com API compatível com S3, escrito em Go, sob AGPLv3. Sobe com
`minio server <pasta>` e expõe a API S3 na porta 9000 e o console na porta que `--console-address`
indicar. O `mc` é o cliente de linha de comando que cria alias, bucket, usuário e política.

**Para que serve:** provar contra um S3 de verdade, na máquina e na sessão de agente, as regras de
upload de `backend.md` §5.4 (bucket privado, URL assinada que prende tipo e tamanho, expiração,
escopo mínimo, `ETag` exposto) sem conta em nuvem. Produção é S3 ou R2 (`tooling.md` §8.4,
`DECISIONS.md` #209 e #210).

**Como usar:**

```bash
# a comunidade só distribui código-fonte (Go 1.24 ou maior)
go install github.com/minio/minio@latest
MINIO_ROOT_USER=<usuário> MINIO_ROOT_PASSWORD=<senha> minio server /data --console-address ":9001"
mc alias set local http://localhost:9000 <usuário> <senha>
```

Na régua a imagem é compilada da tag fixa dentro de `backend/infra/minio/Dockerfile` (`tooling.md`
§8.4).

**Links:** 5.

**Skills:** `maiyu-backend`, `security-best-practices`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com MinIO: projeto segue, e regra de `_standards/` que contradiga
uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Distribuição

- **Obtenha o servidor compilando o código-fonte (`go install` ou `go build`, Go 1.24 ou maior); não conte com binário nem imagem da comunidade.** A edição comunitária passou a ser só código-fonte, e os binários legados não recebem atualização. [`#minio/minio`](https://raw.githubusercontent.com/minio/minio/master/README.md)
- **Imagem de container se monta com o `Dockerfile` do repositório, depois de compilar o binário.** O README manda compilar antes e só então rodar `docker build`. [`#minio/minio`](https://raw.githubusercontent.com/minio/minio/master/README.md)
- **Use o `mc` de versão lançada no mesmo dia ou depois da versão do servidor.** O cliente sai separado, e a distância entre as versões traz aviso, erro ou flag ausente. [`#reference/minio-mc`](https://raw.githubusercontent.com/minio/docs/main/source/reference/minio-mc.rst)

### Credencial e porta

- **Defina `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD` próprios.** Sem eles o servidor sobe com `minioadmin:minioadmin`, e a doc recomenda valor não padrão em qualquer ambiente. [`#container/single-node-single-drive`](https://raw.githubusercontent.com/minio/docs/main/source/includes/common/common-deploy.rst), [`#minio/minio`](https://raw.githubusercontent.com/minio/minio/master/README.md)
- **Console em porta própria por `--console-address`.** O exemplo oficial fixa a API em 9000 e o console em 9001. [`#container/single-node-single-drive`](https://raw.githubusercontent.com/minio/docs/main/source/includes/container/steps-deploy-minio-single-node-single-drive.rst)
- **O root tem permissão total sobre a API S3 e a administrativa; a aplicação usa outro usuário.** É o que o comentário do arquivo de ambiente oficial diz do root. [`#container/single-node-single-drive`](https://raw.githubusercontent.com/minio/docs/main/source/includes/common/common-deploy.rst)

---

## Servidor

#### minio/minio
[doc](https://github.com/minio/minio) | [markdown](https://raw.githubusercontent.com/minio/minio/master/README.md)

**O que é:** o README do servidor: aviso de fim de manutenção, licença AGPLv3, distribuição só por
código-fonte, compilação com `go install`, imagem por `docker build`, teste com console e `mc`.
**Para que serve:** saber como obter o binário hoje e qual é o status do projeto.
**Quando usar:** ao montar ou atualizar `backend/infra/minio/Dockerfile` e ao reconferir o status.

#### minio/docs
[doc](https://github.com/minio/docs) | [markdown](https://raw.githubusercontent.com/minio/docs/main/README.md)

**O que é:** o repositório da doc, retirada do ar em 2025-10-10, com as instruções de compilar com
Sphinx; sem desenvolvimento planejado.
**Para que serve:** saber que a doc oficial só existe como fonte `.rst` neste repositório.
**Quando usar:** antes de procurar uma página da doc do MinIO.

#### container/single-node-single-drive
[doc](https://github.com/minio/docs/blob/main/source/includes/container/steps-deploy-minio-single-node-single-drive.rst) | [markdown](https://raw.githubusercontent.com/minio/docs/main/source/includes/container/steps-deploy-minio-single-node-single-drive.rst)

**O que é:** os passos de um nó e um disco em container: arquivo de ambiente (`MINIO_ROOT_USER`,
`MINIO_ROOT_PASSWORD`, `MINIO_VOLUMES`, `MINIO_OPTS`) apontado por `MINIO_CONFIG_ENV_FILE`, portas
9000 e 9001, validação pelo log do container. O passo de baixar a imagem (`quay.io/minio/minio` ou
`minio/minio`) está desatualizado: a do Docker Hub não existe mais. Os trechos incluídos ficam em
`source/includes/common/common-deploy.rst` e `source/includes/container/common-deploy.rst`.
**Para que serve:** o desenho do serviço `minio` do `docker-compose.yml` de teste.
**Quando usar:** ao escrever ou revisar o serviço no compose.

## Cliente `mc`

#### reference/minio-mc
[doc](https://github.com/minio/docs/blob/main/source/reference/minio-mc.rst) | [markdown](https://raw.githubusercontent.com/minio/docs/main/source/reference/minio-mc.rst)

**O que é:** a referência do `mc`: alinhamento de versão com o servidor, instalação, `mc alias set`
com o histórico do shell desligado, e os comandos de bucket, política e administração.
**Para que serve:** o script de setup do bucket privado e do usuário de escopo mínimo.
**Quando usar:** ao escrever `backend/infra/minio/minio-setup.sh`.

#### minio/mc
[doc](https://github.com/minio/mc) | [markdown](https://raw.githubusercontent.com/minio/mc/master/README.md)

**O que é:** o README do cliente: comandos, exemplos de política JSON e compilação a partir do
código-fonte (Go 1.22 ou maior).
**Para que serve:** compilar o `mc` da tag fixa junto com o servidor.
**Quando usar:** ao montar a imagem de teste.
