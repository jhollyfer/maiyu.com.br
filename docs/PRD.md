# Documento de requisitos

**Maiyu** · site institucional da primeira empresa de consultoria e desenvolvimento de software sob demanda da tríplice fronteira Brasil, Peru e Colômbia

| Versão | Status | Data | Dono do produto | Meta |
|---|---|---|---|---|
| 1.1 | Rascunho | 2026-11-04 | Jhollyfer Rodrigues | Site reposicionado no ar em `maiyu.com.br`, nos três idiomas |

> Escopo é decisão do dono do produto. O agente não altera este arquivo sem pedido; viu
> contradição entre a tarefa e o PRD, pergunta.

## 1. Problema

A Maiyu fica em Benjamin Constant/AM (Alto Solimões), na tríplice fronteira Brasil, Peru e Colômbia,
e é a primeira empresa de consultoria e desenvolvimento de software sob demanda dessa região. É
construída por indígenas e pessoas originárias do território. Quem precisa de software feito com
integridade e inclusão (povos, associações e organizações indígenas, e organizações de qualquer setor)
não encontra, por perto, uma empresa que fale a língua dessas organizações nem os três idiomas da
fronteira. O site é a porta de entrada: precisa dizer quem é a Maiyu, o que ela entrega e como falar com ela.

## 2. Para quem

| Perfil | Quem é | O que precisa |
|---|---|---|
| Organização de qualquer setor | empresa, órgão ou entidade que contrata software sob demanda | entender o que a Maiyu faz, ver projetos no ar e chamar para uma conversa |
| Povo, associação, organização ou instituição indígena | da Amazônia, do Brasil, do Peru, da Colômbia e de outros países | confiar que o trabalho é feito com integridade e inclusão, por quem conhece o contexto, e falar na própria língua |
| Organização do Alto Solimões | microrregião da sede, em Benjamin Constant e vizinhança | achar uma equipe local, reconhecer o território no site e contatar por e-mail ou WhatsApp |
| Candidato a vaga | pessoa que quer trabalhar na Maiyu | ver as vagas abertas e se candidatar |
| Leitor do diário | quem chega por busca ou link compartilhado | ler artigos e, a partir deles, conhecer a Maiyu |

## 3. Objetivos

- Posicionar a Maiyu como a primeira empresa de consultoria e desenvolvimento de software sob demanda da tríplice fronteira, feita por indígenas e pessoas originárias da região.
- Atender o visitante em português, inglês e espanhol, com o idioma na URL.
- Converter a visita em conversa: contato por e-mail, telefone e WhatsApp.
- Metas numéricas: ver §8.

## 4. Primeira versão (MVP)

| # | Funcionalidade | Para quem | Fluxo |
|---|---|---|---|
| 1 | Home com a proposta, a capacidade, o processo, o trabalho e o mapa da borda | todos | `USER-FLOWS.md#conhecer-a-maiyu` |
| 2 | Portfólio de projetos no ar | organizações | `USER-FLOWS.md#ver-o-portfólio` |
| 3 | Diário (blog) com filtro por categoria e artigo | leitor | `USER-FLOWS.md#ler-o-diário` |
| 4 | Carreiras com candidatura | candidato | `USER-FLOWS.md#candidatar-se-a-uma-vaga` |
| 5 | Contato por formulário, e-mail, telefone e WhatsApp | todos | `USER-FLOWS.md#falar-com-a-maiyu` |
| 6 | Três idiomas, com troca de idioma e de tema | todos | `USER-FLOWS.md#trocar-idioma-e-tema` |
| 7 | SEO: sitemap, `robots.txt`, JSON-LD com `areaServed` em Brasil, Peru e Colômbia | buscadores | `USER-FLOWS.md#conhecer-a-maiyu` |

## 5. Fica de fora (nesta versão)

- Backend e API: o site não tem servidor de dados; o conteúdo mora em `lib/`.
- Envio real dos formulários de contato e de candidatura: eles confirmam na tela, como o site anterior. O contato de verdade segue por e-mail e WhatsApp. Volta quando houver endpoint.
- Painel de edição de conteúdo: artigos, projetos e vagas mudam por commit.
- Área logada.

## 6. Requisitos não funcionais

| Tema | Requisito |
|---|---|
| Idiomas | pt-BR, en e es, com paridade de mensagens cobrada por `lib/messages.test.ts` |
| Desempenho | SSR do TanStack Start com rotas `.lazy`; animação em CSS |
| Disponibilidade | imagem Nitro na porta 3000, healthcheck em `/health-check` |
| Acessibilidade | WCAG 2.1 AA, `motion-reduce` em toda animação (`DESIGN.md` §10) |
| Dispositivos | celular primeiro; desktop com a barra completa |
| Dados pessoais | o site não grava dado pessoal; o formulário não envia nada (`SECURITY.md` §8) |

## 7. Métricas de sucesso

Não se aplica: o site não tem ferramenta de métricas instalada, e as metas ainda não foram definidas
pelo dono (§8).

## 8. Perguntas em aberto

- [ ] Quais as metas numéricas do site (conversas iniciadas por mês, idiomas mais usados)? Há ferramenta de métricas desejada? Quem responde: dono do produto.
- [ ] O que os formulários de contato e candidatura devem fazer quando houver endpoint (e-mail, planilha, CRM)? Quem responde: dono do produto.
- [ ] Qual o contato de segurança a publicar em `SECURITY.md` §1? Quem responde: dono do produto.
- [ ] Os workflows de `.github/workflows` ficam como estão ou o upstream ganha um modelo para site sem backend? Ver `DECISIONS.md` #6. Quem responde: dono do produto.
- [ ] A política de dados pessoais (LGPD e equivalentes no Peru e na Colômbia) precisa de página pública? Quem responde: dono do produto.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 1.0 | 2026-11-04 | Primeira versão, a partir do `CLAUDE.md` e do código |
| 1.1 | 2026-11-04 | Posicionamento novo: tríplice fronteira, equipe indígena, público indígena e do Alto Solimões |
