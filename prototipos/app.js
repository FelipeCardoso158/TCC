/* =====================================================================
   SGOM — Motor de prototipo (shell, telas e interacoes demonstrativas)
   Compartilhado pelas 3 propostas; o visual vem do CSS do tema.
   ===================================================================== */
(function () {
  "use strict";
  var D = window.SGOM;

  /* ---------------- Icones (inline SVG, estilo Lucide) -------------- */
  var PATHS = {
    gauge: '<path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
  };
  function icon(name, size) {
    size = size || 18;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + (PATHS[name] || "") + "</svg>";
  }

  /* ---------------- Estado + utilitarios ---------------- */
  var state = { view: "dashboard", q: "", osMode: "kanban", stockCritical: false, preventFilter: "all" };
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function money(v) { return brl.format(v); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function badge(key) {
    var s = D.statuses[key] || { label: key, cls: "" };
    return '<span class="badge ' + s.cls + '"><span class="dot"></span>' + esc(s.label) + "</span>";
  }
  function plate(v) { return '<span class="plate">' + esc(v) + "</span>"; }
  function q_() { return state.q.trim().toLowerCase(); }
  function match() {
    var q = q_();
    if (!q) return function () { return true; };
    return function (row) {
      return Object.keys(row).some(function (k) {
        var v = row[k];
        return v != null && String(v).toLowerCase().indexOf(q) !== -1;
      });
    };
  }

  /* ---------------- Navegacao ---------------- */
  var NAV = [
    { group: "Operação", items: [
      { id: "dashboard", label: "Dashboard", icon: "gauge" },
      { id: "os", label: "Atendimentos (OS)", icon: "wrench" },
      { id: "orcamentos", label: "Orçamentos", icon: "file" },
      { id: "agenda", label: "Agendamento", icon: "calendar" }
    ]},
    { group: "Oficina", items: [
      { id: "estoque", label: "Estoque", icon: "box", badge: D.kpis.pecasCriticas },
      { id: "preventiva", label: "Preventiva por km", icon: "route" },
      { id: "garantia", label: "Garantia", icon: "shield" }
    ]},
    { group: "Cadastros", items: [
      { id: "clientes", label: "Clientes", icon: "users" },
      { id: "servicos", label: "Serviços", icon: "list" }
    ]},
    { group: "Sistema", items: [
      { id: "perfil", label: "Perfil e configurações", icon: "settings" }
    ]}
  ];
  var VIEW_TITLES = {
    dashboard: "Dashboard", os: "Atendimentos e Serviços", orcamentos: "Orçamentos",
    agenda: "Agendamento", estoque: "Estoque de peças", preventiva: "Manutenção preventiva por km",
    garantia: "Garantia", clientes: "Clientes", servicos: "Catálogo de serviços",
    perfil: "Perfil e configurações"
  };

  function navHTML() {
    return NAV.map(function (g) {
      var items = g.items.map(function (it) {
        var active = it.id === state.view;
        var badge = it.badge ? '<span class="nav-badge">' + it.badge + "</span>" : "";
        return '<a class="nav-item' + (active ? " is-active" : "") + '" href="#' + it.id + '" ' +
          'data-view="' + it.id + '"' + (active ? ' aria-current="page"' : "") + '>' +
          '<span class="nav-icon">' + icon(it.icon, 19) + "</span>" +
          '<span class="nav-label">' + esc(it.label) + "</span>" + badge + "</a>";
      }).join("");
      return '<div class="nav-group"><span class="nav-group-label">' + esc(g.group) + "</span>" + items + "</div>";
    }).join("");
  }

  function brandHTML() {
    return '<a class="brand" href="#dashboard" data-view="dashboard" aria-label="' + esc(D.shop.name) + ' — ir para o Dashboard">' +
      '<span class="brand-mark">' + icon("bike", 22) + "</span>" +
      '<span class="brand-text"><strong>' + esc(D.shop.name) + '</strong><span>' + esc(D.shop.tagline) + "</span></span></a>";
  }

  function userHTML() {
    var u = D.currentUser;
    return '<div class="user-chip"><span class="avatar" aria-hidden="true">' + esc(u.initials) + "</span>" +
      '<span class="user-meta"><strong>' + esc(u.name) + "</strong><span>" + esc(u.role) + "</span></span></div>";
  }

  function actionsHTML() {
    return '<button class="icon-btn" type="button" aria-label="Notificações (3 não lidas)">' + icon("bell", 19) +
      '<span class="dot-alert" aria-hidden="true"></span></button>' +
      '<button class="icon-btn" type="button" aria-label="Abrir configurações" data-view="perfil">' + icon("settings", 19) + "</button>";
  }

  function searchHTML() {
    return '<div class="search">' + icon("search", 17) +
      '<label class="sr-only" for="global-search">Buscar</label>' +
      '<input id="global-search" type="search" placeholder="Buscar cliente, placa, OS, peça…" value="' + esc(state.q) + '" autocomplete="off">' +
      "</div>";
  }

  /* ---------------- Montagem do shell ---------------- */
  function buildShell() {
    var layout = document.body.getAttribute("data-layout");
    var grid = document.getElementById("app-grid");
    if (layout === "topnav") {
      grid.innerHTML =
        '<header class="topbar topbar-main">' +
          '<a class="skip-link" href="#main-content">Pular para o conteúdo</a>' +
          brandHTML() +
          '<nav class="hnav" aria-label="Navegação principal">' + navHTML() + "</nav>" +
          '<div class="topbar-actions">' + searchHTML() + actionsHTML() + "</div>" +
        "</header>" +
        '<div class="main"><main id="main-content" class="content" tabindex="-1"></main></div>';
    } else {
      grid.innerHTML =
        '<aside class="sidebar">' +
          '<div style="padding:14px 12px">' + brandHTML() + "</div>" +
          '<nav class="side-nav" aria-label="Navegação principal">' + navHTML() + "</nav>" +
          '<div class="sidebar-foot">' + userHTML() + "</div>" +
        "</aside>" +
        '<div class="main">' +
          '<header class="topbar">' +
            '<a class="skip-link" href="#main-content">Pular para o conteúdo</a>' +
            '<div class="topbar-title"><strong id="tb-title">Dashboard</strong><span>' + esc(D.shop.name) + " · " + esc(D.currentUser.name) + "</span></div>" +
            '<div class="topbar-actions">' + searchHTML() + actionsHTML() + "</div>" +
          "</header>" +
          '<main id="main-content" class="content" tabindex="-1"></main>' +
        "</div>";
    }
  }

  /* ---------------- Fragmentos reutilizaveis ---------------- */
  function kpi(label, value, foot, warn, trend) {
    var cls = "card kpi" + (warn ? " kpi--warn" : "");
    var footHTML = "";
    if (trend) footHTML = '<span class="kpi-trend ' + trend.dir + '">' + (trend.dir === "up" ? "▲" : "▼") + " " + esc(trend.txt) + "</span>";
    if (foot) footHTML += "<span>" + esc(foot) + "</span>";
    return '<div class="' + cls + '"><div class="kpi-label">' + esc(label) + '</div>' +
      '<div class="kpi-value">' + esc(value) + "</div>" +
      (footHTML ? '<div class="kpi-foot">' + footHTML + "</div>" : "") + "</div>";
  }
  function barChart() {
    var days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return '<div class="bar" style="height:auto;background:transparent;display:flex;align-items:flex-end;gap:10px;height:150px">' +
      D.revenueSeries.map(function (v, i) {
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">' +
          '<div class="bar-fill" style="width:100%;height:' + v + '%" role="img" aria-label="' + days[i] + ": " + v + '%"></div>' +
          '<span class="muted" style="font-size:11px">' + days[i] + "</span></div>";
      }).join("") + "</div>";
  }

  /* ---------------- Views ---------------- */
  var views = {};

  views.dashboard = function () {
    var k = D.kpis;
    var critical = D.parts.filter(function (p) { return p.qty < p.min; });
    var due = D.preventive.filter(function (p) { return p.status !== "ok"; });
    var statusCounts = {};
    D.orders.forEach(function (o) { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    return '<div class="view-head"><div><h1 class="view-title">Dashboard</h1>' +
      '<p class="view-desc">Visão geral da oficina · quarta-feira, 15/10/2026</p></div>' +
      '<div class="view-actions"><button class="btn" data-action="new-order">' + icon("plus", 17) + "Nova OS</button>" +
      '<button class="btn btn--primary" data-action="export">' + icon("file", 17) + "Exportar relatório</button></div></div>' +

      '<div class="kpi-grid">' +
        kpi("Faturamento do mês", money(k.faturamentoMes), "outubro", false, { dir: "up", txt: "12% vs. set" }) +
        kpi("OS abertas", String(k.osAbertas), "em andamento") +
        kpi("Ticket médio", money(k.ticketMedio), "por OS") +
        kpi("Peças críticas", String(k.pecasCriticas), "abaixo do mínimo", true) +
      "</div>" +

      '<div class="grid grid-side mb-20">' +
        '<div class="stack">' +
          '<section class="card"><div class="card-head"><h2 class="card-title">Faturamento da semana</h2>' +
            '<div class="card-actions"><span class="badge">' + icon("gauge", 14) + "R$ 12.340,00</span></div></div>' +
            '<div class="card-body">' + barChart() + "</div></section>" +

          '<section class="card"><div class="card-head"><h2 class="card-title">Ordens por status</h2></div>' +
            '<div class="card-body stack">' +
            D.osByStatus.map(function (s) {
              var n = statusCounts[s.key] || 0; var pct = Math.min(100, n / 7 * 100) || 6;
              return '<div><div class="row" style="justify-content:space-between"><span>' + badge(s.key) + "</span>" +
                '<span class="mono">' + n + " OS</span></div>" +
                '<div class="bar" style="margin-top:8px"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>';
            }).join("") + "</div></section>" +
        "</div>" +

        '<div class="stack">' +
          '<section class="card"><div class="card-head"><h2 class="card-title">Preventiva por km</h2>' +
            '<div class="card-actions"><a class="btn btn--sm" href="#preventiva" data-view="preventiva">Ver tudo</a></div></div>' +
            '<div class="card-body"><ul class="timeline">' +
            due.slice(0, 4).map(function (p) {
              var cls = p.status === "vencido" ? "s-cancelado" : "s-aguardando";
              return '<li class="tl-item"><span class="dot ' + cls + '" style="margin-top:5px"></span>' +
                '<div><strong>' + plate(p.plate) + " " + esc(p.item) + "</strong>" +
                '<div class="cell-sub">' + esc(p.model) + " · " + p.currentKm.toLocaleString("pt-BR") +
                " km · " + (p.status === "vencido" ? "vencido" : "vence em " + (p.dueKm - p.currentKm) + " km") + "</div></div></li>";
            }).join("") + "</ul></div></section>" +

          '<section class="card"><div class="card-head"><h2 class="card-title">Equipe</h2></div>' +
            '<div class="card-body stack">' +
            D.mechanicLoad.map(function (m) {
              return '<div><div class="row" style="justify-content:space-between"><span><strong>' + esc(m.name) + "</strong></span>" +
                '<span class="mono">' + m.os + " OS</span></div>" +
                '<div class="bar" style="margin-top:8px"><div class="bar-fill" style="width:' + m.productivity + '%"></div></div>' +
                '<div class="cell-sub" style="margin-top:4px">' + m.productivity + "% de produtividade</div></div>";
            }).join("") + "</div></section>" +

          '<section class="card"><div class="card-head"><h2 class="card-title">Estoque crítico</h2>' +
            '<span class="nav-badge">' + critical.length + "</span></div>" +
            '<div class="card-body"><ul class="timeline">' +
            critical.map(function (p) {
              return '<li class="tl-item"><span class="dot s-cancelado" style="margin-top:5px"></span>' +
                '<div><strong>' + esc(p.name) + '</strong><div class="cell-sub">SKU ' + esc(p.sku) +
                " · saldo " + p.qty + " (mín. " + p.min + ")</div></div></li>";
            }).join("") + "</ul></div></section>" +
        "</div>" +
      "</div>";
  };

  views.os = function () {
    var rows = D.orders.filter(match());
    var head = '<div class="view-head"><div><h1 class="view-title">Atendimentos e Serviços</h1>' +
      '<p class="view-desc">Ordens de serviço por etapa do pátio</p></div>' +
      '<div class="view-actions">' +
      '<div class="chips" role="group" aria-label="Modo de visualização">' +
        '<button class="chip' + (state.osMode === "kanban" ? " is-active" : "") + '" data-osmode="kanban">Kanban</button>' +
        '<button class="chip' + (state.osMode === "lista" ? " is-active" : "") + '" data-osmode="lista">Lista</button>' +
      "</div>" +
      '<button class="btn btn--primary" data-action="new-order">' + icon("plus", 17) + "Abrir OS</button></div></div>";

    if (state.osMode === "lista") {
      return head + '<section class="card"><div class="table-wrap"><table class="table">' +
        '<caption class="sr-only">Lista de ordens de serviço</caption><thead><tr>' +
        '<th scope="col">OS</th><th scope="col">Cliente</th><th scope="col">Moto</th><th scope="col">Status</th>' +
        '<th scope="col">Mecânico</th><th scope="col">Prazo</th><th scope="col" class="num">Valor</th></tr></thead><tbody>' +
        rows.map(function (o) {
          return '<tr><td class="mono cell-strong">' + esc(o.id) + '</td>' +
            '<td>' + esc(o.customer) + '<div class="cell-sub">' + esc(o.phone) + "</div></td>" +
            '<td>' + plate(o.plate) + '<div class="cell-sub">' + esc(o.bike) + " · " + o.km.toLocaleString("pt-BR") + " km</div></td>" +
            "<td>" + badge(o.status) + "</td>" +
            '<td>' + esc(o.mechanic) + "</td>" +
            '<td class="cell-sub">' + esc(o.promise) + "</td>" +
            '<td class="num cell-strong">' + money(o.value) + "</td></tr>";
        }).join("") + "</tbody></table></div></section>";
    }

    return head + '<div class="kanban">' + D.osByStatus.map(function (s) {
      var list = rows.filter(function (o) { return o.status === s.key; });
      return '<section class="kcol"><div class="kcol-head"><span class="dot ' + s.cls + '"></span>' +
        "<h2>" + esc(s.label) + '</h2><span class="kcol-count">' + list.length + "</span></div>" +
        (list.length ? list.map(function (o) {
          return '<article class="kcard" tabindex="0" role="button" data-order="' + o.id + '" aria-label="Abrir ' + o.id + ', ' + esc(o.customer) + '">' +
            '<div class="kcard-top"><span class="kcard-os">' + esc(o.id) + "</span>" + plate(o.plate) + "</div>" +
            '<div class="kcard-title">' + esc(o.bike) + "</div>" +
            '<div class="kcard-meta">' + esc(o.customer) + " · " + o.km.toLocaleString("pt-BR") + " km</div>" +
            '<div class="kcard-meta">' + icon("wrench", 13) + " " + esc(o.mechanic) + " · " + esc(o.bay) + "</div>" +
            '<div class="kcard-foot">' + badge(o.status) + '<span class="kcard-value">' + money(o.value) + "</span></div></article>";
        }).join("") : '<p class="empty">Nenhuma OS nesta etapa.</p>') + "</section>";
    }).join("") + "</div>";
  };

  views.orcamentos = function () {
    var rows = D.budgets.filter(match());
    return '<div class="view-head"><div><h1 class="view-title">Orçamentos</h1>' +
      '<p class="view-desc">Propostas enviadas e aprovação digital do cliente</p></div>' +
      '<div class="view-actions"><button class="btn btn--primary" data-action="new-budget">' + icon("plus", 17) + "Novo orçamento</button></div></div>" +
      '<section class="card"><div class="table-wrap"><table class="table">' +
      '<caption class="sr-only">Orçamentos</caption><thead><tr><th scope="col">Orçamento</th><th scope="col">Cliente</th>' +
      '<th scope="col">Moto</th><th scope="col">Status</th><th scope="col">Validade</th>' +
      '<th scope="col" class="num">Valor</th><th scope="col">Ações</th></tr></thead><tbody>' +
      rows.map(function (b) {
        var actions = "";
        if (b.status === "aguardando" || b.status === "orcamento") {
          actions = '<button class="btn btn--sm" data-budget-approve="' + b.id + '">Aprovar</button> ' +
                    '<button class="btn btn--sm btn--danger" data-budget-reject="' + b.id + '">Reprovar</button>';
        } else {
          actions = '<span class="cell-sub">' + (b.status === "aprovado" ? "Aprovado" : "Sem ação") + "</span>";
        }
        return '<tr><td class="mono cell-strong">' + esc(b.id) + '<div class="cell-sub">' + esc(b.order) + " " + esc(b.version) + "</div></td>" +
          '<td>' + esc(b.customer) + "</td><td>" + plate(b.plate) + '<div class="cell-sub">' + esc(b.bike) + "</div></td>" +
          "<td>" + badge(b.status) + "</td><td class=\"cell-sub\">" + esc(b.validUntil) + "</td>" +
          '<td class="num cell-strong">' + money(b.value) + "</td><td>" + actions + "</td></tr>";
      }).join("") + "</tbody></table></div></section>";
  };

  views.agenda = function () {
    return '<div class="view-head"><div><h1 class="view-title">Agendamento</h1>' +
      '<p class="view-desc">Agenda de hoje · quarta 15/10/2026 · por baia e mecânico</p></div>' +
      '<div class="view-actions"><button class="btn btn--primary" data-action="new-appointment">' + icon("plus", 17) + "Novo agendamento</button></div></div>" +
      '<div class="grid grid-side">' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Agenda do dia</h2>' +
      '<div class="card-actions"><span class="badge">' + icon("calendar", 14) + D.kpis.agendamentosHoje + " compromissos</span></div></div>" +
      '<div class="card-body"><ul class="timeline">' +
      D.appointments.map(function (a) {
        var cls = a.status === "confirmado" ? "s-aprovado" : "s-rascunho";
        return '<li class="tl-item"><span class="tl-time">' + esc(a.time) + "</span>" +
          '<span class="dot ' + cls + '" style="margin-top:5px"></span>' +
          '<div><strong>' + esc(a.customer) + "</strong> · " + esc(a.service) +
          '<div class="cell-sub">' + esc(a.bay) + " · " + esc(a.mechanic) + "</div></div>" +
          '<span class="spacer"></span>' + badge(a.status) + "</li>";
      }).join("") + "</ul></div></section>" +

      '<section class="card"><div class="card-head"><h2 class="card-title">Ocupação das baias</h2></div>' +
      '<div class="card-body stack">' +
      ["Baia 01", "Baia 02", "Baia 03", "Baia 04"].map(function (b, i) {
        var pct = [80, 45, 95, 60][i];
        return '<div><div class="row" style="justify-content:space-between"><strong>' + b + "</strong>" +
          '<span class="mono">' + pct + '%</span></div><div class="bar" style="margin-top:8px">' +
          '<div class="bar-fill' + (pct >= 90 ? " is-danger" : "") + '" style="width:' + pct + '%"></div></div></div>';
      }).join("") + "</div></section></div>";
  };

  views.estoque = function () {
    var rows = D.parts.filter(match());
    if (state.stockCritical) rows = rows.filter(function (p) { return p.qty < p.min; });
    return '<div class="view-head"><div><h1 class="view-title">Estoque de peças</h1>' +
      '<p class="view-desc">Saldo, ponto de reposição e localização física</p></div>' +
      '<div class="view-actions">' +
      '<div class="chips" role="group" aria-label="Filtro de estoque">' +
        '<button class="chip' + (!state.stockCritical ? " is-active" : "") + '" data-stock="all">Todas</button>' +
        '<button class="chip' + (state.stockCritical ? " is-active" : "") + '" data-stock="critical">Só críticas (' + D.kpis.pecasCriticas + ")</button>" +
      "</div>" +
      '<button class="btn btn--primary" data-action="new-part">' + icon("plus", 17) + "Nova peça</button></div></div>" +
      '<section class="card"><div class="table-wrap"><table class="table">' +
      '<caption class="sr-only">Itens de estoque</caption><thead><tr><th scope="col">SKU</th><th scope="col">Peça</th>' +
      '<th scope="col">Aplicação</th><th scope="col" class="num">Saldo</th><th scope="col" class="num">Mín.</th>' +
      '<th scope="col">Local</th><th scope="col" class="num">Preço</th><th scope="col">Situação</th></tr></thead><tbody>' +
      rows.map(function (p) {
        var low = p.qty < p.min;
        return '<tr class="' + (low ? "row-critical" : "") + '"><td class="mono">' + esc(p.sku) + "</td>" +
          '<td class="cell-strong">' + esc(p.name) + '<div class="cell-sub">' + esc(p.brand) + " · " + esc(p.cat) + "</div></td>" +
          '<td class="cell-sub">' + esc(p.app) + "</td>" +
          '<td class="num cell-strong">' + p.qty + '</td><td class="num">' + p.min + "</td>" +
          '<td class="mono">' + esc(p.loc) + '</td><td class="num">' + money(p.price) + "</td>" +
          "<td>" + (low ? '<span class="badge s-cancelado"><span class="dot"></span>Repor</span>' : '<span class="badge s-pronto"><span class="dot"></span>OK</span>') + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      (rows.length ? "" : '<p class="empty">Nenhum item corresponde ao filtro.</p>') + "</section>";
  };

  views.preventiva = function () {
    var list = D.preventive.filter(function (p) { return state.preventFilter === "all" || p.status === state.preventFilter; });
    var counts = { all: D.preventive.length, vencido: 0, proximo: 0, ok: 0 };
    D.preventive.forEach(function (p) { counts[p.status]++; });
    return '<div class="view-head"><div><h1 class="view-title">Manutenção preventiva por km</h1>' +
      '<p class="view-desc">Diferencial do SGOM: cada moto gera alertas de revisão pela quilometragem</p></div>' +
      '<div class="view-actions"><button class="btn btn--primary" data-action="send-reminders">' + icon("bell", 17) + "Enviar lembretes</button></div></div>" +
      '<div class="chips mb-20" role="group" aria-label="Filtrar preventivas">' +
        ["all", "vencido", "proximo", "ok"].map(function (f) {
          var lab = { all: "Todas", vencido: "Vencidas", proximo: "Próximas", ok: "Em dia" }[f];
          return '<button class="chip' + (state.preventFilter === f ? " is-active" : "") + '" data-prevent="' + f + '">' + lab + " (" + counts[f] + ")</button>";
        }).join("") + "</div>" +
      '<section class="card"><div class="table-wrap"><table class="table">' +
      '<caption class="sr-only">Itens de manutenção preventiva por quilometragem</caption><thead><tr>' +
      '<th scope="col">Moto</th><th scope="col">Cliente</th><th scope="col">Item</th>' +
      '<th scope="col" class="num">Km atual</th><th scope="col" class="num">Vence em</th><th scope="col">Progresso</th><th scope="col">Situação</th></tr></thead><tbody>' +
      list.map(function (p) {
        var used = Math.min(100, Math.round((p.currentKm - p.lastKm) / p.intervalKm * 100));
        var st = p.status;
        var label = st === "vencido" ? "Vencido há " + (p.currentKm - p.dueKm) + " km" : st === "proximo" ? "Vence em " + (p.dueKm - p.currentKm) + " km" : "Em dia";
        var cls = st === "vencido" ? "is-danger" : st === "proximo" ? "" : "is-ok";
        return '<tr class="' + (st === "vencido" ? "row-critical" : "") + '">' +
          '<td>' + plate(p.plate) + '<div class="cell-sub">' + esc(p.model) + "</div></td>" +
          '<td>' + esc(p.customer) + "</td><td>" + esc(p.item) + "</td>" +
          '<td class="num">' + p.currentKm.toLocaleString("pt-BR") + "</td>" +
          '<td class="num">' + p.dueKm.toLocaleString("pt-BR") + "</td>" +
          '<td style="min-width:140px"><div class="bar"><div class="bar-fill ' + cls + '" style="width:' + used + '%"></div></div></td>' +
          "<td>" + badge(st === "vencido" ? "cancelado" : st === "proximo" ? "aguardando" : "pronto") + '<div class="cell-sub">' + label + "</div></td></tr>";
      }).join("") + "</tbody></table></div></section>";
  };

  views.garantia = function () {
    return '<div class="view-head"><div><h1 class="view-title">Garantia</h1>' +
      '<p class="view-desc">Cobertura por item, com validade por data ou quilometragem</p></div></div>' +
      '<section class="card"><div class="table-wrap"><table class="table">' +
      '<caption class="sr-only">Itens em garantia</caption><thead><tr>' +
      '<th scope="col">OS</th><th scope="col">Cliente</th><th scope="col">Item</th><th scope="col">Tipo</th>' +
      '<th scope="col">Início</th><th scope="col">Validade</th><th scope="col">Situação</th></tr></thead><tbody>' +
      D.warranty.map(function (w) {
        var validade = w.endKm ? w.endKm.toLocaleString("pt-BR") + " km ou " + w.endDate : w.endDate;
        return '<tr><td class="mono cell-strong">' + esc(w.order) + "</td><td>" + esc(w.customer) + '<div class="cell-sub">' + plate(w.plate) + "</div></td>" +
          "<td>" + esc(w.item) + "</td><td>" + esc(w.type) + "</td><td class=\"cell-sub\">" + esc(w.start) + "</td>" +
          '<td class="mono">' + validade + '</td><td><span class="badge s-pronto"><span class="dot"></span>Ativa</span></td></tr>';
      }).join("") + "</tbody></table></div></section>";
  };

  views.clientes = function () {
    var rows = D.customers.filter(match());
    return '<div class="view-head"><div><h1 class="view-title">Clientes</h1>' +
      '<p class="view-desc">Cadastro de clientes e motos vinculadas</p></div>' +
      '<div class="view-actions"><button class="btn btn--primary" data-action="new-customer">' + icon("plus", 17) + "Novo cliente</button></div></div>" +
      '<section class="card"><div class="table-wrap"><table class="table">' +
      '<caption class="sr-only">Lista de clientes</caption><thead><tr><th scope="col">Cliente</th><th scope="col">Contato</th>' +
      '<th scope="col">Moto / placa</th><th scope="col" class="num">Km</th><th scope="col">Cliente desde</th><th scope="col">LGPD</th><th scope="col">Ações</th></tr></thead><tbody>' +
      rows.map(function (c) {
        var b = c.bikeList[0];
        return '<tr><td class="cell-strong">' + esc(c.name) + '<div class="cell-sub mono">' + esc(c.cpf) + "</div></td>" +
          '<td>' + esc(c.phone) + '<div class="cell-sub">' + esc(c.email) + "</div></td>" +
          "<td>" + plate(b.plate) + '<div class="cell-sub">' + esc(b.model) + " · " + b.year + "</div></td>" +
          '<td class="num">' + b.km.toLocaleString("pt-BR") + "</td>" +
          '<td class="cell-sub">' + esc(c.since) + "</td>" +
          "<td>" + (c.lgpd ? '<span class="badge s-pronto"><span class="dot"></span>Consentido</span>' : '<span class="badge s-cancelado"><span class="dot"></span>Pendente</span>') + "</td>" +
          '<td><button class="btn btn--sm" data-order-customer="' + esc(c.name) + '">Ver OS</button></td></tr>';
      }).join("") + "</tbody></table></div></section>";
  };

  views.servicos = function () {
    return '<div class="view-head"><div><h1 class="view-title">Catálogo de serviços</h1>' +
      '<p class="view-desc">Serviços padronizados, tempo e preço de mão de obra</p></div>' +
      '<div class="view-actions"><button class="btn btn--primary" data-action="new-service">' + icon("plus", 17) + "Novo serviço</button></div></div>" +
      '<section class="card"><div class="table-wrap"><table class="table">' +
      '<caption class="sr-only">Serviços</caption><thead><tr><th scope="col">Código</th><th scope="col">Serviço</th>' +
      '<th scope="col">Tempo padrão</th><th scope="col" class="num">Preço</th></tr></thead><tbody>' +
      D.services.map(function (s) {
        return '<tr><td class="mono">' + esc(s.code) + '</td><td class="cell-strong">' + esc(s.name) + "</td>" +
          '<td class="cell-sub">' + icon("clock", 14) + " " + esc(s.time) + '</td><td class="num cell-strong">' + money(s.price) + "</td></tr>";
      }).join("") + "</tbody></table></div></section>";
  };

  views.perfil = function () {
    var u = D.currentUser;
    return '<div class="view-head"><div><h1 class="view-title">Perfil e configurações</h1>' +
      '<p class="view-desc">Conta, notificações e preferências do sistema</p></div>' +
      '<div class="view-actions"><button class="btn btn--primary" data-action="save">Salvar alterações</button></div></div>' +
      '<div class="grid grid-2">' +
      '<section class="card"><div class="card-head"><h2 class="card-title">Dados do usuário</h2></div>' +
      '<div class="card-body"><div class="field-row">' +
        '<div class="field"><label for="pf-name">Nome <span class="req" aria-hidden="true">*</span></label>' +
        '<input id="pf-name" value="' + esc(u.name) + '" aria-required="true"></div>' +
        '<div class="field"><label for="pf-role">Perfil de acesso</label>' +
        '<select id="pf-role"><option>Gerente (admin)</option><option>Recepção</option><option>Mecânico</option></select></div></div>' +
      '<div class="field"><label for="pf-email">E-mail</label><input id="pf-email" type="email" value="carlos@rota45motos.com.br"></div>' +
      '<div class="field"><label for="pf-phone">Telefone</label><input id="pf-phone" type="tel" value="(11) 4002-8922"></div>' +
      '<p class="hint">Campos marcados com <span class="req">*</span> são obrigatórios.</p></div></section>' +

      '<section class="card"><div class="card-head"><h2 class="card-title">Notificações</h2></div>' +
      '<div class="card-body stack">' +
      [["Lembretes de revisão por km (e-mail)", true], ["Alerta de estoque mínimo", true], ["Aprovação de orçamento pelo cliente", true], ["Resumo diário da oficina", false]]
      .map(function (n, i) {
        var id = "nt-" + i;
        return '<label class="row" style="gap:10px;min-height:40px"><input type="checkbox" id="' + id + '"' + (n[1] ? " checked" : "") + "> " + esc(n[0]) + "</label>";
      }).join("") +
      '<div class="field" style="margin-top:8px"><label for="pf-channel">Canal de envio</label>' +
      '<select id="pf-channel"><option>E-mail (ativo) e WhatsApp (plugável)</option><option>Somente e-mail</option></select>' +
      '<span class="hint">No protótipo, o e-mail é o canal real e o WhatsApp é simulado.</span></div></div></section>' +
      "</div>";
  };

  /* ---------------- Render principal ---------------- */
  function render(focusMain) {
    var host = document.getElementById("main-content");
    if (!host) return;
    host.innerHTML = (views[state.view] || views.dashboard)();
    var tb = document.getElementById("tb-title");
    if (tb) tb.textContent = VIEW_TITLES[state.view] || "Dashboard";
    document.title = (VIEW_TITLES[state.view] || "Dashboard") + " · SGOM — " + D.shop.name;
    if (focusMain !== false) host.focus({ preventScroll: true });
  }

  function setView(v) {
    if (!views[v]) v = "dashboard";
    state.view = v;
    var layout = document.body.getAttribute("data-layout");
    if (layout === "topnav") buildShell();
    else {
      document.querySelectorAll(".side-nav .nav-item").forEach(function (a) {
        var on = a.getAttribute("data-view") === v;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
    }
    render();
  }

  /* ---------------- Modal acessivel ---------------- */
  var lastFocus = null;
  function openModal(opts) {
    lastFocus = document.activeElement;
    var wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<div class="modal-head"><h2 id="modal-title">' + esc(opts.title) + '</h2>' +
        '<div class="spacer"></div><button class="icon-btn" type="button" data-close aria-label="Fechar">' + icon("x", 18) + "</button></div>" +
        '<div class="modal-body">' + opts.body + "</div>" +
        (opts.foot ? '<div class="modal-foot">' + opts.foot + "</div>" : "") +
      "</div>";
    document.body.appendChild(wrap);

    function close() {
      document.removeEventListener("keydown", onKey);
      wrap.remove();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Tab") {
        var f = wrap.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target.hasAttribute("data-close") || e.target.closest("[data-close]")) close();
    });
    wrap.querySelectorAll("[data-cancel]").forEach(function (b) { b.addEventListener("click", close); });
    var form = wrap.querySelector("form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      close();
      toast(opts.success || "Operação registrada no protótipo.");
    });
    var focusable = wrap.querySelector("input,select,textarea,button");
    if (focusable) focusable.focus();
    return { close: close, root: wrap };
  }

  function orderModal(id) {
    var o = D.orders.filter(function (x) { return x.id === id; })[0];
    if (!o) return;
    var subs = o.items.reduce(function (s, it) { return s + it.qty * it.value; }, 0);
    var rows = o.items.map(function (it) {
      return "<tr><td>" + esc(it.kind) + "</td><td>" + esc(it.desc) + '</td><td class="num">' + it.qty +
        '</td><td class="num">' + money(it.value) + '</td><td class="num">' + money(it.qty * it.value) + "</td></tr>";
    }).join("");
    var body =
      '<div class="row wrap mb-12">' + plate(o.plate) + "<strong>" + esc(o.bike) + "</strong> [" + o.year + "] · " +
        o.cc + "cc " + esc(o.motor) + '<span class="spacer"></span>' + badge(o.status) + "</div>" +
      '<div class="grid grid-3 mb-12">' +
        '<div><div class="cell-sub">Cliente</div><strong>' + esc(o.customer) + "</strong></div>" +
        '<div><div class="cell-sub">Km na entrada</div><strong class="mono">' + o.km.toLocaleString("pt-BR") + "</strong></div>" +
        '<div><div class="cell-sub">Mecânico / Baia</div><strong>' + esc(o.mechanic) + " · " + esc(o.bay) + "</strong></div>" +
      "</div>" +
      '<div class="field"><label>Queixa relatada</label><div class="cell-sub">' + esc(o.complaint) + "</div></div>" +
      '<div class="table-wrap mb-12"><table class="table"><caption class="sr-only">Itens da ordem</caption>' +
      "<thead><tr><th scope=\"col\">Tipo</th><th scope=\"col\">Descrição</th><th scope=\"col\" class=\"num\">Qtd</th>" +
      '<th scope="col" class="num">Unit.</th><th scope="col" class="num">Subtotal</th></tr></thead><tbody>' + rows +
      '</tbody><tfoot><tr><td colspan="4" class="num cell-strong">Total</td><td class="num cell-strong">' + money(subs) + "</td></tr></tfoot></table></div>";

    var ctrl = openModal({
      title: o.id + " — Ordem de serviço",
      body: body,
      foot: '<button class="btn" data-cancel type="button">Voltar</button>' +
            '<button class="btn btn--primary" data-advance type="button">Avançar etapa</button>'
    });
    ctrl.root.querySelector("[data-advance]").addEventListener("click", function () {
      ctrl.close();
      toast("Status da OS avançado (demonstração).");
    });
  }

  /* ---------------- Toast (aria-live) ---------------- */
  function toast(msg) {
    var area = document.getElementById("toast-area");
    if (!area) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    area.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* ---------------- Eventos globais ---------------- */
  function delegate(e) {
    var t = e.target;

    var viewLink = t.closest("[data-view]");
    if (viewLink && viewLink.closest(".topbar-actions, .view-actions, .card-actions")) {
      e.preventDefault();
      setView(viewLink.getAttribute("data-view"));
      return;
    }

    var osmode = t.closest("[data-osmode]");
    if (osmode) { state.osMode = osmode.getAttribute("data-osmode"); render(); return; }

    var stock = t.closest("[data-stock]");
    if (stock) { state.stockCritical = stock.getAttribute("data-stock") === "critical"; render(); return; }

    var prev = t.closest("[data-prevent]");
    if (prev) { state.preventFilter = prev.getAttribute("data-prevent"); render(); return; }

    var order = t.closest("[data-order]");
    if (order) { orderModal(order.getAttribute("data-order")); return; }

    var ap = t.closest("[data-budget-approve]");
    if (ap) {
      var idA = ap.getAttribute("data-budget-approve");
      D.budgets.forEach(function (b) { if (b.id === idA) b.status = "aprovado"; });
      render(); toast(idA + " aprovado pelo cliente (demonstração)."); return;
    }
    var rj = t.closest("[data-budget-reject]");
    if (rj) {
      var idR = rj.getAttribute("data-budget-reject");
      D.budgets.forEach(function (b) { if (b.id === idR) b.status = "reprovado"; });
      render(); toast(idR + " reprovado com motivo (demonstração)."); return;
    }
    var oc = t.closest("[data-order-customer]");
    if (oc) { setView("os"); toast("Mostrando as OS de " + oc.getAttribute("data-order-customer") + "."); return; }

    var action = t.closest("[data-action]");
    if (action) {
      var a = action.getAttribute("data-action");
      if (a === "new-order") return formModal("Abrir nova OS", [
        ["Cliente", "select", ["Marcos Andrade", "Patrícia Nunes", "João Batista", "Fernanda Rocha", "Diego Santos"]],
        ["Placa", "text", "ABC-1D23"], ["Km na entrada", "number", "42350"], ["Queixa principal", "text", ""]
      ], "Nova OS registrada no protótipo.");
      if (a === "new-customer") return formModal("Novo cliente", [
        ["Nome completo", "text", ""], ["CPF", "text", ""], ["Telefone", "tel", ""], ["E-mail", "email", ""]
      ], "Cliente cadastrado no protótipo.");
      if (a === "new-part") return formModal("Cadastrar peça", [
        ["SKU", "text", ""], ["Descrição", "text", ""], ["Aplicação / modelo", "text", ""], ["Estoque mínimo", "number", ""]
      ], "Peça cadastrada no protótipo.");
      if (a === "new-budget") return formModal("Novo orçamento", [
        ["OS vinculada", "select", D.orders.map(function (o) { return o.id; })], ["Validade", "date", ""], ["Observações", "text", ""]
      ], "Orçamento criado no protótipo.");
      if (a === "new-appointment") return formModal("Novo agendamento", [
        ["Cliente", "text", ""], ["Serviço", "text", ""], ["Data", "date", ""], ["Baia", "select", ["Baia 01", "Baia 02", "Baia 03", "Baia 04"]]
      ], "Agendamento criado no protótipo.");
      if (a === "new-service") return formModal("Novo serviço", [
        ["Código", "text", ""], ["Descrição", "text", ""], ["Tempo padrão", "text", ""], ["Preço", "number", ""]
      ], "Serviço cadastrado no protótipo.");
      if (a === "send-reminders") { toast("Lembretes de revisão enviados por e-mail (WhatsApp simulado)."); return; }
      if (a === "export") { toast("Relatório exportado em CSV/PDF (demonstração)."); return; }
      if (a === "save") { toast("Configurações salvas no protótipo."); return; }
    }
  }

  function formModal(title, fields, success) {
    var body = '<form novalidate>' + fields.map(function (f, i) {
      var id = "fm-" + i;
      var label = '<label for="' + id + '">' + esc(f[0]) + " <span class=\"req\" aria-hidden=\"true\">*</span></label>";
      var input;
      if (f[1] === "select") input = '<select id="' + id + '" aria-required="true">' + f[2].map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select>";
      else input = '<input id="' + id + '" type="' + f[1] + '" value="' + esc(f[2]) + '" aria-required="true">';
      return '<div class="field">' + label + input + "</div>";
    }).join("") + "</form>";
    var ctrl = openModal({
      title: title, body: body, success: success,
      foot: '<button class="btn" data-cancel type="button">Cancelar</button>' +
            '<button class="btn btn--primary" data-submit type="button">Salvar</button>'
    });
    ctrl.root.querySelector("[data-submit]").addEventListener("click", function () {
      var form = ctrl.root.querySelector("form");
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { cancelable: true }));
    });
  }

  /* ---------------- Busca global ---------------- */
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "global-search") {
      state.q = e.target.value;
      if (["os", "orcamentos", "estoque", "clientes"].indexOf(state.view) === -1) setView("clientes");
      else render(false);
      var s = document.getElementById("global-search");
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }
  });

  /* ---------------- Inicializacao ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildShell();
    // navegacao
    document.addEventListener("click", function (e) {
      var nav = e.target.closest(".nav-item, .brand");
      if (nav && nav.hasAttribute("data-view")) { e.preventDefault(); setView(nav.getAttribute("data-view")); return; }
      delegate(e);
    });
    // teclado no kanban
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-order]")) {
        e.preventDefault(); orderModal(e.target.getAttribute("data-order"));
      }
    });
    render();
  });
})();
