# PRD - Foto da oficina no card de localização da Landing

**Data:** 2026-11-09  
**Versão:** 1.0  
**Status:** Implementado  
**Escopo:** Protótipo front-end SGOM (HTML/CSS/JS + localStorage)

---

## 1. Objetivo

Atualizar o card de localização/contato da Landing Page adicionando a foto real da
fachada da oficina, mantendo as informações de endereço, telefone e demais dados de
contato já cadastrados no sistema.

## 2. Card de localização

### 2.1 Conteúdo
- A seção **Contatos** passa a exibir um card branco de localização envolvendo a lista
  de contato e os botões de ação.
- A foto da fachada (`oficina.png`) é exibida no topo do card, acima dos dados de
  localização.

### 2.2 Dados mantidos
- **E-mail:** contato@sgom.com.br
- **Telefone / WhatsApp:** (48) 99842-5702 — link `https://wa.me/5548998425702`
- **Endereço:** Rod. Interpraias, 1236, Balneário Gaivota - SC, 88955-000
- **Horário:** Seg a Sex, 8h às 18h · Sáb, 8h às 12h

Os textos de endereço e contato **não** foram alterados.

### 2.3 Imagem
- Arquivo: `oficina.png` (1440×1081).
- Uso direto do PNG original, com `loading="lazy"`, `width`/`height` e `object-fit: cover`.
- Cantos levemente arredondados (`border-radius: 12px`, reduzido para `10px` no mobile).
- Enquadramento responsivo: largura total do card e altura máxima controlada.

## 3. Visual

- O card permanece em **tema claro** mesmo quando o aplicativo está em tema escuro:
  fundo branco, texto grafite legível e botões/destaques em laranja.
- Card lateral "Já é cliente?" permanece inalterado.

## 4. Arquivos alterados

- `app.js` — `landingContact()`: criação do card e inclusão da foto.
- `styles.css` — estilos do card de localização, da foto e ajustes responsivos.
- `docs/plans/2026-11-09-oficina-localizacao-foto-landing.md` — este documento.

## 5. Critérios de aceite

- [x] Foto da fachada exibida no card de localização da seção Contatos.
- [x] Endereço, telefone, e-mail e horário mantidos sem alteração.
- [x] Imagem com cantos arredondados e enquadramento responsivo.
- [x] Card em tema claro (fundo branco, texto grafite, destaques laranja) em ambos os temas.
- [x] `node --check app.js` passa.
