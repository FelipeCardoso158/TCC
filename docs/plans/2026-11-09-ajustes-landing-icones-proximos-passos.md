# PRD - Ajustes da Landing: ícones centralizados e remoção de "Próximos passos"

**Data:** 2026-11-09  
**Versão:** 1.0  
**Status:** Implementado  
**Escopo:** Protótipo front-end SGOM (HTML/CSS/JS + localStorage)

---

## 1. Objetivo

Corrigir o alinhamento dos ícones dos cards de destaque do SGOM na página inicial
(Estoque, Atendimentos, Orçamentos e Financeiro) e remover a área de "Próximos passos"
da seção de Serviços.

## 2. Correção dos ícones

### 2.1 Problema
Os seletores amplos `.landing-feature-head span` e `.landing-feature-item span`
aplicavam `display: block` (e cor de texto secundária) sobre os elementos de ícone,
sobrescrevendo o `display: grid; place-items: center` da classe base `.landing-icon`.
Com isso, os SVGs ficavam desalinhados no canto superior esquerdo das caixas.

### 2.2 Correção
- Seletor do subtítulo do cabeçalho restrito a `.landing-feature-head div span`.
- Seletor da descrição do item restrito a `.landing-feature-item strong + span`.
- Reforço de `display: grid; place-items: center` em `.landing-feature-item .landing-icon`.

Resultado: ícones do logotipo e dos quatro cards (Estoque, Atendimentos, Orçamentos e
Financeiro) centralizados.

## 3. Remoção de "Próximos passos"

- O bloco `.landing-future` ("Em breve" / "Próximos passos") foi removido de
  `landingServices()`, deixando a seção de Serviços apenas com os módulos já disponíveis.

## 4. Arquivos alterados

- `app.js` — remoção do bloco de próximos passos em `landingServices()`.
- `styles.css` — ajuste dos seletores e centralização dos ícones do card de destaque.
- `docs/plans/2026-11-09-ajustes-landing-icones-proximos-passos.md` — este documento.

## 5. Critérios de aceite

- [x] Ícones de Estoque, Atendimentos, Orçamentos e Financeiro centralizados nas caixas.
- [x] Ícone do cabeçalho do card SGOM centralizado.
- [x] Seção "Próximos passos" removida da página inicial.
- [x] `node --check app.js` passa.
