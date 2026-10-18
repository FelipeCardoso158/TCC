/* =====================================================================
   SGOM - Sistema de Gerenciamento para Oficina de Motos
   dados.js - dados de exemplo (pequenos) + persistencia no navegador.

   Nada aqui precisa de banco de dados. Tudo fica no localStorage.
   Para "resetar" o sistema, clique em "Restaurar dados de exemplo".
   ===================================================================== */
window.SGOM_SEED = {
  app: {
    name: "SGOM",
    full: "Sistema de Gerenciamento para Oficina de Motos"
  },

  users: [
    { id: "u1", name: "Carlos Mendes", email: "funcionario@sgom", password: "sgom123", role: "FUNCIONARIO" },
    { id: "u2", name: "Joao Pereira", email: "joao@email.com", password: "123", role: "CLIENTE", customerId: "c1" }
  ],

  customers: [
    { id: "c1", name: "Joao Pereira",  email: "joao@email.com",  phone: "(11) 98888-1111", doc: "123.456.789-00", address: "Rua das Flores, 120", lgpd: true },
    { id: "c2", name: "Maria Souza",   email: "maria@email.com", phone: "(11) 97777-2222", doc: "987.654.321-00", address: "Av. Central, 45",     lgpd: true },
    { id: "c3", name: "Pedro Alves",   email: "pedro@email.com", phone: "(11) 96666-3333", doc: "456.789.123-00", address: "Rua do Mercado, 9",  lgpd: false }
  ],

  motorcycles: [
    { id: "m1", customerId: "c1", brand: "Honda",  model: "CG 160 Fan",   year: 2022, plate: "ABC1D23", chassi: "9C2KC1670NR000001", cc: 160, color: "Vermelha", km: 24500 },
    { id: "m2", customerId: "c2", brand: "Yamaha", model: "Fazer FZ25",   year: 2021, plate: "XYZ9K88", chassi: "9C6RG3310M0000002", cc: 250, color: "Azul",     km: 18200 },
    { id: "m3", customerId: "c3", brand: "Honda",  model: "Biz 125",      year: 2023, plate: "QWE4R55", chassi: "9C2JC4110PR000003", cc: 125, color: "Preta",    km: 8100 }
  ],

  services: [
    { id: "s1", code: "SV-001", name: "Troca de oleo",             price: 80,  timeStd: 30 },
    { id: "s2", code: "SV-002", name: "Revisao geral",             price: 250, timeStd: 180 },
    { id: "s3", code: "SV-003", name: "Troca de pastilha de freio", price: 120, timeStd: 45 },
    { id: "s4", code: "SV-004", name: "Regulagem de valvulas",     price: 180, timeStd: 120 },
    { id: "s5", code: "SV-005", name: "Troca de relacao (kit)",    price: 150, timeStd: 90 },
    { id: "s6", code: "SV-006", name: "Limpeza de injecao",        price: 130, timeStd: 60 }
  ],

  parts: [
    { id: "p1", sku: "OLEO-10W30",   name: "Oleo motor 10W30 (1L)",   brand: "Mobil", unit: "UN", price: 45,  qty: 20, minQty: 5, location: "A1" },
    { id: "p2", sku: "FILTRO-CG160", name: "Filtro de oleo CG160",    brand: "Tecfil", unit: "UN", price: 35, qty: 8,   minQty: 4, location: "A2" },
    { id: "p3", sku: "PAST-FREIO-D", name: "Pastilha de freio dianteira", brand: "Cobreq", unit: "UN", price: 90, qty: 3, minQty: 4, location: "B1" },
    { id: "p4", sku: "KIT-REL-CG160",name: "Kit relacao CG160",       brand: "Vaz",   unit: "UN", price: 160, qty: 2,   minQty: 2, location: "B2" },
    { id: "p5", sku: "VELA-NGK",     name: "Vela de ignicao",         brand: "NGK",   unit: "UN", price: 28,  qty: 15,  minQty: 6, location: "C1" },
    { id: "p6", sku: "CABO-EMB",     name: "Cabo de embreagem",       brand: "Original", unit: "UN", price: 40, qty: 1, minQty: 3, location: "C2" },
    { id: "p7", sku: "BAT-12V",      name: "Bateria 12V 5Ah",         brand: "Yuasa", unit: "UN", price: 320, qty: 4,   minQty: 2, location: "D1" },
    { id: "p8", sku: "PNEU-9090",    name: "Pneu traseiro 90/90-18",  brand: "Pirelli", unit: "UN", price: 210, qty: 2, minQty: 2, location: "D2" }
  ],

  orders: [
    {
      id: "o1", number: "OS-1001", customerId: "c1", motorcycleId: "m1",
      status: "ENTREGUE", kmEntry: 24500, complaint: "Troca de oleo e revisao",
      discount: 0, reserved: false,
      createdAt: "2026-10-12T09:10:00", startedAt: "2026-10-12T09:30:00",
      finishedAt: "2026-10-12T11:00:00", deliveredAt: "2026-10-12T15:20:00",
      validUntil: "2026-10-15",
      items: [
        { type: "LABOR", refId: "s1", name: "Troca de oleo", qty: 1, unitPrice: 80 },
        { type: "PART",  refId: "p1", name: "Oleo motor 10W30 (1L)", qty: 1, unitPrice: 45 },
        { type: "PART",  refId: "p2", name: "Filtro de oleo CG160", qty: 1, unitPrice: 35 }
      ]
    },
    {
      id: "o2", number: "OS-1002", customerId: "c2", motorcycleId: "m2",
      status: "EM_EXECUCAO", kmEntry: 18200, complaint: "Revisao geral pedida pelo cliente",
      discount: 0, reserved: true,
      createdAt: "2026-10-16T08:20:00", startedAt: "2026-10-16T08:45:00",
      finishedAt: null, deliveredAt: null, validUntil: "2026-10-20",
      items: [
        { type: "LABOR", refId: "s2", name: "Revisao geral", qty: 1, unitPrice: 250 },
        { type: "PART",  refId: "p5", name: "Vela de ignicao", qty: 1, unitPrice: 28 }
      ]
    },
    {
      id: "o3", number: "OS-1003", customerId: "c3", motorcycleId: "m3",
      status: "AGUARDANDO_APROVACAO", kmEntry: 8100, complaint: "Freio dianteiro fraco",
      discount: 0, reserved: false,
      createdAt: "2026-10-17T10:05:00", startedAt: null,
      finishedAt: null, deliveredAt: null, validUntil: "2026-10-24",
      items: [
        { type: "LABOR", refId: "s3", name: "Troca de pastilha de freio", qty: 1, unitPrice: 120 },
        { type: "PART",  refId: "p3", name: "Pastilha de freio dianteira", qty: 1, unitPrice: 90 }
      ]
    },
    {
      id: "o4", number: "OS-1004", customerId: "c1", motorcycleId: "m1",
      status: "AGUARDANDO_PECA", kmEntry: 24600, complaint: "Relacao barulhenta",
      discount: 0, reserved: true,
      createdAt: "2026-10-15T14:00:00", startedAt: "2026-10-15T14:20:00",
      finishedAt: null, deliveredAt: null, validUntil: "2026-10-22",
      items: [
        { type: "LABOR", refId: "s5", name: "Troca de relacao (kit)", qty: 1, unitPrice: 150 },
        { type: "PART",  refId: "p4", name: "Kit relacao CG160", qty: 1, unitPrice: 160 }
      ]
    },
    {
      id: "o5", number: "OS-1005", customerId: "c2", motorcycleId: "m2",
      status: "ORCAMENTO", kmEntry: 18300, complaint: "Moto falhando em baixa",
      discount: 0, reserved: false,
      createdAt: "2026-10-08T09:00:00", startedAt: null,
      finishedAt: null, deliveredAt: null, validUntil: "2026-10-10",
      items: [
        { type: "LABOR", refId: "s6", name: "Limpeza de injecao", qty: 1, unitPrice: 130 }
      ]
    },
    {
      id: "o6", number: "OS-1006", customerId: "c3", motorcycleId: "m3",
      status: "ABERTA", kmEntry: 8200, complaint: "Cliente pediu para avaliar a moto",
      discount: 0, reserved: false,
      createdAt: "2026-10-17T11:30:00", startedAt: null,
      finishedAt: null, deliveredAt: null, validUntil: null,
      items: []
    }
  ],

  seq: { order: 1007 }
};
