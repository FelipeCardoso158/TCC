# SGOM — Sistema de Gerenciamento para Oficina de Motos

Repositório do TCC. Este projeto tem **duas partes**:

1. **Protótipo funcional** (HTML/CSS/JS puro) — demonstra o fluxo completo do sistema **sem instalar nada**.
2. **Documentação** — PRD e projeto técnico que orientam a implementação final.

## 1. Como abrir o protótipo

Não precisa de Node, build ou servidor. Basta abrir o arquivo `index.html` no navegador:

- No VS Code: clique com o botão direito em `index.html` → **Open with Live Server** (se tiver a extensão), **ou**
- Dê um duplo-clique em `index.html`, **ou**
- No terminal: `start index.html`

Os dados ficam salvos no `localStorage` do navegador. Para voltar ao estado de exemplo,
use o botão **Restaurar dados de exemplo** dentro do sistema.

### Contas de demonstração

| Perfil | Usuário | Senha |
|---|---|---|
| Funcionário | `funcionario@sgom` | `sgom123` |
| Cliente | `joao@email.com` | `123` |

Aba **Cliente** tem duas ações: **Entrar** (se já tem conta) e **Criar conta** (autocadastro).
Aba **Funcionário** tem apenas **Entrar**.

### O que dá para fazer no protótipo

- **Funcionário:** dashboard, orçamentos, atendimentos (kanban), estoque, clientes, serviços e **Funcionários** (criar contas de acesso, restrito a quem já está logado).
- **Cliente:** cadastrar-se, entrar, acompanhar suas O.S. e **aprovar/reprovar (com motivo)** orçamentos.
- Regras centrais: bloqueio de peça sem estoque, **reserva** ao aprovar, **baixa** ao entregar,
  `Aguardando Peça` apenas quando há peça pendente, validade do orçamento, desconto livre.

## 2. Documentação

- [`docs/plans/2026-10-17-prd-sgom.md`](docs/plans/2026-10-17-prd-sgom.md) — **PRD v2** (escopo do MVP).
- [`DOCUMENTO_PROJETO_TECNICO_SGOM_P1.md`](DOCUMENTO_PROJETO_TECNICO_SGOM_P1.md) — projeto técnico.
- `PRD.md` — rascunho inicial (v1, com financeiro/agenda/NF-e). **Não é o escopo atual.**

## 3. Estrutura dos arquivos do protótipo

| Arquivo | Papel |
|---|---|
| `index.html` | Página de entrada (shell). Liga o favicon e a marca. |
| `styles.css` | Tema visual (preto + laranja), responsivo. |
| `dados.js` | Dados de exemplo (`window.SGOM_SEED`). |
| `app.js` | Telas, navegação e regras de negócio. |
| `favicon.svg` | Ícone da aba (SVG autocontido). |
| `marca/brand.js` | **Fonte única da marca** (logo, cores, variantes). |
| `marca/preview.html` | Galeria para validar/trocar a logo. |
| `marca/sync-favicon.js` | Regenera o `favicon.svg` a partir do `brand.js`. |
| `docs/marca.md` | Guia da marca + passo a passo para trocar a logo. |

### Marca (logo)

A logo ("S em curso") é desenhada por código em `marca/brand.js`. Para **ver** a
galeria de tamanhos/fundos/variantes, abra `marca/preview.html`. Para **trocar ou
melhorar** a logo, siga `docs/marca.md` — em regra, edita-se só `marca/brand.js` e
depois roda `node marca/sync-favicon.js` (o favicon espelha a arte).

## 4. Próximos passos (implementação real)

O PRD define a stack alvo (Next.js + NestJS + PostgreSQL/Prisma). A sequência de
implementação está na seção 10 do PRD. O protótipo serve como referência de UX e de regras.
