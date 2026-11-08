/* =====================================================================
   SGOM - Sistema de Gerenciamento para Oficina de Motos
   dados.js - dados de exemplo (pequenos) + persistencia no navegador.

   Nada aqui precisa de banco de dados. Tudo fica no localStorage.
   Para "resetar" o sistema, clique em "Restaurar dados de exemplo".
   ===================================================================== */
function sgomDateOffset(offsetDays) {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  var m = String(d.getMonth() + 1);
  var day = String(d.getDate());
  return d.getFullYear() + "-" + (m.length < 2 ? "0" + m : m) + "-" + (day.length < 2 ? "0" + day : day);
}
function sgomDateTimeOffset(offsetDays, time) {
  return sgomDateOffset(offsetDays) + "T" + time + ":00";
}

window.SGOM_SEED = {
  app: {
    name: "SGOM",
    full: "Sistema de Gerenciamento para Oficina de Motos"
  },

  users: [
    { id: "u1", name: "Carlos Mendes", email: "funcionario@sgom", password: "sgom123", role: "FUNCIONARIO" },
    { id: "u2", name: "João Pereira", email: "joao@email.com", password: "123", role: "CLIENTE", customerId: "c1" }
  ],

  customers: [
    { id: "c1", name: "João Pereira",  email: "joao@email.com",  phone: "(11) 98888-1111", doc: "123.456.789-00", address: "Rua das Flores, 120", lgpd: true },
    { id: "c2", name: "Maria Souza",   email: "maria@email.com", phone: "(11) 97777-2222", doc: "987.654.321-00", address: "Av. Central, 45",     lgpd: true },
    { id: "c3", name: "Pedro Alves",   email: "pedro@email.com", phone: "(11) 96666-3333", doc: "456.789.123-00", address: "Rua do Mercado, 9",  lgpd: false }
  ],

  motorcycles: [
    { id: "m1", customerId: "c1", brand: "Honda",  model: "CG 160 Fan",   year: 2022, plate: "ABC1D23", chassi: "9C2KC1670NR000001", cc: 160, color: "Vermelha", km: 24500 },
    { id: "m2", customerId: "c2", brand: "Yamaha", model: "Fazer FZ25",   year: 2021, plate: "XYZ9K88", chassi: "9C6RG3310M0000002", cc: 250, color: "Azul",     km: 18200 },
    { id: "m3", customerId: "c3", brand: "Honda",  model: "Biz 125",      year: 2023, plate: "QWE4R55", chassi: "9C2JC4110PR000003", cc: 125, color: "Preta",    km: 8100 }
  ],

  services: [
    { id: "s1", code: "SV-001", name: "Troca de óleo",             price: 80,  timeStd: 30 },
    { id: "s2", code: "SV-002", name: "Revisão geral",             price: 250, timeStd: 180 },
    { id: "s3", code: "SV-003", name: "Troca de pastilha de freio", price: 120, timeStd: 45 },
    { id: "s4", code: "SV-004", name: "Regulagem de válvulas",     price: 180, timeStd: 120 },
    { id: "s5", code: "SV-005", name: "Troca de relação (kit)",    price: 150, timeStd: 90 },
    { id: "s6", code: "SV-006", name: "Limpeza de injeção",        price: 130, timeStd: 60 }
  ],

  parts: [
    { id: "p1", sku: "OLEO-10W30",   name: "Óleo motor 10W30 (1L)",   brand: "Mobil", unit: "UN", price: 45,  cost: 28,  qty: 20, minQty: 5, location: "A1" },
    { id: "p2", sku: "FILTRO-CG160", name: "Filtro de óleo CG160",    brand: "Tecfil", unit: "UN", price: 35, cost: 22,  qty: 8,   minQty: 4, location: "A2" },
    { id: "p3", sku: "PAST-FREIO-D", name: "Pastilha de freio dianteira", brand: "Cobreq", unit: "UN", price: 90, cost: 55, qty: 3, minQty: 4, location: "B1" },
    { id: "p4", sku: "KIT-REL-CG160",name: "Kit relação CG160",       brand: "Vaz",   unit: "UN", price: 160, cost: 110, qty: 2,   minQty: 2, location: "B2" },
    { id: "p5", sku: "VELA-NGK",     name: "Vela de ignição",         brand: "NGK",   unit: "UN", price: 28, cost: 16,  qty: 15,  minQty: 6, location: "C1" },
    { id: "p6", sku: "CABO-EMB",     name: "Cabo de embreagem",       brand: "Original", unit: "UN", price: 40, cost: 24, qty: 1, minQty: 3, location: "C2" },
    { id: "p7", sku: "BAT-12V",      name: "Bateria 12V 5Ah",         brand: "Yuasa", unit: "UN", price: 320, cost: 240, qty: 4,   minQty: 2, location: "D1" },
    { id: "p8", sku: "PNEU-9090",    name: "Pneu traseiro 90/90-18",  brand: "Pirelli", unit: "UN", price: 210, cost: 150, qty: 2, minQty: 2, location: "D2" }
  ],

  orders: [
    {
      id: "o1", number: "OS-1001", customerId: "c1", motorcycleId: "m1",
      status: "ENTREGUE", kmEntry: 24500, complaint: "Troca de óleo e revisão",
      discount: 0, reserved: false,
      createdAt: sgomDateTimeOffset(-1, "09:10"), startedAt: sgomDateTimeOffset(-1, "09:30"),
      finishedAt: sgomDateTimeOffset(-1, "11:00"), deliveredAt: sgomDateTimeOffset(0, "15:20"),
      validUntil: sgomDateOffset(2),
      items: [
        { type: "LABOR", refId: "s1", name: "Troca de óleo", qty: 1, unitPrice: 80 },
        { type: "PART",  refId: "p1", name: "Óleo motor 10W30 (1L)", qty: 1, unitPrice: 45 },
        { type: "PART",  refId: "p2", name: "Filtro de óleo CG160", qty: 1, unitPrice: 35 }
      ]
    },
    {
      id: "o2", number: "OS-1002", customerId: "c2", motorcycleId: "m2",
      status: "EM_EXECUCAO", kmEntry: 18200, complaint: "Revisão geral pedida pelo cliente",
      discount: 0, reserved: true,
      createdAt: sgomDateTimeOffset(0, "08:20"), startedAt: sgomDateTimeOffset(0, "08:45"),
      finishedAt: null, deliveredAt: null, validUntil: sgomDateOffset(4),
      items: [
        { type: "LABOR", refId: "s2", name: "Revisão geral", qty: 1, unitPrice: 250 },
        { type: "PART",  refId: "p5", name: "Vela de ignição", qty: 1, unitPrice: 28 }
      ]
    },
    {
      id: "o3", number: "OS-1003", customerId: "c3", motorcycleId: "m3",
      status: "AGUARDANDO_APROVACAO", kmEntry: 8100, complaint: "Freio dianteiro fraco",
      discount: 0, reserved: false,
      createdAt: sgomDateTimeOffset(0, "10:05"), startedAt: null,
      finishedAt: null, deliveredAt: null, validUntil: sgomDateOffset(5),
      items: [
        { type: "LABOR", refId: "s3", name: "Troca de pastilha de freio", qty: 1, unitPrice: 120 },
        { type: "PART",  refId: "p3", name: "Pastilha de freio dianteira", qty: 1, unitPrice: 90 }
      ]
    },
    {
      id: "o4", number: "OS-1004", customerId: "c1", motorcycleId: "m1",
      status: "AGUARDANDO_PECA", kmEntry: 24600, complaint: "Relação barulhenta",
      discount: 0, reserved: true,
      createdAt: sgomDateTimeOffset(-2, "14:00"), startedAt: sgomDateTimeOffset(-2, "14:20"),
      finishedAt: null, deliveredAt: null, validUntil: sgomDateOffset(1),
      items: [
        { type: "LABOR", refId: "s5", name: "Troca de relação (kit)", qty: 1, unitPrice: 150 },
        { type: "PART",  refId: "p4", name: "Kit relação CG160", qty: 1, unitPrice: 160 }
      ]
    },
    {
      id: "o5", number: "OS-1005", customerId: "c2", motorcycleId: "m2",
      status: "ORCAMENTO", kmEntry: 18300, complaint: "Moto falhando em baixa",
      discount: 0, reserved: false,
      createdAt: sgomDateTimeOffset(-10, "09:00"), startedAt: null,
      finishedAt: null, deliveredAt: null, validUntil: sgomDateOffset(-3),
      items: [
        { type: "LABOR", refId: "s6", name: "Limpeza de injeção", qty: 1, unitPrice: 130 }
      ]
    },
    {
      id: "o6", number: "OS-1006", customerId: "c3", motorcycleId: "m3",
      status: "ABERTA", kmEntry: 8200, complaint: "Cliente pediu para avaliar a moto",
      discount: 0, reserved: false,
      createdAt: sgomDateTimeOffset(0, "11:30"), startedAt: null,
      finishedAt: null, deliveredAt: null, validUntil: null,
      items: []
    },
    {
      id: "o7", number: "OS-1007", customerId: "c1", motorcycleId: "m1",
      status: "AGUARDANDO_APROVACAO", kmEntry: 24700, complaint: "Cabo de embreagem duro",
      discount: 0, reserved: false,
      createdAt: sgomDateTimeOffset(0, "14:30"), startedAt: null,
      finishedAt: null, deliveredAt: null, validUntil: sgomDateOffset(30),
      items: [
        { type: "LABOR", refId: "s4", name: "Regulagem de válvulas", qty: 1, unitPrice: 180 },
        { type: "PART",  refId: "p6", name: "Cabo de embreagem", qty: 1, unitPrice: 40 }
      ]
    }
  ],

  appointments: [
    { id: "a1", number: "AG-1001", customerId: "c1", motorcycleId: "m1", date: sgomDateOffset(0),  time: "09:00", status: "CONFIRMADO",     serviceId: "s1", service: "Troca de óleo",             complaint: "Revisão dos 25.000 km", orderId: null, createdAt: sgomDateTimeOffset(-5, "09:00") },
    { id: "a2", number: "AG-1002", customerId: "c2", motorcycleId: "m2", date: sgomDateOffset(0),  time: "10:30", status: "EM_ATENDIMENTO", serviceId: "s2", service: "Revisão geral",              complaint: "Revisão geral pedida pelo cliente", orderId: null, createdAt: sgomDateTimeOffset(-4, "10:00") },
    { id: "a3", number: "AG-1003", customerId: "c3", motorcycleId: "m3", date: sgomDateOffset(0),  time: "14:00", status: "PRE_AGENDADO",  serviceId: "s3", service: "Troca de pastilha de freio", complaint: "Freio dianteiro fraco", orderId: null, createdAt: sgomDateTimeOffset(-3, "11:00") },
    { id: "a4", number: "AG-1004", customerId: "c1", motorcycleId: "m1", date: sgomDateOffset(0),  time: "16:30", status: "PRE_AGENDADO",  serviceId: "s5", service: "Troca de relação (kit)",      complaint: "Relação barulhenta", orderId: null, createdAt: sgomDateTimeOffset(-3, "15:00") },
    { id: "a5", number: "AG-1005", customerId: "c1", motorcycleId: "m1", date: sgomDateOffset(1),  time: "08:30", status: "CONFIRMADO",     serviceId: "s4", service: "Regulagem de válvulas",      complaint: "Motor com ruído", orderId: null, createdAt: sgomDateTimeOffset(-2, "09:00") },
    { id: "a6", number: "AG-1006", customerId: "c2", motorcycleId: "m2", date: sgomDateOffset(1),  time: "16:00", status: "PRE_AGENDADO",  serviceId: "s6", service: "Limpeza de injeção",         complaint: "Moto falhando em baixa", orderId: null, createdAt: sgomDateTimeOffset(-2, "14:00") },
    { id: "a7", number: "AG-1007", customerId: "c3", motorcycleId: "m3", date: sgomDateOffset(-1), time: "11:00", status: "CONCLUIDO",      serviceId: "s3", service: "Troca de pastilha de freio", complaint: "Freio revisado", orderId: null, createdAt: sgomDateTimeOffset(-7, "08:00") },
    { id: "a8", number: "AG-1008", customerId: "c3", motorcycleId: "m3", date: sgomDateOffset(3),  time: "09:30", status: "CONFIRMADO",     serviceId: "s1", service: "Troca de óleo",             complaint: "Troca programada", orderId: null, createdAt: sgomDateTimeOffset(-1, "10:00") },
    { id: "a9", number: "AG-1009", customerId: "c2", motorcycleId: "m2", date: sgomDateOffset(-2), time: "13:30", status: "CONCLUIDO",      serviceId: "s1", service: "Troca de óleo",             complaint: "Troca de óleo concluída", orderId: null, createdAt: sgomDateTimeOffset(-8, "09:00") },
    { id: "a10", number: "AG-1010", customerId: "c1", motorcycleId: "m1", date: sgomDateOffset(7), time: "10:00", status: "PRE_AGENDADO",  serviceId: "s2", service: "Revisão geral",              complaint: "Revisão preventiva", orderId: null, createdAt: sgomDateTimeOffset(0, "08:00") }
  ],

  seq: { order: 1008, appointment: 1011 }
};
