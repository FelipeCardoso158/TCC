/* =====================================================================
   SGOM — Dados ficticios de demonstracao (oficina "Rota 45 Motos")
   Nenhuma informacao pessoal real. Uso exclusivo em prototipo.
   ===================================================================== */
window.SGOM = {
  shop: { name: "Rota 45 Motos", tagline: "Oficina & Peças", cnpj: "12.345.678/0001-90" },

  currentUser: { name: "Carlos Menezes", role: "Gerente", initials: "CM" },

  statuses: {
    rascunho:   { label: "Rascunho", cls: "s-rascunho" },
    orcamento:  { label: "Orçamento", cls: "s-rascunho" },
    aguardando: { label: "Aguardando aprovação", cls: "s-aguardando" },
    aprovado:   { label: "Aprovado", cls: "s-aprovado" },
    execucao:   { label: "Em execução", cls: "s-execucao" },
    peca:       { label: "Aguardando peça", cls: "s-peca" },
    pronto:     { label: "Pronto", cls: "s-pronto" },
    entregue:   { label: "Entregue", cls: "s-entregue" },
    cancelado:  { label: "Cancelado", cls: "s-cancelado" },
    reprovado:  { label: "Reprovado", cls: "s-reprovado" }
  },

  kpis: {
    faturamentoMes: 48760,
    osAbertas: 7,
    ticketMedio: 312,
    pecasCriticas: 3,
    preventivasVencidas: 2,
    ocupacaoBaias: 75,
    clientesAtivos: 128,
    agendamentosHoje: 4
  },

  mechanicLoad: [
    { name: "Rafael Lima",   short: "Rafa",  os: 32, productivity: 86, color: "#f97316" },
    { name: "Bruno Tavares", short: "Bruno", os: 28, productivity: 74, color: "#2563eb" },
    { name: "Diego Moreira", short: "Diego", os: 19, productivity: 61, color: "#16a34a" }
  ],

  osByStatus: [
    { key: "orcamento",  label: "Orçamento" },
    { key: "aguardando", label: "Aguardando aprovação" },
    { key: "execucao",   label: "Em execução" },
    { key: "peca",       label: "Aguardando peça" },
    { key: "pronto",     label: "Pronto" }
  ],

  orders: [
    {
      id: "OS-1042", status: "execucao", customer: "Marcos Andrade", phone: "(11) 99876-4321",
      bike: "Honda CG 160 Titan", year: 2021, plate: "ABC-1D23", km: 42350, cc: 160, motor: "4T",
      complaint: "Troca de óleo e kit relação", mechanic: "Rafael Lima", bay: "Baia 01",
      value: 371, opened: "15/10 08:20", promise: "hoje 17:00",
      items: [
        { kind: "Serviço", desc: "Troca de óleo e filtro", qty: 1, value: 60 },
        { kind: "Serviço", desc: "Troca de kit relação", qty: 1, value: 120 },
        { kind: "Peça", desc: "Óleo Motul 5100 10W40 (1L)", qty: 1.5, value: 62 },
        { kind: "Peça", desc: "Kit relação CG 160", qty: 1, value: 189 }
      ]
    },
    {
      id: "OS-1041", status: "peca", customer: "Patrícia Nunes", phone: "(11) 99123-8890",
      bike: "Yamaha Fazer 250", year: 2019, plate: "XYZ-9K87", km: 68120, cc: 250, motor: "4T",
      complaint: "Revisão completa, ruído na relação", mechanic: "Bruno Tavares", bay: "Baia 03",
      value: 468, opened: "14/10 14:10", promise: "aguardando peça",
      items: [
        { kind: "Serviço", desc: "Revisão completa", qty: 1, value: 220 },
        { kind: "Peça", desc: "Kit relação Fazer 250", qty: 1, value: 248 }
      ]
    },
    {
      id: "OS-1040", status: "aguardando", customer: "Fernanda Rocha", phone: "(11) 98800-1122",
      bike: "Honda XRE 300", year: 2020, plate: "RTY-4T56", km: 55780, cc: 300, motor: "4T",
      complaint: "Freio dianteiro mole", mechanic: "—", bay: "—",
      value: 255, opened: "15/10 09:05", promise: "aguardando aprovação",
      items: [
        { kind: "Serviço", desc: "Troca de pastilha de freio", qty: 1, value: 70 },
        { kind: "Serviço", desc: "Sangria do freio", qty: 1, value: 95 },
        { kind: "Peça", desc: "Pastilha de freio dianteira", qty: 1, value: 45 },
        { kind: "Peça", desc: "Fluido DOT 4", qty: 0.5, value: 90 }
      ]
    },
    {
      id: "OS-1039", status: "pronto", customer: "João Batista", phone: "(11) 97777-3344",
      bike: "Honda Biz 125", year: 2022, plate: "QWE-2R34", km: 31900, cc: 125, motor: "4T",
      complaint: "Troca de óleo", mechanic: "Rafael Lima", bay: "Baia 02",
      value: 122, opened: "15/10 07:40", promise: "pronta para retirada",
      items: [
        { kind: "Serviço", desc: "Troca de óleo e filtro", qty: 1, value: 60 },
        { kind: "Peça", desc: "Óleo Motul 5100 10W40 (1L)", qty: 1, value: 62 }
      ]
    },
    {
      id: "OS-1038", status: "orcamento", customer: "Diego Santos", phone: "(11) 96666-2211",
      bike: "Yamaha Factor 150", year: 2023, plate: "PLM-7G89", km: 12410, cc: 150, motor: "4T",
      complaint: "Revisão de 10.000 km", mechanic: "—", bay: "—",
      value: 490, opened: "15/10 10:30", promise: "orçamento",
      items: [
        { kind: "Serviço", desc: "Revisão completa", qty: 1, value: 220 },
        { kind: "Serviço", desc: "Regulagem de válvulas", qty: 1, value: 150 },
        { kind: "Peça", desc: "Óleo Motul 5100 10W40 (1L)", qty: 1, value: 62 },
        { kind: "Peça", desc: "Vela de ignição NGK", qty: 1, value: 24 }
      ]
    },
    {
      id: "OS-1037", status: "entregue", customer: "Marcos Andrade", phone: "(11) 99876-4321",
      bike: "Honda CG 160 Titan", year: 2021, plate: "ABC-1D23", km: 41000, cc: 160, motor: "4T",
      complaint: "Regulagem de válvulas", mechanic: "Rafael Lima", bay: "Baia 01",
      value: 210, opened: "10/10 11:00", promise: "entregue",
      items: [{ kind: "Serviço", desc: "Regulagem de válvulas", qty: 1, value: 210 }]
    }
  ],

  budgets: [
    { id: "ORC-1040", order: "OS-1040", customer: "Fernanda Rocha", bike: "Honda XRE 300", plate: "RTY-4T56", value: 255, status: "aguardando", validUntil: "20/10/2026", version: "v1", sentAt: "15/10 09:12" },
    { id: "ORC-1041", order: "OS-1041", customer: "Patrícia Nunes", bike: "Yamaha Fazer 250", plate: "XYZ-9K87", value: 468, status: "aprovado", validUntil: "19/10/2026", version: "v1", sentAt: "14/10 14:40" },
    { id: "ORC-1038", order: "OS-1038", customer: "Diego Santos", bike: "Yamaha Factor 150", plate: "PLM-7G89", value: 490, status: "orcamento", validUntil: "22/10/2026", version: "v1", sentAt: "—" },
    { id: "ORC-1035", order: "OS-1035", customer: "João Batista", bike: "Honda Biz 125", plate: "QWE-2R34", value: 340, status: "reprovado", validUntil: "12/10/2026", version: "v2", sentAt: "09/10 16:20" }
  ],

  parts: [
    { sku: "LUB-001", name: "Óleo Motul 5100 10W40 (1L)", cat: "Lubrificantes", brand: "Motul", app: "Universal 4T", qty: 24, min: 10, cost: 41, price: 62, loc: "A2" },
    { sku: "FLT-014", name: "Filtro de óleo Honda CG", cat: "Filtros", brand: "Tecfil", app: "CG 125/150/160", qty: 6, min: 8, cost: 18, price: 28, loc: "A3" },
    { sku: "KIT-160", name: "Kit relação CG 160", cat: "Transmissão", brand: "Did", app: "CG 160 2016+", qty: 3, min: 5, cost: 122, price: 189, loc: "B1" },
    { sku: "KIT-250", name: "Kit relação Fazer 250", cat: "Transmissão", brand: "Vaz", app: "Fazer 250", qty: 5, min: 4, cost: 165, price: 248, loc: "B2" },
    { sku: "FRE-220", name: "Pastilha de freio dianteira", cat: "Freios", brand: "Cobreq", app: "CG/Titan/Fan", qty: 12, min: 6, cost: 29, price: 45, loc: "C1" },
    { sku: "IGN-009", name: "Vela de ignição NGK", cat: "Ignição", brand: "NGK", app: "Universal 4T", qty: 30, min: 12, cost: 15, price: 24, loc: "C2" },
    { sku: "PNE-090", name: "Pneu traseiro 90/90-18", cat: "Pneus", brand: "Pirelli", app: "Aro 18", qty: 8, min: 4, cost: 142, price: 210, loc: "D1" },
    { sku: "CAM-090", name: "Câmara de ar 90/90-18", cat: "Pneus", brand: "Levorin", app: "Aro 18", qty: 15, min: 8, cost: 20, price: 32, loc: "D2" },
    { sku: "BAT-012", name: "Bateria 12V 5Ah", cat: "Elétrica", brand: "Moura", app: "125–160cc", qty: 4, min: 5, cost: 118, price: 175, loc: "E1" },
    { sku: "OLE-FRK", name: "Fluido de freio DOT 4 (500ml)", cat: "Freios", brand: "Bosch", app: "Universal", qty: 9, min: 4, cost: 22, price: 38, loc: "C3" }
  ],

  customers: [
    { name: "Marcos Andrade", cpf: "***.482.910-**", phone: "(11) 99876-4321", email: "marcos.a@email.com", city: "São Paulo/SP", since: "2021", lgpd: true, bikes: 1,
      bikeList: [{ plate: "ABC-1D23", model: "Honda CG 160 Titan", year: 2021, km: 42350 }] },
    { name: "Patrícia Nunes", cpf: "***.117.455-**", phone: "(11) 99123-8890", email: "patricia.n@email.com", city: "São Paulo/SP", since: "2019", lgpd: true, bikes: 1,
      bikeList: [{ plate: "XYZ-9K87", model: "Yamaha Fazer 250", year: 2019, km: 68120 }] },
    { name: "João Batista", cpf: "***.903.221-**", phone: "(11) 97777-3344", email: "joao.batista@email.com", city: "Osasco/SP", since: "2022", lgpd: true, bikes: 1,
      bikeList: [{ plate: "QWE-2R34", model: "Honda Biz 125", year: 2022, km: 31900 }] },
    { name: "Fernanda Rocha", cpf: "***.674.008-**", phone: "(11) 98800-1122", email: "fernanda.r@email.com", city: "São Paulo/SP", since: "2020", lgpd: false, bikes: 1,
      bikeList: [{ plate: "RTY-4T56", model: "Honda XRE 300", year: 2020, km: 55780 }] },
    { name: "Diego Santos", cpf: "***.255.640-**", phone: "(11) 96666-2211", email: "diego.santos@email.com", city: "Guarulhos/SP", since: "2023", lgpd: true, bikes: 1,
      bikeList: [{ plate: "PLM-7G89", model: "Yamaha Factor 150", year: 2023, km: 12410 }] }
  ],

  services: [
    { code: "SRV-01", name: "Troca de óleo e filtro", time: "30 min", price: 60 },
    { code: "SRV-02", name: "Troca de kit relação", time: "1 h", price: 120 },
    { code: "SRV-03", name: "Revisão completa", time: "2 h", price: 220 },
    { code: "SRV-04", name: "Troca de pastilha de freio", time: "40 min", price: 70 },
    { code: "SRV-05", name: "Regulagem de válvulas", time: "1 h 30", price: 150 },
    { code: "SRV-06", name: "Troca de pneu", time: "40 min", price: 55 },
    { code: "SRV-07", name: "Sangria de freio", time: "30 min", price: 95 },
    { code: "SRV-08", name: "Lavagem técnica", time: "30 min", price: 40 }
  ],

  /* Diferencial: manutenção preventiva por quilometragem */
  preventive: [
    { plate: "ABC-1D23", customer: "Marcos Andrade", model: "Honda CG 160 Titan", item: "Troca de óleo e filtro", lastKm: 38000, intervalKm: 4000, currentKm: 42350, dueKm: 42000, status: "vencido" },
    { plate: "XYZ-9K87", customer: "Patrícia Nunes", model: "Yamaha Fazer 250", item: "Troca de kit relação", lastKm: 40000, intervalKm: 26000, currentKm: 68120, dueKm: 66000, status: "vencido" },
    { plate: "QWE-2R34", customer: "João Batista", model: "Honda Biz 125", item: "Troca de óleo e filtro", lastKm: 29000, intervalKm: 4000, currentKm: 31900, dueKm: 33000, status: "proximo" },
    { plate: "RTY-4T56", customer: "Fernanda Rocha", model: "Honda XRE 300", item: "Lubrificação da corrente", lastKm: 54800, intervalKm: 1000, currentKm: 55780, dueKm: 55800, status: "proximo" },
    { plate: "PLM-7G89", customer: "Diego Santos", model: "Yamaha Factor 150", item: "Troca de óleo e filtro", lastKm: 11000, intervalKm: 4000, currentKm: 12410, dueKm: 15000, status: "ok" },
    { plate: "ABC-1D23", customer: "Marcos Andrade", model: "Honda CG 160 Titan", item: "Vela de ignição", lastKm: 30000, intervalKm: 12000, currentKm: 42350, dueKm: 42000, status: "vencido" }
  ],

  warranty: [
    { order: "OS-1037", customer: "Marcos Andrade", plate: "ABC-1D23", item: "Regulagem de válvulas", type: "Serviço", start: "10/10/2026", endKm: 45000, endDate: "10/01/2027", status: "ativa" },
    { order: "OS-1032", customer: "Patrícia Nunes", plate: "XYZ-9K87", item: "Bateria 12V 5Ah", type: "Peça", start: "02/09/2026", endKm: null, endDate: "02/09/2027", status: "ativa" },
    { order: "OS-1028", customer: "João Batista", plate: "QWE-2R34", item: "Kit relação CG 160", type: "Peça", start: "18/07/2026", endKm: 36000, endDate: "18/01/2027", status: "ativa" }
  ],

  appointments: [
    { time: "09:00", customer: "Diego Santos", service: "Revisão de 10.000 km", bay: "Baia 02", mechanic: "Bruno Tavares", status: "confirmado" },
    { time: "10:30", customer: "Patrícia Nunes", service: "Troca de pneu", bay: "Baia 01", mechanic: "Rafael Lima", status: "confirmado" },
    { time: "14:00", customer: "Lucas Ferreira (novo)", service: "Diagnóstico elétrico", bay: "Baia 03", mechanic: "Diego Moreira", status: "confirmado" },
    { time: "16:30", customer: "Marcos Andrade", service: "Retirada / entrega", bay: "—", mechanic: "—", status: "pendente" }
  ],

  notifications: [
    { title: "Estoque crítico", text: "3 peças abaixo do mínimo (Filtro CG, Kit relação CG 160, Bateria 12V).", when: "há 12 min", kind: "warn" },
    { title: "Orçamento enviado", text: "ORC-1040 (Fernanda Rocha) enviado por WhatsApp/e-mail. Aguardando aprovação.", when: "há 1 h", kind: "info" },
    { title: "Preventiva vencida", text: "ABC-1D23: troca de óleo vencida há 350 km.", when: "há 2 h", kind: "warn" },
    { title: "OS finalizada", text: "OS-1039 (João Batista) pronta para retirada.", when: "há 3 h", kind: "ok" }
  ],

  revenueSeries: [62, 74, 58, 81, 90, 76, 95]  // % do faturamento por dia (semana)
};
