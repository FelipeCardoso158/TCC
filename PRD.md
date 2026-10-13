# PRD — Sistema de Gerenciamento para Oficina de Motocicletas

**Versão:** 1.0  
**Status:** Rascunho (TCC)  
**Escopo de implantação:** Mono-tenant (uma oficina)  
**Plataforma:** Web responsiva (mobile-first)  
**Stack alvo:** Next.js + NestJS + PostgreSQL  

---

## 1. Visão, objetivos e sucesso

### 1.1 Visão
Centralizar e digitalizar a operação de uma oficina de motocicletas de médio porte,
aumentando a produtividade da equipe, a transparência para o cliente e o faturamento,
por meio de um sistema web responsivo acessível via navegador (celular/desktop).

### 1.2 Problema
Oficinas de médio porte ainda operam com anotações em papel/planilhas, causando:
perda de informação, atrasos, erros de faturamento, orçamentos lentos, estoque desorganizado
e ausência de métricas.

### 1.3 Objetivos de negócio
1. Eliminar controles manuais de OS, estoque e clientes.
2. Reduzir tempo de busca e atrasos de entrega.
3. Aumentar taxa de aprovação de orçamentos (aprovação digital).
4. Aumentar fidelização (portal do cliente + notificações).
5. Gerar métricas de receita, produtividade e estoque.

### 1.4 Métricas de sucesso (KPIs)
- Tempo médio de aprovação de orçamento.
- Ticket médio por OS.
- Produtividade (horas produtivas por mecânico).
- Giro de estoque e itens críticos.
- Taxa de cancelamento/no-show de agendamentos.
- NPS/satisfação pós-serviço.

---

## 2. Público-alvo e personas

- **Oficina de médio porte:** 4–10 funcionários, várias baias, loja de peças/acessórios.

| Persona | Responsabilidades principais |
|---|---|
| Gerente/Admin | Cadastros, estoque, financeiro, relatórios, configurações, usuários |
| Recepção | Abrir OS, agendamento, atendimento, orçamentos |
| Mecânico | Executar OS, registrar tempo/peças, atualizar status |
| Cliente | Consultar status/histórico, aprovar orçamento, agendar, receber notificações |

---

## 3. Escopo

### 3.1 No MVP (TCC)
Autenticação/RBAC, cadastros (cliente, moto, serviços, peças, fornecedores, colaboradores),
OS completa (com fotos/laudo, status, mecânico/baia, tempo, PDF/assinatura),
orçamento com aprovação digital, estoque básico, agendamento, portal do cliente,
financeiro básico (contas a receber/pagar, fluxo, caixa/PDV), comissão fixa por serviço,
garantia e manutenção preventiva, notificações (WhatsApp/e-mail), dashboard e relatórios.

### 3.2 Fora do MVP (Fase 2)
NF-e/NFS-e, multi-filial/multi-tenant, pagamento online completo (gateway),
marketing/campanhas, DVI avançado, integração ERP contábil, APIs de catálogo de peças.

---

## 4. Requisitos funcionais

### 4.1 Autenticação e RBAC
- **RF-01** Login por e-mail/senha (JWT).
- **RF-02** Recuperação de senha.
- **RF-03** Perfis: admin, recepção, mecânico, cliente.
- **RF-04** Permissões por perfil (RBAC).
- **RF-05** Auditoria de ações críticas.

### 4.2 Cadastros
- **RF-06** Cadastro de cliente (dados pessoais, contato, consentimento LGPD).
- **RF-07** Cadastro de moto (marca, modelo, ano, placa, chassi, cilindradas, cor, km, fotos) com unicidade por placa/chassi.
- **RF-08** Catálogo de serviços (nome, descrição, tempo padrão, preço).
- **RF-09** Peças/produtos (SKU, categoria, marca, unidade, custo, preço, estoque mínimo, localização).
- **RF-10** Fornecedores.
- **RF-11** Colaboradores (especialidades, comissão).

### 4.3 Ordens de Serviço (OS)
- **RF-12** Criar OS a partir de agendamento/check-in.
- **RF-13** Registrar quilometragem manual na abertura/fechamento.
- **RF-14** Diagnóstico + anexos (fotos/laudo).
- **RF-15** Itens de mão de obra e peças com valores.
- **RF-16** Status: Orçamento → Aguardando aprovação → Aprovado → Em execução → Aguardando peça → Pronto → Entregue/Cancelado.
- **RF-17** Atribuição de mecânico e baia.
- **RF-18** Reserva de peças por OS; baixa de estoque ao finalizar.
- **RF-19** Registro de tempo (início/fim por mecânico).
- **RF-20** Assinatura digital do cliente.
- **RF-21** Geração de PDF/impressão.
- **RF-22** Histórico/auditoria de status.

### 4.4 Orçamento e aprovação digital
- **RF-23** Cálculo automático (mão de obra + peças + descontos).
- **RF-24** Envio de link por WhatsApp/e-mail.
- **RF-25** Aprovação total ou parcial; reprovação com motivo.
- **RF-26** Validade do orçamento (data).
- **RF-27** Alteração do orçamento invalida aprovação prévia.

### 4.5 Estoque
- **RF-28** Entradas e saídas (manual e por OS).
- **RF-29** Alerta de estoque mínimo/ponto de pedido.
- **RF-30** Pedido de compra e recebimento.
- **RF-31** Devolução de peças.
- **RF-32** Inventário/ciclo (contagem).

### 4.6 Agendamento
- **RF-33** Calendário por mecânico/baia (drag-and-drop).
- **RF-34** Booking online pelo cliente.
- **RF-35** Status (confirmado, cancelado, no-show).
- **RF-36** Lembretes automáticos (WhatsApp/e-mail).

### 4.7 Portal do cliente
- **RF-37** Consultar status e histórico de OS.
- **RF-38** Aprovar/reprovar orçamento online.
- **RF-39** Agendar serviço online.
- **RF-40** Receber notificações.

### 4.8 Financeiro básico
- **RF-41** Contas a receber vinculadas à OS (vista/parcelado).
- **RF-42** Contas a pagar (fornecedores).
- **RF-43** Fluxo de caixa diário/mensal.
- **RF-44** Caixa/PDV (venda de peças/acessórios).
- **RF-45** Formas de pagamento: dinheiro, PIX, cartão, boleto.
- **RF-46** Comissão fixa por serviço ao mecânico, calculada ao finalizar OS.

### 4.9 Garantia e manutenção preventiva
- **RF-47** Garantia por item (data/km de fim) + alertas.
- **RF-48** Planos de manutenção preventiva por modelo/km.
- **RF-49** Lembretes automáticos (troca de óleo/revisão).

### 4.10 Relatórios e dashboard
- **RF-50** Dashboard: faturamento do dia/mês, OS por status, produtividade, ticket médio, estoque crítico, clientes ativos.
- **RF-51** Relatórios: vendas, OS, estoque, comissões, inadimplência.
- **RF-52** Exportação CSV/PDF.

---

## 5. Regras de negócio

- **RN-01** Moto única no sistema (por placa/chassi).
- **RN-02** Estoque não pode ficar negativo ao finalizar OS (bloqueio, salvo autorização do gerente).
- **RN-03** Alteração de orçamento invalida aprovação anterior.
- **RN-04** Comissão calculada apenas quando a OS for finalizada/entregue.
- **RN-05** Peça baixada ao finalizar a OS; reserva feita ao iniciar; cancelamento reverte reserva.
- **RN-06** Quilometragem atualizada manualmente na abertura/fechamento da OS.
- **RN-07** Cliente deve consentir comunicação WhatsApp (LGPD).
- **RN-08** Aprovação parcial gera nova versão do orçamento.

---

## 6. Requisitos não funcionais

- **RNF-01** Web responsivo, mobile-first.
- **RNF-02** HTTPS e dados sensíveis criptografados.
- **RNF-03** RBAC + JWT.
- **RNF-04** Auditoria de ações críticas.
- **RNF-05** Disponibilidade 24/7 e backup automático (diário).
- **RNF-06** Performance com paginação e busca indexada.
- **RNF-07** Logs/observabilidade.
- **RNF-08** Escalabilidade horizontal (containers).
- **RNF-09** Acessibilidade básica (WCAG AA).
- **RNF-10** LGPD: consentimento, minimização, direito de exclusão e retenção.

---

## 7. Integrações

- **WhatsApp Business API** (notificações e aprovação de orçamento).
- Fase 2: gateway de pagamento (PIX/cartão), NF-e/NFS-e, ERP contábil, catálogo de peças.

---

## 8. Modelo de dados (entidades centrais)

`User`, `Role`, `Permission`, `Customer`, `Motorcycle`, `ServiceCatalog`, `Part`, `PartCategory`,
`Supplier`, `ServiceOrder`, `ServiceOrderItem`, `StatusHistory`, `Appointment`, `Bay`, `Mechanic`,
`Commission`, `Payment`, `Warranty`, `MaintenancePlan`, `Notification`, `AuditLog`, `Attachment`.

### 8.1 Relacionamentos-chave (resumo)
- `Customer` 1..* `Motorcycle`
- `Motorcycle` 1..* `ServiceOrder`
- `ServiceOrder` 1..* `ServiceOrderItem` (labor/part)
- `ServiceOrder` 1..* `StatusHistory`
- `Part` *..1 `Supplier` (padrão)
- `Mechanic` 1..* `Commission` (por `ServiceOrderItem`)
- `ServiceOrder` 1..* `Payment`

---

## 9. Fluxo principal de OS

1. Check-in (cliente/moto, km, queixa).
2. Diagnóstico + itens (serviços/peças) + fotos.
3. Orçamento gerado e enviado (WhatsApp/e-mail).
4. Aprovação do cliente (total/parcial).
5. Execução (mecânico, tempo, status).
6. Finalização (baixa de estoque, cálculo de comissão).
7. Entrega + pagamento + avaliação.

---

## 10. Arquitetura recomendada (TCC)

- **Frontend:** Next.js (React) + TypeScript, UI responsiva, PWA opcional.
- **Backend:** NestJS (REST) + TypeScript, módulos por domínio.
- **Banco:** PostgreSQL + ORM (Prisma/TypeORM), migrações versionadas.
- **Infra:** Docker + docker-compose; CI/CD; storage S3/MinIO; Redis (filas/notificações).
- **Autenticação:** JWT + refresh token; RBAC via guards.
- **Observabilidade:** logs estruturados, health checks.

---

## 11. Roadmap

| Fase | Entregas |
|---|---|
| MVP (TCC) | RF-01..RF-52 (exceto Fase 2), integração WhatsApp, portal de aprovação |
| Fase 2 | Pagamento online, NF-e/NFS-e, multi-filial, marketing, DVI avançado, ERP |

### 11.1 Sequência sugerida de implementação
1. Autenticação + RBAC + cadastros base.
2. OS ponta a ponta (sem integrações).
3. Estoque + agendamento.
4. Portal do cliente + orçamento digital.
5. Financeiro + comissões.
6. Garantia/preventiva + notificações.
7. Dashboard/relatórios + testes.

---

## 12. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Escopo grande para TCC | Priorizar MVP e explicitar Fase 2 |
| Integração WhatsApp complexa | Usar mocks/placeholders e templates oficiais |
| Erros de concorrência de estoque | RN-02/RN-05 e testes de cancelamento |
| Usabilidade mobile | Prototipação no Figma e testes com oficina |
| Performance em listagens | Paginação e índices desde o início |

---

## 13. Plano de testes (mínimo)

- **Unitários:** serviços de domínio (cálculo de orçamento, comissão, estoque).
- **Integração:** rotas de API (auth, OS, estoque).
- **E2E:** fluxo de OS (criação → aprovação → execução → finalização → entrega).
- **UAT:** testes com oficina de estudo de caso (Anexo de teste de usuários).

### Critérios de aceite (exemplo)
- OS não pode ser finalizada com estoque negativo sem autorização.
- Orçamento alterado perde aprovação.
- Cliente consegue aprovar orçamento via link.
- Comissão aparece após finalização.
- Dashboard exibe faturamento do mês.

---

## 14. Entregáveis do TCC

- PRD (este documento) com RF/RN/RNF.
- Casos de uso (UML) e BPMN do fluxo de OS.
- ERD e OpenAPI.
- Protótipo Figma.
- Implementação web (Next.js + NestJS + PostgreSQL).
- Testes básicos.
- Manual do usuário e apresentação.

---

## 15. Histórico de versões

| Versão | Data | Autor | Descrição |
|---|---|---|---|
| 1.0 | 2026-10-13 | Aluno | Versão inicial consolidada a partir de pesquisa e questionário |

---

## Anexo A — Checklist de validação com a oficina
- [ ] Cadastro real de clientes/motos importado.
- [ ] 5 OS completas executadas em homologação.
- [ ] Aprovação digital testada com cliente real.
- [ ] Estoque reconciliado (contagem física x sistema).
- [ ] Relatórios conferidos com extrato manual.
