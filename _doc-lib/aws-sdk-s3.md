# AWS SDK for JavaScript v3 (S3)

Cliente S3 e assinador de URL do SDK v3, usados contra S3 e Cloudflare R2 em produção.

Última verificação: 2026-11-08 (fonte: READMEs e `supplemental-docs/` de `aws/aws-sdk-js-v3` no branch `main`, README de exemplos de `awsdocs/aws-doc-sdk-examples` no branch `main`, fonte da página do R2 em `cloudflare/cloudflare-docs` no branch `production`)

> Conferido contra `@aws-sdk/client-s3@3.1164.0` e `@aws-sdk/s3-request-presigner@3.1164.0` (latest).

> O Developer Guide (`docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/`) e a página do R2
> em `developers.cloudflare.com` não responderam no proxy desta execução (conexão recusada) e ficam
> fora até serem testados. A página do R2 entra pelo fonte no GitHub; a página HTML do GitHub
> responde 403 no proxy, então o conteúdo foi lido cru em `raw.githubusercontent.com`.

**O que é:** o SDK modular da AWS para JavaScript. `@aws-sdk/client-s3` traz o `S3Client` e um
comando por operação (`PutObjectCommand`, `GetObjectCommand`, `CreateMultipartUploadCommand`,
`UploadPartCommand`, `CompleteMultipartUploadCommand`, `PutBucketCorsCommand`...), que se envia com
`client.send(command)`. `@aws-sdk/s3-request-presigner` transforma um comando numa URL assinada
(SigV4) com prazo, que o navegador usa sem receber credencial.

**Para que serve:** falar com qualquer storage de API S3 (AWS S3, Cloudflare R2, o MinIO de teste)
pelo mesmo código, trocando só `endpoint`, `region` e credencial. Na régua é a base do upload em três
passos com URL pré-assinada multipart e da leitura por URL assinada de prazo curto (`backend.md`
§5.4); a FlyDrive usa este SDK por baixo (`_doc-lib/flydrive.md`).

**Como usar:**

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

```ts
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// um cliente por credencial e região, criado uma vez e reutilizado
const client = new S3Client({
  region: 'auto', // R2 exige o campo e não o usa
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

const url = await getSignedUrl(
  client,
  new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'image/png' }),
  // content-type não é assinado por padrão: sem esta linha o storage aceita qualquer tipo
  { expiresIn: 300, signableHeaders: new Set(['content-type']) },
)
```

**Links:** 7.

**Skills:** `maiyu-backend`, `maiyu-node`, `security-best-practices`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com o SDK S3: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Cliente

- **Importe `S3Client` e só os comandos usados; o cliente agregado `S3` fica fora do código empacotado.** O SDK é modular por cliente e comando, e a doc recomenda o cliente enxuto quando há bundle. [`#clients/client-s3`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/clients/client-s3/README.md)
- **Crie um `S3Client` por conjunto de credencial e região e reutilize em todo comando.** Cliente novo a cada chamada refaz credencial e endpoint a cada requisição. [`#supplemental-docs/EFFECTIVE_PRACTICES`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/EFFECTIVE_PRACTICES.md)
- **Não leia nem altere `client.config` depois de criar o cliente.** A doc trata leitura e escrita da config depois da criação como uso incompatível. [`#supplemental-docs/EFFECTIVE_PRACTICES`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/EFFECTIVE_PRACTICES.md)
- **Storage fora da AWS entra pela opção `endpoint` do construtor.** Ela substitui toda a resolução de endpoint por regra do SDK. [`#supplemental-docs/CLIENTS`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/CLIENTS.md)
- **No R2, `region: 'auto'`, `endpoint` `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` e a credencial S3 gerada no token de API do R2.** A região é exigida pelo SDK e ignorada pelo R2. [`#r2/examples/aws/aws-sdk-js-v3`](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/r2/examples/aws/aws-sdk-js-v3.mdx)

### Leitura

- **Todo `GetObject` tem o `Body` lido até o fim (`transformToByteArray`, `transformToString`, pipe) ou descartado.** Corpo não consumido prende o socket e, no Node.js, leva à exaustão de sockets, vazamento e travamento. [`#supplemental-docs/EFFECTIVE_PRACTICES`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/EFFECTIVE_PRACTICES.md)

### URL pré-assinada

- **Dê `expiresIn` explícito em toda URL assinada.** Sem ele a URL vale 900 segundos. [`#packages/s3-request-presigner`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/packages/s3-request-presigner/README.md)
- **Para prender o tipo, `ContentType` no comando e `signableHeaders` com `content-type` no `getSignedUrl`.** Header que não começa com `x-amz-` só entra na assinatura por `signableHeaders` (o fonte do assinador põe `content-type` na lista de não assinados por padrão). [`#packages/s3-request-presigner`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/packages/s3-request-presigner/README.md)
- **Header `x-amz-*` que precisa ser assinado (checksum, por exemplo) vai em `unhoistableHeaders`.** Assim ele é exigido na requisição em vez de subir para a query string. [`#packages/s3-request-presigner`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/packages/s3-request-presigner/README.md)
- **Quem usa URL assinada com `ContentType` manda o mesmo `Content-Type` no `PUT`.** Header diferente do assinado faz o upload falhar. [`#r2/examples/aws/aws-sdk-js-v3`](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/r2/examples/aws/aws-sdk-js-v3.mdx)

### CORS do bucket

- **Upload do navegador para URL assinada exige regra CORS no bucket com a origem do app, o método `PUT` e `ExposeHeaders: ["ETag"]`.** O CORS limita quem sobe arquivo, e sem o `ETag` exposto o navegador não lê o identificador do que gravou. [`#r2/examples/aws/aws-sdk-js-v3`](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/r2/examples/aws/aws-sdk-js-v3.mdx), [`#javascriptv3/example_code/s3`](https://raw.githubusercontent.com/awsdocs/aws-doc-sdk-examples/main/javascriptv3/example_code/s3/README.md)

### Erros

- **Erro do serviço sai como exceção; trate a partir de `unknown`, por `name`, por `instanceof` da `S3ServiceException` base ou por `$metadata.httpStatusCode`.** Erro modelado e não modelado estendem a mesma exceção base, que tem `instanceof` seguro entre pacotes. [`#supplemental-docs/ERROR_HANDLING`](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/ERROR_HANDLING.md)

---

## Pacotes

#### clients/client-s3
[doc](https://github.com/aws/aws-sdk-js-v3/blob/main/clients/client-s3/README.md) | [markdown](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/clients/client-s3/README.md)

**O que é:** o README do `@aws-sdk/client-s3`: importação por comando, `client.send`, o cliente
agregado `S3`, o `$metadata` do erro e a lista de todas as operações com link para a API reference.
**Para que serve:** montar o cliente e achar o comando certo de cada operação (inclusive as de
multipart e de CORS do bucket).
**Quando usar:** ao adicionar o SDK e ao procurar o nome de uma operação.

#### packages/s3-request-presigner
[doc](https://github.com/aws/aws-sdk-js-v3/blob/main/packages/s3-request-presigner/README.md) | [markdown](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/packages/s3-request-presigner/README.md)

**O que é:** `getSignedUrl(client, command, options)` e `S3RequestPresigner`, com `expiresIn` (padrão
900), `signableHeaders`, `unhoistableHeaders` e `hoistableHeaders`.
**Para que serve:** gerar a URL de leitura e de escrita (arquivo inteiro e parte do multipart) que
prende prazo, tipo e tamanho.
**Quando usar:** em toda URL que o navegador recebe para ler ou gravar no bucket.

## Guias do SDK

#### supplemental-docs/CLIENTS
[doc](https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/CLIENTS.md) | [markdown](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/CLIENTS.md)

**O que é:** os parâmetros do construtor: `region`, `credentials`, `endpoint`, `requestHandler`,
retry, logger e, para S3, `followRegionRedirects`, `requestChecksumCalculation` e
`responseChecksumValidation` (`WHEN_REQUIRED` ou `WHEN_SUPPORTED`), `bucketEndpoint`.
**Para que serve:** apontar o cliente para R2 ou MinIO, ajustar timeout e retry, entender o checksum
que o SDK manda por padrão.
**Quando usar:** ao configurar o cliente por ambiente e ao investigar recusa de storage S3-compatível.

#### supplemental-docs/EFFECTIVE_PRACTICES
[doc](https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/EFFECTIVE_PRACTICES.md) | [markdown](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/EFFECTIVE_PRACTICES.md)

**O que é:** as práticas oficiais: reutilizar o cliente, não mexer na config depois de criado, ler ou
descartar todo stream de resposta, dar mais tempo de conexão entre regiões.
**Para que serve:** evitar exaustão de sockets e trabalho repetido de credencial no processo Node.
**Quando usar:** ao escrever o service de storage e ao revisar leitura de objeto.

#### supplemental-docs/ERROR_HANDLING
[doc](https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/ERROR_HANDLING.md) | [markdown](https://raw.githubusercontent.com/aws/aws-sdk-js-v3/main/supplemental-docs/ERROR_HANDLING.md)

**O que é:** erro de compilação, erro de runtime fora do serviço, erro modelado e não modelado do
serviço, e como distinguir por `name`, `instanceof` e `$metadata`.
**Para que serve:** traduzir a falha do storage em `left(HTTPException)` sem engolir a causa.
**Quando usar:** no service de storage, ao mapear erro do S3 para erro de negócio.

## Exemplos

#### javascriptv3/example_code/s3
[doc](https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/s3/README.md) | [markdown](https://raw.githubusercontent.com/awsdocs/aws-doc-sdk-examples/main/javascriptv3/example_code/s3/README.md)

**O que é:** o índice dos exemplos oficiais de S3 do SDK v3 (o mesmo conteúdo da página "Amazon S3
examples" do Developer Guide): ações isoladas (`PutBucketCors`, `GetBucketCors`...) e cenários (URL
pré-assinada, arquivo grande em partes).
**Para que serve:** ver o código de referência de CORS do bucket com `ExposeHeaders: ["ETag"]` e da
URL pré-assinada de upload.
**Quando usar:** ao escrever a política de CORS do bucket e o primeiro fluxo de upload.

## Cloudflare R2

#### r2/examples/aws/aws-sdk-js-v3
[doc](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/r2/examples/aws/aws-sdk-js-v3.mdx) | [markdown](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/r2/examples/aws/aws-sdk-js-v3.mdx)

**O que é:** o `S3Client` configurado para o R2 (`region: 'auto'`, endpoint por conta), URL
pré-assinada de leitura e de escrita, e a restrição de upload por CORS e `Content-Type`.
**Para que serve:** subir o mesmo código de storage no R2 de produção e escrever a política de CORS
do bucket (`backend/infra/r2-cors.json`).
**Quando usar:** em todo projeto com R2 em produção.
