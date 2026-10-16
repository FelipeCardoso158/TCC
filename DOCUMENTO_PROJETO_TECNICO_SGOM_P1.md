# DOCUMENTO DE PROJETO TÉCNICO

**Sistema de Gerenciamento para Oficina de Motocicletas (SGOM)**  
**Design escolhido: Proposta 1 — "Oficina Pro" (Corporativo Clássico)**

---

## 1. VISÃO GERAL

O presente documento detalha o projeto técnico para implementação do SGOM com base na Proposta 1 (P1 — Oficina Pro), aprovada como a mais simples e intuitiva para os diferentes perfis de usuário (Admin/Gerente, Recepção, Mecânico e Cliente).

A P1 adota o padrão de **sidebar escura fixa + conteúdo claro**, com navegação organizada por grupos, tabelas densas, tipografia sóbria e forte aderência aos padrões de ERP. Mantém, ainda, o **Kanban de Atendimentos (OS)** disponível no módulo "Atendimentos e Serviços", conciliando clareza com dinamismo.

---

## 2. REFERÊNCIAS

- **PRD.md** (versão existente no repositório): define RF/RN/RNF, modelo de dados, fluxo de OS, arquitetura alvo (Next.js + NestJS + PostgreSQL), roadmap e critérios de aceite.
- **Protótipos navegáveis (P1)**: `prototipos/proposta-1.html`, com tema `proposta-1.css`, dados em `mock-data.js` e motor em `app.js`.
- **Diretrizes de acessibilidade**: WCAG 2.1 AA (skip link, landmarks, foco visível, rótulos, aria-live, tabelas com caption/scope, modais acessíveis).

---

## 3. OBJETIVOS TÉCNICOS

1. Implementar o MVP enxuto e profundo definido na PRD (foco em OS, orçamento digital, estoque, preventiva por km, garantia, portal do cliente com login próprio).
2. Materializar fielmente o **Design System P1** (tokens, componentes, layout com sidebar escura).
3. Garantir **acessibilidade (WCAG 2.1 AA)**, responsividade e usabilidade em desktop-first com boa adaptação a telas menores.
4. Seguir a arquitetura proposta: **Frontend Next.js (TypeScript)**, **Backend NestJS (TypeScript)**, **PostgreSQL + Prisma**, com Docker, autenticação JWT + RBAC.
5. Manter código modular, testável e preparado para evolução (Fase 2).

---

## 4. ARQUITETURA DA SOLUÇÃO

### 4.1 Visão Geral

```text
Cliente (Web/PWA) ── Next.js (App Router) ── REST API (NestJS) ── PostgreSQL
                                        │
                                        └─ Redis (filas/notificações)
                                           └─ Storage (MinIO/S3) para anexos/fotos
```

### 4.2 Tecnologias Definidas

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | [Next.js 15](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS | Alinhado ao PRD, SSR/CSR, PWA opcional, ecossistema maduro. |
| UI/Base | Tailwind CSS + CSS Variables (tokens P1) | Replica fielmente tokens do protótipo (cores, espaçamentos, raios). |
| Ícones | [Lucide React](https://lucide.dev/) | Mesmo estilo stroke usado nos protótipos (SVG inline). |
| Backend | [NestJS](https://nestjs.com/) (REST) + TypeScript | Modular por domínio, injeção de dependência, fácil de testar. |
| ORM | [Prisma](https://www.prisma.io/) + Migrações | Tipado, migrações versionadas, bom com PostgreSQL. |
| Banco | PostgreSQL 16 | Conforme PRD. |
| Cache/Filas | Redis | Sessões, rate-limit, notificações assíncronas. |
| Armazenamento | MinIO (dev) / AWS S3 (prod) | Anexos/fotos de check-in (checklist). |
| Auth | JWT (access) + refresh token, RBAC por guards/roles | RF-01..RF-05. |
| Docs API | [OpenAPI/Swagger](https://swagger.io/specification/) (NestJS @nestjs/swagger) | Gera documentação viva. |
| Infra | Docker + docker-compose | Ambiente reproduzível. |
| Qualidade | ESLint, Prettier, Vitest/Jest, Playwright (E2E) | Testes conforme PRD. |

---

## 5. DESIGN SYSTEM — P1 "OFICINA PRO"

O P1 é baseado em **sidebar escura (#14171A)**, fundo claro (#F5F6F7), superfícies brancas (#FFFFFF) e **accent laranja (#F97316 / #C2410C)**. Tipografia: **Manrope** (títulos/display), **Inter** (corpo/UI), **JetBrains Mono** (números, placas, SKUs).

### 5.1 Tokens (CSS Variables / Tailwind)

Definir em `styles/tokens.css` (ou `tailwind.config.ts` via CSS vars):

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#F5F6F7` | Fundo da aplicação |
| `--surface` | `#FFFFFF` | Cards, topbar, modais |
| `--surface-2` | `#F7F7F8` | Hover de linhas/tabelas |
| `--text-primary` | `#14171A` | Texto principal |
| `--text-secondary` | `#5B6470` | Texto auxiliar/muted |
| `--border` | `#E3E6EA` | Bordas/divisores |
| `--accent` | `#F97316` | Destaques/dots |
| `--accent-strong` | `#C2410C` | Botões primários, links, estados ativos |
| `--accent-contrast` | `#FFFFFF` | Texto sobre accent-strong |
| `--accent-tint` | `#FFF1E6` | Fundo de item ativo na sidebar |
| `--focus` | `#C2410C` | Foco visível (outline) |
| `--sidebar-bg` | `#14171A` | Fundo da sidebar fixa |
| `--sidebar-text` | `#CBD3DC` | Itens não ativos |
| `--sidebar-text-active` | `#FFB27A` | Item ativo |
| `--sidebar-hover` | `#1F242B` | Hover na sidebar |
| `--sidebar-border` | `#242A31` | Divisores sidebar |

**Status (semânticos):** `--st-rascunho:#64748B`, `--st-aguardando:#F59E0B`, `--st-aprovado:#2563EB`, `--st-execucao:#F97316`, `--st-peca:#A855F7`, `--st-pronto:#16A34A`, `--st-entregue:#0EA5E9`, `--st-cancelado:#DC2626`, `--st-reprovado:#DC2626`.

**Espaçamentos:** base 4pt (4/8/12/16/20/24/32/40/48). **Raios:** `--radius-sm:6px`, `--radius:8px`, `--radius-lg:12px`. **Sombras:** `--shadow:0 1px 3px rgba(16,20,26,.08)`, `--shadow-lg:0 12px 32px rgba(16,20,26,.16)`.

### 5.2 Tipografia

Importar Google Fonts no `_app`/layout:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --font-ui: "Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --font-display: "Manrope", "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Consolas, monospace;
}
```

**Escala sugerida:** 11/12/13/14/15/16/18/20/22/24/28/34px. Usar `tracking-wide` (.06em) em labels/títulos de seção.

### 5.3 Layout P1 (Shell)

Estrutura fixa com **sidebar escura (252px)** + área principal com **Topbar** branca (sticky) + conteúdo com `max-width: 1360px`.

Componentes principais:
- `.app-shell` — grid `grid-cols-[252px_1fr] min-h-screen`
- `.sidebar` — fundo `var(--sidebar-bg)`, borda direita 0, padding 14px 12px, nav scroll, footer com usuário
- `.nav-item` — altura mínima 40px, padding 9px 10px, raio 6px, estado ativo com `background: var(--accent-tint)` + barra laranja à esquerda (3px) e texto `var(--sidebar-text-active)`
- `.topbar` — altura 64px, padding 12px 20px, border-bottom, sticky top-0 z-30, fundo `var(--surface)`
- `.content` — padding 24px, centralizado com max-width 1360px

**Responsividade:** até 1080px reduz colunas/KPIs; até 820px sidebar vira 72px (oculta rótulos) — comportamento já mapeado no protótipo.

### 5.4 Componentes-Chave (Mapeamento Protótipo → Código)

| Protótipo | Componente React | Observações |
|---|---|---|
| `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--danger`, `.btn--sm` | `Button` (variants) | Primário usa `bg-accent-strong text-white`, foco visível com outline 2px `focus:ring-2 focus:ring-[var(--focus)]`. |
| `.card`, `.card-head`, `.card-body` | `Card`, `CardHeader`, `CardContent` | Borda `border`, bg `surface`, raio `var(--radius)`, sombra `var(--shadow)`. |
| `.kpi-grid`, `.kpi` | `KpiCard` | Valor em `font-mono` 27–34px, labels uppercase tracking .06em. |
| `.table`, `.table-wrap` | `DataTable` | `caption` obrigatório, `th scope`, linhas hover `bg-surface-2`, células numéricas com `text-right font-mono whitespace-nowrap`. Linhas críticas com fundo tintado vermelho. |
| `.badge` + `.dot` | `StatusBadge` | **Não depende só de cor** (ponto + rótulo). Aplica classe por status. |
| `.kanban`, `.kcol`, `.kcard` | `KanbanBoard`/`KanbanColumn`/`KanbanCard` | Kanban rolável horizontal, cards clicáveis (role=button, keyboard Enter/Space). |
| `.chips`, `.chip` | `SegmentedControl`/`Pills` | Filtros com estado ativo com `bg-accent-tint text-accent-strong border-accent-strong`. |
| `.modal`, `.modal-backdrop` | `Dialog` (Radix) | `role="dialog" aria-modal="true"`, foco gerenciado, Esc fecha, retorna foco. Preferir Radix Dialog para robustez a11y. |
| `.field` (form) | `FormField` + RHF | Labels associados, `aria-required`, `aria-describedby` p/ erros, `aria-live` em mensagens. |
| `.timeline`, `.tl-item` | `Timeline` | Status com dot colorido. |
| `.bar`, `.bar-fill` | `ProgressBar` | Usado em KPIs/equipe/estoque. |
| `.toast-area`, `.toast` | `Toaster` (Sonner) | `role="status" aria-live="polite"`. |

> **Recomendação:** usar [shadcn/ui](https://ui.shadcn.com/) (baseado em Radix + Tailwind) e estender com tokens P1. Facilita acessibilidade nativa e mantém consistência.

---

## 6. ESTRUTURA DE PASTAS

### 6.1 Frontend (Next.js App Router)

```text
apps/web/
├── app/
│   ├── (auth)/login
│   ├── (app)/
│   │   ├── layout.tsx        # Shell P1 (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── os/               # Atendimentos (Kanban + Lista)
│   │   ├── orcamentos/
│   │   ├── agenda/           # Agendamento (PRD v1.0)
│   │   ├── estoque/
│   │   ├── preventiva/       # Diferencial por km
│   │   ├── garantia/
│   │   ├── clientes/
│   │   ├── servicos/
│   │   └── perfil/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn)
│   ├── layout/ (Sidebar, Topbar, NavItem)
│   ├── shared/ (KpiCard, StatusBadge, DataTable, Kanban*)
│   └── forms/
├── lib/
│   ├── utils.ts
│   ├── api/ (fetchers, React Query)
│   ├── auth/ (NextAuth/Auth.js ou guards)
│   └── constants/status.ts
├── hooks/
├── types/
├── styles/
│   └── tokens.css
└── tailwind.config.ts
```

### 6.2 Backend (NestJS)

```text
apps/api/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/
│   │   ├── decorators/ (roles, current-user)
│   │   ├── guards/ (jwt, roles, permissions)
│   │   ├── filters/ (http-exception)
│   │   ├── interceptors/
│   │   ├── dto/
│   │   └── utils/
│   ├── infra/
│   │   ├── prisma/
│   │   ├── redis/
│   │   ├── storage/
│   │   └── mail/
│   ├── modules/
│   │   ├── auth
│   │   ├── users (RBAC)
│   │   ├── customers
│   │   ├── motorcycles
│   │   ├── parts
│   │   ├── services-catalog
│   │   ├── service-orders
│   │   ├── budgets (orçamentos)
│   │   ├── inventory
│   │   ├── preventive (manutenção por km)
│   │   ├── warranty
│   │   ├── appointments (agendamento)
│   │   ├── attachments
│   │   ├── notifications
│   │   ├── audit-logs
│   │   └── reports
│   └── seeds/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── test/
```

---

## 7. MODELO DE DADOS (ERD — Baseado no PRD §8)

O PRD define as entidades centrais. Abaixo está o mapeamento essencial com campos-chave para o MVP.

| Entidade | Campos principais | Observações |
|---|---|---|
| `User` | id, email, passwordHash, name, roleId, active, lastLoginAt | Auth + RBAC. |
| `Role` | id, name (admin, recepção, mecânico, cliente), permissions[] | RF-03/04. |
| `Permission` | id, key, resource, action | Granular. |
| `Customer` | id, name, cpf/cnpj, phone, email, address, city, lgpdConsent (bool), lgpdConsentAt | RF-06 + LGPD. |
| `Motorcycle` | id, customerId, plate (unique), chassi (unique), brand, model, year, cc, motorType (2T/4T), color, km, photos[] | RF-07. Diferencial por km. |
| `ServiceCatalog` | id, code, name, description, timeStd (min), price | RF-08. |
| `Part` | id, sku (unique), name, categoryId, brand, app (aplicação/modelo), unit, cost, price, qty, minQty, location | RF-09 (aplicação/modelo conforme protótipo). |
| `PartCategory` | id, name | Categorização. |
| `Supplier` | id, name, cnpj, contact | RF-10. |
| `ServiceOrder` | id, number (OS-####), customerId, motorcycleId, status (enum), kmEntry, kmExit, complaint, diagnosis, mechanicId, bay, valueTotal, approvedAt, deliveredAt, warrantyEndDate, warrantyEndKm, notes | RF-12–22. Enum de status cobre kanban (orcamento/aguardando/aprovado/execucao/peca/pronto/entregue/cancelado). |
| `ServiceOrderItem` | id, serviceOrderId, type (LABOR/PART), serviceCatalogId?, partId?, qty, unitPrice, discount, total | RF-15. Reserva/baixa (RN-05). |
| `StatusHistory` | id, serviceOrderId, fromStatus, toStatus, userId, reason, timestamp | RF-22. |
| `Appointment` | id, customerId, motorcycleId, serviceId?, date, time, bay, mechanicId, status (confirmado/cancelado/no-show/pendente) | RF-33–36 (incluído conforme PRD v1.0). |
| `Mechanic` | id, userId?, name, specialty, active | RF-11. |
| `Commission` | id, mechanicId, serviceOrderId, serviceOrderItemId, amount, paidAt | RF-46, RN-04 (calculada ao finalizar/entregar). |
| `Payment` | id, serviceOrderId, method (DINHEIRO, PIX, CARTAO), amount, paidAt, status | Registro mínimo no fechamento (premissa definida). |
| `Warranty` | id, serviceOrderId, serviceOrderItemId, type (PART/SERVICE), startDate, endDate?, endKm?, active, notes | RF-32, garantia por item. |
| `MaintenancePlan` | id, name, modelPattern?, ccFrom?, ccTo?, motorType?, intervalKm, intervalMonths, item (óleo/corrente/kit/etc.) | RF-29–31 (preventiva por km). |
| `MaintenanceReminder` | id, motorcycleId, maintenancePlanId, lastKm, dueKm, currentKm, status (ok/proximo/vencido), notifiedAt | Cálculo de próximo vencimento. |
| `Attachment` | id, serviceOrderId, type (PHOTO/DIAGNOSIS/LAUDO), url, filename, mime | RF-14, checklist de entrada com fotos. |
| `Notification` | id, channel (EMAIL/WHATSAPP), to, template, payload, status (PENDING/SENT/FAILED), sentAt | Abstração de canais + e-mail real (mock WhatsApp). |
| `AuditLog` | id, userId, action, resource, resourceId, ip, metadata, createdAt | RF-05, RNF-04. |

**Relacionamentos-chave (resumo):** Customer 1..* Motorcycle; Motorcycle 1..* ServiceOrder; ServiceOrder 1..* ServiceOrderItem; ServiceOrder 1..* StatusHistory; ServiceOrder 1..* Attachment/Payment/Warranty; Mechanic 1..* Commission; Motorcycle *..* MaintenanceReminder (via plano).

---

## 8. API REST — PRINCIPAIS ENDPOINTS

Seguir REST semântico. Versionar em `/api/v1`. Usar DTOs com class-validator/class-transformer. Documentar com Swagger.

| Recurso | Endpoints | Observações |
|---|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me` | JWT + RBAC. |
| Users/Roles | CRUD `/users`, `/roles`, `/permissions` | Apenas admin. |
| Customers | `GET/POST/PUT/DELETE /customers`, `GET /customers/:id/motorcycles` | Busca por nome/telefone/placa. |
| Motorcycles | CRUD `/motorcycles`, `PATCH /motorcycles/:id/km` | Atualização de km (abertura/fechamento OS). |
| Parts | CRUD `/parts`, `GET /parts/low-stock`, `POST /parts/:id/adjust` | Alertas críticos. |
| Services | CRUD `/services-catalog` | Catálogo padronizado. |
| Service Orders (OS) | `POST /service-orders`, `GET /service-orders`, `GET /service-orders/:id`, `PATCH /service-orders/:id/status`, `POST /service-orders/:id/items`, `POST /service-orders/:id/attachments`, `POST /service-orders/:id/close`, `POST /service-orders/:id/deliver`, `GET /service-orders/kanban` | Núcleo. Kanban retorna colunas por status. |
| Budgets (Orçamentos) | `POST /budgets/from-os/:osId`, `POST /budgets/:id/send-link`, `POST /budgets/:id/approve` (total/parcial), `POST /budgets/:id/reject`, `GET /budgets/public/:token` (link público) | Aprovação digital (cliente logado preferencialmente; manter link com token curto/expirável). Cliente acessa via login próprio (decisão). |
| Inventory | `POST /inventory/entry`, `POST /inventory/exit`, `POST /inventory/count` (inventário) | Movimentações auditadas. |
| Preventive (km) | `GET /preventive`, `POST /maintenance-plans`, `POST /preventive/:id/remind`, `GET /motorcycles/:id/reminders` | Diferencial. Cálculo: `dueKm = lastKm + intervalKm`, status: `vencido` se `currentKm >= dueKm-?` (ou >= dueKm), `proximo` (ex.: faltam ≤ 500–1000km), `ok`. |
| Warranty | CRUD `/warranty`, `GET /warranty/active` | Garantia por item. |
| Appointments | CRUD `/appointments`, `PATCH /appointments/:id/status`, `POST /appointments/reminders` | Agendamento (PRD v1.0). |
| Reports/Dashboard | `GET /reports/dashboard`, `GET /reports/os`, `GET /reports/stock`, `GET /reports/commissions`, `GET /reports/export/csv`, `GET /reports/export/pdf` | KPIs P1. |
| Notifications | `POST /notifications/send`, `GET /notifications` | Abstração + e-mail real (WhatsApp mock). |

**Regras de negócio na API (críticas):**
- Reserva de peças ao mudar status p/ Aprovado/Execução; baixa ao Finalizar/Entregar (RN-05). Cancelamento reverte reserva.
- Bloquear finalização com estoque negativo sem autorização de gerente (RN-02) — retornar erro 422 com flag `requiresManagerApproval`.
- Alteração de orçamento invalida aprovação anterior (RN-03). Aprovação parcial cria nova versão (RN-08).
- Comissão calculada apenas ao finalizar/entregar (RN-04).
- Quilometragem atualizada manualmente na abertura/fechamento (RN-06).
- Consentimento LGPD obrigatório p/ envio por WhatsApp/e-mail (RN-07).

---

## 9. AUTENTICAÇÃO, AUTORIZAÇÃO E SEGURANÇA

| Item | Implementação |
|---|---|
| Auth | JWT access (curto, ex.: 15 min) + refresh token (httpOnly, Secure, SameSite=Strict/Lax, rotação). |
| RBAC | Roles: `admin`, `recepcao`, `mecanico`, `cliente`. Guards por rota + decorators `@Roles()`. |
| Permissões | Por recurso+ação (opcional granular). |
| Senhas | bcrypt/argon2 com salt. |
| Auditoria | `AuditLog` em ações críticas (CRUD sensível, alteração de status, movimentação de estoque). |
| LGPD | Consentimento explícito, minimização, retenção, direito de exclusão (soft delete + anonimização). |
| Segurança | HTTPS, CORS restrito, Rate limiting (Redis), Helmet, validação DTOs, evitar logs de segredos. |
| Arquivos | Validação MIME/tamanho, path seguro (não path traversal), storage privado com URLs assinadas. |

---

## 10. IMPLEMENTAÇÃO POR MÓDULOS (MVP)

| Módulo | Telas (P1) | Destaques de implementação |
|---|---|---|
| **Dashboard** | `/dashboard` | KPIs com cards, gráfico de barras (faturamento semanal), ordens por status (barras), preventivas por km (timeline), equipe (produtividade), estoque crítico. Dados agregados via queries otimizadas. |
| **Atendimentos (OS)** | `/os` | **Kanban + Lista** (segment control). Colunas por status (Orçamento/Aguardando/Aprovado/Em execução/Aguardando peça/Pronto/Entregue). Cards clicáveis abrem modal de detalhe com itens, timeline de status, anexos. Check-in com checklist + fotos (upload múltiplo). |
| **Orçamentos** | `/orcamentos` | Lista com status/validade, envio de link (notificação), aprovação total/parcial/reprovação. Geração de PDF do orçamento. Invalidação ao alterar itens. |
| **Estoque** | `/estoque` | Tabela com SKU, aplicação/modelo, saldo/mínimo, localização. Filtro "Só críticas". Entradas/saídas, inventário/ciclo. Badge crítico com destaque visual. |
| **Preventiva por km** | `/preventiva` | **Diferencial**: planos por modelo/item, cálculo `dueKm = lastKm + intervalKm`, barras de progresso, filtros (vencidas/próximas/em dia). Gera lembretes automáticos (notificações). |
| **Garantia** | `/garantia` | Garantia por item (data/km), listagem ativa, reabertura coberta. Vinculada a OS/item. |
| **Agendamento** | `/agenda` | Calendário/agenda do dia por baia/mecânico, status (confirmado/no-show/pendente), ocupação de baias. (PRD v1.0). |
| **Clientes** | `/clientes` | Ficha com motos vinculadas, histórico de OS, status LGPD (consentido/pendente). Busca global. |
| **Catálogo de Serviços** | `/servicos` | Código, tempo padrão, preço. Usado na montagem de OS/orçamento. |
| **Perfil/Configurações** | `/perfil` | Dados do usuário, preferências de notificações, canal (e-mail ativo, WhatsApp plugável). RBAC para usuários (admin). |

---

## 11. UX, ACESSIBILIDADE E RESPONSIVIDADE

| Diretriz | Implementação (P1) |
|---|---|
| **Skip link** | Visível ao foco, aponta para `#main-content`. |
| **Landmarks** | `<header>` (topbar), `<nav>` (sidebar), `<main id="main-content" tabindex="-1">`. |
| **Hierarquia** | 1 `<h1>` por tela (view-title), headings sem saltos. |
| **Foco visível** | `outline: 2px solid var(--focus)` com offset 2px; aplicado em todos elementos interativos. |
| **Teclado** | Navegação completa (sidebar, tabs, kanban cards com Enter/Espaço, modais com Tab/Shift+Tab/Esc). |
| **Formulários** | Labels associados, `aria-required`, `aria-describedby` p/ erros, mensagens com `aria-live="polite/assertive"`. |
| **Tabelas** | `<caption>` descritivo, `<th scope="col/row">`. Numéricos alinhados à direita. |
| **Status** | Badge com ponto + rótulo (não cor-only). Contraste AA garantido. |
| **Modais** | Radix/Dialog: `aria-modal="true"`, foco travado, retorna foco ao fechar. |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` desativa animações/transições. |
| **Alvos** | Mínimo 40–44x44px (botões, ícones, links). |
| **Responsivo** | Desktop-first. Sidebar colapsa p/ rail (72px) em < 820px; KPIs 2-col < 1080px, 1-col < 560px; tabelas com scroll horizontal. |

---

## 12. INFRAESTRUTURA, AMBIENTE E DEVOPS

### 12.1 Ambiente Local (Docker Compose)

```yaml
# docker-compose.dev.yml (sugestão)
services:
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: sgom, POSTGRES_USER: sgom, POSTGRES_PASSWORD: sgom }
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment: { MINIO_ROOT_USER: minio, MINIO_ROOT_PASSWORD: minio123 }
    ports: ["9000:9000","9001:9001"]
    volumes: [miniodata:/data]
  api:
    build: ./apps/api
    ports: ["3333:3333"]
    depends_on: [db,redis,minio]
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [api]
volumes:
  pgdata: {}
  miniodata: {}
```

### 12.2 Variáveis de Ambiente (.env.example)

| Variável | Exemplo | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://sgom:sgom@localhost:5432/sgom` | Prisma/Postgres |
| `JWT_SECRET` | `chave-secreta` | Access token |
| `JWT_REFRESH_SECRET` | `chave-refresh` | Refresh token |
| `REDIS_URL` | `redis://localhost:6379` | Filas/notificações |
| `STORAGE_ENDPOINT` | `http://localhost:9000` | MinIO/S3 |
| `STORAGE_BUCKET` | `sgom-attachments` | Bucket anexos |
| `MAIL_HOST/PORT/USER/PASS` | SMTP | **Canal real de e-mail** (conforme decisão) |
| `WHATSAPP_PROVIDER` | `mock` | WhatsApp plugável/mock (abstração) |
| `APP_URL` | `http://localhost:3000` | Links de orçamento/aprovação |
| `NODE_ENV` | `development` | dev/test/prod |

### 12.3 Scripts (package.json)

**API (Nest):** `start:dev`, `build`, `prisma:migrate`, `prisma:seed`, `test`, `test:e2e`, `lint`, `typecheck`.  
**Web (Next):** `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `e2e` (Playwright).

### 12.4 Migrações e Seeds

- Migrações Prisma versionadas (`prisma/migrations/`).
- Seed com dados básicos: roles (admin/recepcao/mecanico/cliente), usuário admin, categorias de peças, serviços padrão, planos preventivos por km (óleo/corrente/kit relação) para facilitar demos/UAT.

---

## 13. TESTES E QUALIDADE

Conforme plano de testes do PRD:

| Tipo | Escopo | Ferramentas |
|---|---|---|
| **Unitários** | Domínio: cálculo de orçamento, comissão, estoque, preventiva por km, garantia | Vitest/Jest |
| **Integração** | Rotas API (auth, OS, estoque, orçamentos) + Prisma + testes com DB em memória/contêiner | Jest + Supertest + Testcontainers (opcional) |
| **E2E** | Fluxo completo: criação → aprovação → execução → finalização → entrega | [Playwright](https://playwright.dev/) |
| **Acessibilidade (a11y)** | Testes automatizados de acessibilidade nas telas principais | [axe-core](https://www.deque.com/axe/) + Playwright |
| **UAT** | Com oficina parceira (5 OS completas, aprovação digital, reconciliação de estoque) | Checklist Anexo A do PRD |

**Critérios de aceite (obrigatórios):**
- OS não pode ser finalizada com estoque negativo sem autorização de gerente.
- Orçamento alterado perde aprovação anterior.
- Cliente consegue aprovar/reprovar orçamento via link (login próprio).
- Comissão aparece apenas após finalização/entrega.
- Dashboard exibe KPIs do mês corretamente.
- Preventiva por km calcula status (ok/próximo/vencido) corretamente.
- Checklist de entrada + fotos salvos em anexos.

---

## 14. ROADMAP DE IMPLEMENTAÇÃO (Sprints)

Baseado em sequência sugerida (PRD §11.1), com foco em **MVP enxuto e profundo** (P1).

| Sprint | Objetivo | Entregáveis |
|---|---|---|
| **Sprint 0** | Setup base | Monorepo (turbo/pnpm), Docker dev, estrutura apps/web+api, Prisma inicial, Tailwind + tokens P1, CI base (lint/typecheck). |
| **Sprint 1** | Auth + RBAC + Cadastros base | Login/JWT/refresh, roles/permissões, Users, Customers, Motorcycles, PartCategories, Parts, Suppliers, ServiceCatalog, Collaborators/Mechanics. Telas de cadastros básicas com DataTable P1. |
| **Sprint 2** | OS ponta-a-ponta (núcleo) | ServiceOrders (CRUD + status), Kanban/Lista P1, check-in com checklist+fotos, itens mão de obra/peças, atribuição mecânico/baia, PDF da OS. |
| **Sprint 3** | Orçamentos + Aprovação digital | Budgets, envio de link, aprovação total/parcial/reprovação (cliente logado), invalidação ao alterar, versão de orçamento. Portal do cliente (login próprio) — visão mínima. |
| **Sprint 4** | Estoque + Preventiva por km (diferencial) | Inventory (entradas/saídas/baixa por OS), alertas mínimos, MaintenancePlans + MaintenanceReminders, cálculo de status por km, tela `/preventiva` P1. |
| **Sprint 5** | Garantia + Notificações + Agendamento | Warranty por item, abstração de notificações + e-mail real, Appointments (agenda por baia/mecânico), lembretes de revisão. |
| **Sprint 6** | Dashboard/Relatórios + Testes + Hardening | Dashboard P1 completo, relatórios essenciais (CSV/PDF), unitários+integração+E2E críticos, acessibilidade (axe), ajustes de UX P1, preparação UAT com oficina parceira. |

---

## 15. CRITÉRIOS DE QUALIDADE E ENTREGÁVEIS DO TCC

| Entregável (PRD §14) | Status/Como |
|---|---|
| PRD (com RF/RN/RNF) | Já existente; manter coerente com escopo enxuto. |
| Casos de uso (UML) + BPMN do fluxo de OS | Gerar a partir do fluxo (check-in → diagnóstico → orçamento → aprovação → execução → finalização → entrega). |
| ERD + OpenAPI | Prisma schema → ERD (dbdiagram/prisma-erd) + Swagger (`@nestjs/swagger`). |
| Protótipo Figma | Opcional: extrair do P1 (tokens já definidos) para evolução. Protótipos HTML já existem. |
| Implementação web (Next.js + NestJS + PostgreSQL) | Seguir roadmap acima, fidelidade total ao P1. |
| Testes básicos | Unitários críticos + E2E fluxo principal + axe-core. |
| Manual do usuário | Baseado nas telas P1 (navegação por grupos, Kanban, preventiva por km). |
| Apresentação | Destacar diferencial (preventiva por km), UX simples/intuitiva (P1) e viabilidade solo. |

---

## 16. RISCOS E MITIGAÇÕES (ESPECÍFICOS AO P1)

| Risco | Mitigação |
|---|---|
| Sidebar escura com muitos itens (crescimento Fase 2) | Navegação por grupos já definida; pode evoluir p/ seções colapsáveis ou manter estrutura organizada. P1 favorece escalabilidade vs topnav. |
| Tabelas densas em telas menores | Scroll horizontal + paginação/filtragem + colunas essenciais. Responsividade mapeada. |
| Kanban vs Lista (adoção) | Segment control claro ("Kanban/Lista") em Atendimentos (OS); ambos acessíveis por teclado. |
| Adoção por mecânicos (mobile/pátio) | Layout desktop-first mas responsivo; botões ≥44px, foco visível, leitura clara. Considerar PWA opcional futuramente. |
| Complexidade de preventiva por km | Implementar cálculo simples e transparente (lastKm + intervalKm vs currentKm) com 3 estados (ok/próximo/vencido) e barras de progresso — fácil de auditar. |

---

## 17. CONCLUSÃO

O **P1 (Oficina Pro)** é a escolha técnica mais acertada para este TCC: oferece **clareza, previsibilidade e curva de aprendizado baixa** para todos os perfis, mantém o **Kanban disponível onde faz sentido** (sem poluir o shell), segue padrões de ERP consolidados, facilita a escalabilidade para Fase 2 e atende integralmente aos requisitos de acessibilidade e usabilidade.

O presente documento fornece todas as diretrizes necessárias para implementar o sistema com **fidelidade total ao design escolhido**, respeitando o PRD, priorizando o MVP enxuto e profundo e viabilizando a entrega dentro do escopo de desenvolvimento solo.