# Fluxos do usuário

**Maiyu** · cada passo do primeiro acesso até concluir a tarefa

> Um fluxo por funcionalidade do `PRD.md` §4. Tela nova ou fluxo novo entra aqui no mesmo
> commit. Os testes seguem estes passos (`TEST-PLAN.md`).

## Jornadas principais

| Fluxo | Quem | Tela inicial | Resultado |
|---|---|---|---|
| [Conhecer a Maiyu](#conhecer-a-maiyu) | qualquer visitante | `/` | entende quem é a Maiyu e o que faz |
| [Ver o portfólio](#ver-o-portfólio) | organização | `/portfolio` | vê os projetos no ar |
| [Ler o diário](#ler-o-diário) | leitor | `/blog` | lê um artigo |
| [Candidatar-se a uma vaga](#candidatar-se-a-uma-vaga) | candidato | `/career` | candidatura confirmada na tela |
| [Falar com a Maiyu](#falar-com-a-maiyu) | qualquer visitante | `/contact` | contato por formulário, e-mail, telefone ou WhatsApp |
| [Trocar idioma e tema](#trocar-idioma-e-tema) | qualquer visitante | qualquer tela | página no idioma e tema escolhidos |

Os endereços em inglês e espanhol levam o prefixo `/en` e `/es`; português fica sem prefixo.

---

## Conhecer a Maiyu

**Entrada:** busca, link compartilhado ou digitando o domínio
**Pré-condição:** nenhuma

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | abre a home | mostra a proposta, a capacidade, o processo, o trabalho no ar, o mapa da borda e o time por ofício | `/` |
| 2 | rola a página | revela as seções por CSS (sem movimento se `prefers-reduced-motion`) | `/` |
| 3 | clica em "Agendar conversa" | abre o WhatsApp da Maiyu | `wa.me` |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| Endereço inexistente | 404 com "Voltar ao início" |
| Erro de renderização | tela 500 com "Tentar de novo" |

---

## Ver o portfólio

**Entrada:** menu "Portfólio" ou seção de trabalho da home
**Ação:** percorrer os projetos
**Sucesso:** o projeto abre no endereço dele
**Falha:** não há chamada de rede; o conteúdo vem do código

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | abre o portfólio | lista os projetos com cliente, resumo e tecnologias | `/portfolio` |
| 2 | clica num projeto | abre a URL do projeto | site do projeto |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| Lista vazia | Não se aplica: a lista é fixa no código |

---

## Ler o diário

**Entrada:** menu "Diário"
**Ação:** filtrar por categoria e abrir um artigo
**Sucesso:** o artigo abre
**Falha:** slug inexistente mostra o 404 da própria rota

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | abre o diário | lista os artigos | `/blog` |
| 2 | escolhe uma categoria | põe `?category=` na URL e filtra | `/blog?category=tech` |
| 3 | abre um artigo | mostra o texto | `/blog/<slug>` |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| `?category=` inválido | mostra todos os artigos |
| Artigo inexistente | 404 de negócio com `notFound()` |

---

## Candidatar-se a uma vaga

**Entrada:** menu "Carreiras"
**Ação:** escolher a vaga e preencher o formulário
**Sucesso:** toast de confirmação e formulário limpo
**Falha:** erro por campo; o conteúdo digitado fica

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | abre carreiras | lista as vagas | `/career` |
| 2 | preenche o formulário | valida o campo ao sair dele | `/career` |
| 3 | envia | confirma na tela; nada é enviado (`DECISIONS.md` #7) | `/career` |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| LinkedIn que não é URL | erro no campo |
| Vaga fora da lista | erro no campo |

---

## Falar com a Maiyu

**Entrada:** botão "Contato" ou o convite final da home
**Ação:** preencher o formulário ou usar um canal direto
**Sucesso:** toast de confirmação, ou o aplicativo de e-mail, telefone ou WhatsApp abre
**Falha:** erro por campo

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | abre contato | mostra e-mail, telefone, endereço e o formulário | `/contact` |
| 2 | preenche e envia | valida; confirma na tela e limpa | `/contact` |
| 3 | usa um cartão | abre `mailto:`, `tel:` ou o WhatsApp | aplicativo do aparelho |

**Caminhos alternativos**

| Situação | Resposta |
|---|---|
| Mensagem com menos de dez caracteres | erro no campo |
| Dois envios seguidos | o aviso se troca, não empilha |

---

## Trocar idioma e tema

**Entrada:** seletor de idioma e botão de tema no cabeçalho
**Ação:** escolher pt-BR, en ou es; claro, escuro ou sistema
**Sucesso:** a mesma página no outro idioma, sem perder a rota

| # | Usuário faz | Sistema responde | Tela |
|---|---|---|---|
| 1 | escolhe um idioma | navega para o mesmo caminho com o prefixo do idioma | qualquer |
| 2 | escolhe o tema | troca a classe `dark` no `<html>` | qualquer |

---

## Checklist de todo fluxo

- [ ] Entrada clara (de onde o usuário chega).
- [ ] Toda ação tem retorno: carregando, sucesso, erro.
- [ ] Dá para voltar ao passo anterior.
- [ ] Estados vazio e de erro desenhados.
- [ ] Sucesso visível (mensagem ou mudança na tela).
- [ ] Funciona no celular.
