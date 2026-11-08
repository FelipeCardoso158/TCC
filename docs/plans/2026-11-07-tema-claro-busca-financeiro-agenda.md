# PRD - Tema claro, busca do funcionário, financeiro e agenda

**Data:** 2026-11-07  
**Versão:** 1.2  
**Status:** Implementado e validado em navegador headless  
**Escopo:** Protótipo front-end SGOM (HTML/CSS/JS + localStorage)

---

## 1. Objetivo

Padronizar o SGOM no tema claro por padrão, manter um modo escuro opcional e adicionar
os módulos exclusivos da área do funcionário: busca global, financeiro e agenda. A Landing
Page passa a seguir a mesma linguagem visual das telas internas e ganha um widget de
atendimento simulado.

## 2. Decisões aprovadas

1. **Tema claro é o padrão** em Landing, login, painel do funcionário, portal do cliente,
   cards, modais e footer.
2. **Modo escuro é opcional**, acionado por botão Sol/Lua no header, com persistência em
   `localStorage` (`sgom_theme_v1`).
3. O botão do header passa a ser **“Entrar”** e abre um modal com:
   - **Área do Cliente** → login/cadastro do cliente (`#/login/cliente`).
   - **Área do Funcionário** → login do funcionário (`#/login`).
   - Cada rota exibe apenas o formulário da área escolhida, sem troca de abas entre
     cliente e funcionário.
4. **Não existe consulta pública de O.S.** O cliente vê apenas as próprias ordens após
   login e pode filtrar por placa ou número dentro do portal. A busca global é exclusiva
   do funcionário.
5. A **busca global do funcionário** fica na topbar do painel interno e localiza:
   cliente, telefone/CPF, placa, marca/modelo da moto e número da O.S.
6. Selecionar cliente/moto abre uma **Ficha do Cliente/Moto** com dados cadastrais,
   motos vinculadas e histórico de O.S.
7. O rodapé exibe **Sombrio - SC** e o botão **“Acompanhar Minha Moto”**, que leva ao
   login do cliente.
8. O widget de chat simulado (“SGOM Atendimento”) fica na Landing com atalhos de
   agendamento, consulta e horário, além de resposta automática no campo de texto. O
   botão flutuante usa o ícone vetorial oficial do WhatsApp em verde `#25D366`.
9. O header da Landing é grafite de alto contraste, igual à topbar do funcionário, com
   links claros e seletor Sol/Lua. O corpo da Landing permanece claro.
10. O mockup ilustrativo do hero foi substituído por um card minimalista com ícones SVG,
    sem imagens raster ilustrativas além do logo oficial.

## 3. Módulo Financeiro (exclusivo do funcionário)

### 3.1 KPIs
- Receita de Hoje
- Faturamento Total (período selecionado)
- Custos de Peças
- Lucro Líquido

### 3.2 Filtros
- Hoje
- Esta Semana
- Este Mês
- Personalizado (Data Inicial e Data Final)

### 3.3 Regra de cálculo
- Considerar somente O.S. com status **Entregue**.
- Data de referência: `deliveredAt`.
- Receita de Hoje = soma de `orderTotal` das O.S. entregues na data atual, independente do filtro.
- Faturamento = soma de `orderTotal` das O.S. entregues no período selecionado.
- Mão de Obra = soma dos itens `LABOR`.
- Peças (venda) = soma dos itens `PART` pelo `unitPrice`.
- Custos de Peças = soma de `qty × unitCost` dos itens `PART`; usa o custo atual da peça
  como fallback para itens antigos sem `unitCost`.
- Lucro Líquido = Faturamento − Custos de Peças.
- Peças sem custo cadastrado entram com custo `R$ 0,00`.

### 3.4 Tabela por O.S.
Colunas exatas: Nº da O.S., Data, Cliente, Mão de Obra (R$), Peças (R$) e Total (R$).
O número da O.S. é clicável e abre o detalhe; o status aparece como legenda abaixo dele.
A tabela mostra o valor vendido em Peças; o custo real é usado apenas nos KPIs.

### 3.5 Visual
- Fundo claro `#F8F9FA`, cards brancos com bordas finas e detalhe laranja.
- Quatro KPIs em linha no desktop, dois no tablet e um no celular.

## 4. Módulo Agenda (exclusivo do funcionário)

### 4.1 Visualizações
- Mês
- Semana
- Dia

### 4.2 Status e cores
- Amarelo: Pré-agendamento
- Azul: Confirmado
- Verde: Em Atendimento
- Cinza: Concluído

### 4.3 Funcionalidades
- Navegação anterior/próximo/hoje.
- Cadastro de novo agendamento (cliente/moto, data, hora, serviço, status e queixa).
- Detalhe do agendamento com alteração de status.
- Conversão direta em O.S.:
  - Cria O.S. com status **Aprovada** (aparece no Kanban).
  - Vincula `appointment.orderId`.
  - Marca o agendamento como **Concluído**.
  - Se houver serviço vinculado, cria item de mão de obra.

### 4.4 Modelo de dados
`appointments: [{ id, number, customerId, motorcycleId, date, time, status, serviceId, service, complaint, orderId, createdAt }]`

Status: `PRE_AGENDADO | CONFIRMADO | EM_ATENDIMENTO | CONCLUIDO`.

## 5. Infraestrutura técnica

- Tema controlado por `data-theme` no `<html>`, aplicado antes da pintura via script inline.
- Tokens CSS semânticos para header grafite, hero, card de recursos, footer, cards e modais.
- Novos tokens e componentes em `styles.css`.
- Estado adicional em `app.js`: busca, tema, chat, financeiro e agenda.
- Seed de agendamentos relativo à data atual em `dados.js`.
- Migração idempotente para bancos existentes em `localStorage` (adiciona `appointments`,
  `seq.appointment` e `cost` nas peças sem apagar dados).
- Itens de peça novos registram `unitCost` no momento da inclusão na O.S.
- Rotas estáticas via hash: `#/login` e `#/login/cliente`.

## 6. Critérios de aceite

- [x] Landing, login, painel, portal do cliente, cards, modais e footer abrem no tema claro.
- [x] Botão Sol/Lua alterna todo o sistema e mantém a escolha após recarregar.
- [x] Header exibe “Entrar” e abre modal com as duas áreas.
- [x] Área do Funcionário exige Usuário e Senha, sem formulário ou aba de cliente.
- [x] Área do Cliente exige login/cadastro, sem formulário ou aba de funcionário.
- [x] Cliente só acessa as próprias O.S.; não há busca pública.
- [x] Cliente filtra suas O.S. por placa ou número sem visualizar ordens de terceiros.
- [x] Funcionário pesquisa por cliente, moto, placa ou O.S. na topbar.
- [x] Header da Landing é grafite, com links claros e seletor Sol/Lua.
- [x] Hero usa card minimalista com ícones SVG e não exibe mockup ilustrativo.
- [x] Widget flutuante usa o ícone oficial vetorial do WhatsApp.
- [x] Ficha do cliente mostra dados, motos e O.S. vinculadas.
- [x] Abas Financeiro e Agenda aparecem somente para funcionário.
- [x] Financeiro considera somente O.S. Entregues e usa `deliveredAt` como data.
- [x] KPIs separam valor vendido de Peças e custo real; Lucro = Faturamento − Custos.
- [x] Tabela financeira tem as seis colunas definidas e número da O.S. clicável.
- [x] Cadastro de peça inclui Custo (R$) e itens novos preservam `unitCost`.
- [x] Agenda alterna Mês/Semana/Dia, cadastra agendamentos e converte em O.S. no Kanban.
- [x] Widget de chat abre, responde atalhos e texto livre.
- [x] Footer exibe Sombrio - SC e o botão de consulta.
- [x] `node --check app.js` e `node --check dados.js` passam.
