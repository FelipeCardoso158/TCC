# PRD - Financeiro no menu do funcionário e contato da Landing

**Data:** 2026-11-08  
**Versão:** 1.0  
**Status:** Implementado  
**Escopo:** Protótipo front-end SGOM (HTML/CSS/JS + localStorage)

---

## 1. Objetivo

Expor a aba **Financeiro** no menu superior interno do funcionário (pós-login) e atualizar
os dados de contato exibidos na página inicial (telefone/WhatsApp e endereço).

## 2. Financeiro

### 2.1 Acesso
- A aba **Financeiro** aparece somente no menu superior do painel do funcionário.
- O portal do cliente permanece restrito a “Minhas O.S.”, sem acesso ao Financeiro.
- O item deixa o agrupamento “Mais” e passa a ser uma aba primária do `STAFF_NAV`.

### 2.2 Indicadores
- **Receita de Hoje:** soma das O.S. entregues na data atual, independente do filtro.
- **Faturamento Total:** soma das O.S. entregues no período selecionado.
- **Custos de Peças:** soma de `qty × unitCost` das peças utilizadas no período, com
  fallback para o custo atual da peça quando o item não possui `unitCost`.
- **Lucro Líquido:** Faturamento Total − Custos de Peças.

### 2.3 Filtros
- Hoje
- Esta Semana
- Este Mês
- Personalizado (Data Inicial e Data Final, aplicado pelo botão “Aplicar”)

### 2.4 Regra de cálculo
- Considerar somente O.S. com status **Entregue**.
- Data de referência: `deliveredAt`.
- Mão de Obra = soma dos itens `LABOR`.
- Peças (venda) = soma dos itens `PART` pelo `unitPrice`.
- Peças sem custo cadastrado entram com custo `R$ 0,00`.

### 2.5 Tabela de lançamentos
Colunas: Nº da O.S., Data, Cliente, Mão de Obra (R$), Peças (R$) e Total (R$).
O número da O.S. continua clicável e abre o detalhe da ordem.

### 2.6 Visual
- Fundo claro `#F8F9FA`, cards brancos com bordas finas e destaques laranja.
- Quatro indicadores em linha no desktop, dois no tablet e um no celular.

## 3. Contato da Landing

- **Telefone / WhatsApp:** `(48) 99842-5702`
- **Link WhatsApp:** `https://wa.me/5548998425702`
- **Endereço:** Rod. Interpraias, 1236, Balneário Gaivota - SC, 88955-000

Atualizações aplicadas em:
- Seção Contatos da Landing (telefone, WhatsApp e endereço).
- Botão “Falar no WhatsApp”.
- Rodapé e copyright da Landing.
- Resposta automática do chat de atendimento.
- Placeholder do campo de telefone no cadastro de cliente.

## 4. Arquivos alterados

- `app.js` — menu do funcionário (`STAFF_NAV`), textos e links de contato.
- `docs/plans/2026-11-08-financeiro-painel-e-contato.md` — este documento.

## 5. Critérios de aceite

- [x] Aba Financeiro visível no menu superior do funcionário.
- [x] Aba Financeiro ausente no portal do cliente.
- [x] Indicadores consideram somente O.S. Entregues e usam `deliveredAt`.
- [x] Filtros Hoje, Esta Semana, Este Mês e Personalizado recalculam os indicadores.
- [x] Tabela exibe as seis colunas definidas.
- [x] Landing exibe o novo telefone/WhatsApp e o novo endereço em todos os pontos.
- [x] `node --check app.js` e `node --check dados.js` passam.
