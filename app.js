/* =====================================================================
   SGOM - Sistema de Gerenciamento para Oficina de Motos
   app.js - roteador, telas e regras de negocio do prototipo.

   Tudo roda no navegador (sem servidor). Os dados ficam no localStorage.
   ===================================================================== */
(function () {
  "use strict";

  var DB_KEY = "sgom_db_v1";
  var SESSION_KEY = "sgom_session_v1";

  /* ============================================================
     1. Persistencia e sessao
     ============================================================ */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function loadDB() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* dados invalidos: recria */ }
    var fresh = clone(window.SGOM_SEED);
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    return fresh;
  }
  function persist() { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  function resetDB() { db = clone(window.SGOM_SEED); persist(); }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch (e) { return null; }
  }
  function setSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }

  var db = loadDB();
  var state = { view: null, modal: null, openOrderId: null, orcTab: "ativos", loginTab: "staff" };

  /* ============================================================
     2. Utilitarios
     ============================================================ */
  function uid(prefix) { return prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function money(v) { return brl.format(Number(v) || 0); }
  function n2(v) { return Number(v) || 0; }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function nowLocal() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  function fmtDate(iso) { if (!iso) return "-"; var d = new Date(iso); return isNaN(d) ? esc(iso) : d.toLocaleDateString("pt-BR"); }
  function fmtDateTime(iso) {
    if (!iso) return "-"; var d = new Date(iso);
    return isNaN(d) ? esc(iso) : d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function toast(msg, kind) {
    var root = document.getElementById("toast-root");
    var el = document.createElement("div");
    el.className = "toast " + (kind === "err" ? "err" : "ok");
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }

  /* ============================================================
     3. Status e regras de negocio
     ============================================================ */
  var STATUS = {
    ABERTA: { label: "Aberta", cls: "s-aberta" },
    ORCAMENTO: { label: "Orçamento", cls: "s-orcamento" },
    AGUARDANDO_APROVACAO: { label: "Aguardando aprovação", cls: "s-aguardando" },
    APROVADA: { label: "Aprovada", cls: "s-aprovada" },
    EM_EXECUCAO: { label: "Em execução", cls: "s-execucao" },
    AGUARDANDO_PECA: { label: "Aguardando peça", cls: "s-peca" },
    PRONTO: { label: "Pronto", cls: "s-pronto" },
    ENTREGUE: { label: "Entregue", cls: "s-entregue" },
    CANCELADO: { label: "Cancelado", cls: "s-cancelado" },
    REPROVADO: { label: "Reprovado", cls: "s-reprovado" }
  };
  var TRANS_LABEL = {
    ORCAMENTO: "Voltar para orçamento",
    AGUARDANDO_APROVACAO: "Enviar para aprovação",
    APROVADA: "Registrar aprovação",
    REPROVADO: "Reprovar",
    EM_EXECUCAO: "Iniciar execução",
    AGUARDANDO_PECA: "Aguardando peça",
    PRONTO: "Concluir (pronto)",
    ENTREGUE: "Entregar e baixar estoque",
    CANCELADO: "Cancelar"
  };
  var RESERVED_STATES = ["APROVADA", "EM_EXECUCAO", "AGUARDANDO_PECA", "PRONTO"];

  function findOrder(id) { return db.orders.filter(function (o) { return o.id === id; })[0] || null; }
  function findCustomer(id) { return db.customers.filter(function (c) { return c.id === id; })[0] || null; }
  function findMoto(id) { return db.motorcycles.filter(function (m) { return m.id === id; })[0] || null; }
  function findPart(id) { return db.parts.filter(function (p) { return p.id === id; })[0] || null; }
  function findUser(id) { return db.users.filter(function (u) { return u.id === id; })[0] || null; }

  function orderTotal(os) {
    var sum = os.items.reduce(function (a, i) { return a + n2(i.qty) * n2(i.unitPrice); }, 0);
    return Math.max(0, sum - n2(os.discount));
  }
  function hasParts(os) { return os.items.some(function (i) { return i.type === "PART"; }); }

  function reservedByPart(partId, exceptOrderId) {
    var total = 0;
    db.orders.forEach(function (o) {
      if (o.id === exceptOrderId) return;
      if (!o.reserved) return;
      if (RESERVED_STATES.indexOf(o.status) === -1) return;
      o.items.forEach(function (i) {
        if (i.type === "PART" && i.refId === partId) total += n2(i.qty);
      });
    });
    return total;
  }
  function availableForPart(partId) {
    var part = findPart(partId);
    if (!part) return 0;
    return n2(part.qty) - reservedByPart(partId, null);
  }

  function isExpired(os) {
    if (os.status !== "ORCAMENTO" && os.status !== "AGUARDANDO_APROVACAO") return false;
    if (!os.validUntil) return false;
    return os.validUntil < todayISO();
  }
  function displayStatus(os) { return isExpired(os) ? "CANCELADO" : os.status; }
  function badge(statusKey) {
    var s = STATUS[statusKey] || { label: statusKey, cls: "" };
    return '<span class="badge ' + s.cls + '"><span class="dot"></span>' + esc(s.label) + "</span>";
  }

  function canEditItems(os) {
    return !isExpired(os) && ["ABERTA", "ORCAMENTO", "AGUARDANDO_APROVACAO"].indexOf(os.status) !== -1;
  }
  function transitionsFor(os) {
    switch (os.status) {
      case "ABERTA": return ["ORCAMENTO", "CANCELADO"];
      case "ORCAMENTO": return ["AGUARDANDO_APROVACAO", "CANCELADO"];
      case "AGUARDANDO_APROVACAO": return ["APROVADA", "REPROVADO", "ORCAMENTO"];
      case "APROVADA": return ["EM_EXECUCAO", "CANCELADO"];
      case "EM_EXECUCAO": {
        var list = ["PRONTO"];
        if (hasParts(os)) list.push("AGUARDANDO_PECA");
        list.push("CANCELADO");
        return list;
      }
      case "AGUARDANDO_PECA": return ["EM_EXECUCAO", "CANCELADO"];
      case "PRONTO": return ["ENTREGUE", "CANCELADO"];
      default: return [];
    }
  }

  function deliverStock(os) {
    os.items.forEach(function (i) {
      if (i.type !== "PART") return;
      var part = findPart(i.refId);
      if (part) part.qty = Math.max(0, n2(part.qty) - n2(i.qty));
    });
  }

  function setStatus(os, to) {
    var from = os.status;
    if (to === "AGUARDANDO_APROVACAO" && os.items.length === 0) { toast("Adicione ao menos um item antes de enviar.", "err"); return false; }
    if (to === "APROVADA") { os.reserved = true; os.approvedAt = nowLocal(); }
    if (to === "EM_EXECUCAO" && !os.startedAt) os.startedAt = nowLocal();
    if (to === "PRONTO" && !os.finishedAt) os.finishedAt = nowLocal();
    if (to === "ENTREGUE") { deliverStock(os); os.deliveredAt = nowLocal(); os.reserved = false; }
    if (to === "CANCELADO" || to === "REPROVADO") os.reserved = false;
    os.status = to;
    persist();
    return true;
  }

  /* ============================================================
     4. Render raiz
     ============================================================ */
  function currentUser() {
    var s = getSession();
    if (!s) return null;
    return findUser(s.userId);
  }
  function navigate(view) {
    state.view = view;
    state.modal = null;
    state.openOrderId = null;
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    var user = currentUser();
    if (!user) { renderLogin(); renderModals(null); return; }
    if (user.role === "CLIENTE") renderClientApp(user);
    else renderStaffApp(user);
    renderModals(user);
  }

  function renderModals(user) {
    var root = document.getElementById("modal-root");
    if (!user) { root.innerHTML = ""; return; }
    if (state.openOrderId) {
      var os = findOrder(state.openOrderId);
      if (os) { root.innerHTML = orderModalHTML(os, user); return; }
      state.openOrderId = null;
    }
    root.innerHTML = state.modal || "";
  }
  function openModal(html) { state.modal = html; state.openOrderId = null; render(); }
  function closeModal() { state.modal = null; state.openOrderId = null; render(); }

  /* ============================================================
     5. Tela de login
     ============================================================ */
  function renderLogin() {
    var app = document.getElementById("app");
    var isStaff = state.loginTab !== "client";
    app.innerHTML =
      '<div class="login-wrap"><div class="login-card">' +
        '<div class="login-head">' +
          '<span class="brand-mark">' + icon("bike", 26) + '</span>' +
          '<h1>SGOM</h1>' +
          '<p>Sistema de Gerenciamento para Oficina de Motos</p>' +
        '</div>' +
        '<div class="login-body">' +
          '<div class="tabs">' +
            '<button type="button" data-act="login-tab" data-tab="staff" class="' + (isStaff ? "active" : "") + '">Funcionário</button>' +
            '<button type="button" data-act="login-tab" data-tab="client" class="' + (!isStaff ? "active" : "") + '">Cliente</button>' +
          '</div>' +
          (isStaff ? loginStaffHTML() : loginClientHTML()) +
        '</div>' +
      '</div></div>';
  }

  function loginStaffHTML() {
    return '<form id="form-login-staff" autocomplete="off">' +
      field("E-mail", '<input name="email" type="email" required placeholder="funcionario@sgom">') +
      field("Senha", '<input name="password" type="password" required placeholder="sua senha">') +
      '<button class="btn btn--primary" style="width:100%" type="submit">Entrar</button>' +
      '<div class="hint">Acesso de demonstração: <code>funcionario@sgom</code> / <code>sgom123</code></div>' +
      '</form>';
  }
  function loginClientHTML() {
    return '<form id="form-login-client" autocomplete="off">' +
      '<p class="muted" style="font-size:13px;margin-top:0">Entre com seu e-mail. Se ainda não tem conta, ela é criada na hora.</p>' +
      field("Nome (para criar conta)", '<input name="name" placeholder="Seu nome">') +
      field("E-mail", '<input name="email" type="email" required placeholder="voce@email.com">') +
      field("Telefone", '<input name="phone" placeholder="(11) 90000-0000">') +
      field("Senha", '<input name="password" type="password" required placeholder="escolha uma senha">') +
      '<button class="btn btn--primary" style="width:100%" type="submit">Entrar / Criar conta</button>' +
      '<div class="hint">Dica: para ver O.S. de exemplo, entre com <code>joao@email.com</code> / <code>123</code>.</div>' +
      '</form>';
  }

  function field(label, input, hint) {
    return '<div class="field"><label>' + esc(label) + (hint ? ' <span class="muted">(' + esc(hint) + ')</span>' : "") + '</label>' + input + '</div>';
  }
  function icon(name, size) {
    var paths = {
      bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
      wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
      gauge: '<path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
      box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
      list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
      file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      plus: '<path d="M5 12h14M12 5v14"/>',
      logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'
    };
    var s = size || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || "") + "</svg>";
  }

  /* ============================================================
     6. Shell do funcionario
     ============================================================ */
  var STAFF_NAV = [
    { id: "dashboard", label: "Dashboard", icon: "gauge" },
    { id: "orcamentos", label: "Orçamentos", icon: "file" },
    { id: "os", label: "Atendimentos (O.S.)", icon: "wrench" },
    { id: "estoque", label: "Estoque", icon: "box" },
    { id: "clientes", label: "Clientes", icon: "users" },
    { id: "servicos", label: "Serviços", icon: "list" }
  ];
  function defaultView(user) { return user.role === "CLIENTE" ? "minhasos" : "dashboard"; }

  function topbar(user, navItems, activeView) {
    var nav = navItems.map(function (it) {
      return '<a href="#' + it.id + '" data-act="nav" data-view="' + it.id + '" class="' + (it.id === activeView ? "active" : "") + '">' + esc(it.label) + "</a>";
    }).join("");
    return '<header class="topbar">' +
      '<a class="brand" href="#inicio" data-act="nav" data-view="' + defaultView(user) + '">' +
        '<span class="brand-mark">' + icon("bike", 20) + '</span>' +
        '<span><strong>SGOM</strong><span>Oficina de Motos</span></span>' +
      '</a>' +
      '<nav aria-label="Navegação principal">' + nav + '</nav>' +
      '<div class="spacer"></div>' +
      '<div class="who"><strong>' + esc(user.name) + '</strong><span>' + (user.role === "CLIENTE" ? "Cliente" : "Funcionário") + '</span></div>' +
      '<button class="btn btn--sm btn--ghost" data-act="logout" title="Sair" style="color:#fff;border-color:#3a4149">Sair</button>' +
      '</header>';
  }

  function renderStaffApp(user) {
    if (!state.view) state.view = "dashboard";
    var views = { dashboard: viewDashboard, orcamentos: viewOrcamentos, os: viewOS, estoque: viewEstoque, clientes: viewClientes, servicos: viewServicos };
    var build = views[state.view] || viewDashboard;
    document.getElementById("app").innerHTML =
      '<div class="app">' + topbar(user, STAFF_NAV, state.view) + '<div class="content">' + build(user) + '</div></div>';
  }

  /* ---------------- Dashboard ---------------- */
  function viewDashboard() {
    var active = db.orders.filter(function (o) { return ["APROVADA", "EM_EXECUCAO", "AGUARDANDO_PECA", "PRONTO"].indexOf(o.status) !== -1; });
    var waiting = db.orders.filter(function (o) { return o.status === "AGUARDANDO_APROVACAO" && !isExpired(o); });
    var delivered = db.orders.filter(function (o) { return o.status === "ENTREGUE"; });
    var critical = db.parts.filter(function (p) { return availableForPart(p.id) < n2(p.minQty); });

    var statusCounts = {};
    db.orders.forEach(function (o) {
      var k = displayStatus(o);
      statusCounts[k] = (statusCounts[k] || 0) + 1;
    });
    var maxCount = Math.max.apply(null, Object.keys(statusCounts).map(function (k) { return statusCounts[k]; }).concat([1]));

    var dueOrders = active.filter(function (o) { return o.startedAt; });
    var avgMin = 0, avgN = 0;
    db.orders.forEach(function (o) {
      if (o.startedAt && o.finishedAt) {
        avgN++;
        avgMin += (new Date(o.finishedAt) - new Date(o.startedAt)) / 60000;
      }
    });
    var avgTxt = avgN ? Math.round(avgMin / avgN) + " min" : "-";

    var labor = {}, partUse = {};
    db.orders.forEach(function (o) {
      o.items.forEach(function (i) {
        var bag = i.type === "LABOR" ? labor : partUse;
        bag[i.name] = (bag[i.name] || 0) + n2(i.qty);
      });
    });
    function topList(bag, limit) {
      var arr = Object.keys(bag).map(function (k) { return { name: k, q: bag[k] }; });
      arr.sort(function (a, b) { return b.q - a.q; });
      return arr.slice(0, limit);
    }
    var topServices = topList(labor, 5), topParts = topList(partUse, 5);

    return viewHead("Dashboard", "Visão geral da oficina") +
      '<div class="grid-kpi">' +
        kpi("O.S. em andamento", active.length, "aprovadas a prontas") +
        kpi("Aguardando aprovação", waiting.length, "aguardando o cliente") +
        kpi("Entregues", delivered.length, "no total") +
        kpi("Peças críticas", critical.length, "abaixo do mínimo", critical.length > 0) +
      '</div>' +
      '<div class="grid-2">' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Ordens por status</h2><span class="badge">' + esc(avgTxt) + ' tempo médio</span></div>' +
          '<div class="card-body stack">' +
            Object.keys(STATUS).map(function (k) {
              var n = statusCounts[k] || 0;
              var pct = Math.round((n / maxCount) * 100);
              return '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
                badge(k) + '<span class="muted">' + n + '</span></div>' +
                '<div style="height:8px;background:#eef1f4;border-radius:6px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:var(--accent)"></div></div></div>';
            }).join("") +
          '</div></section>' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Estoque crítico</h2></div>' +
          '<div class="card-body" style="padding:0">' +
            (critical.length ? '<table><thead><tr><th>Peça</th><th class="num">Disponível</th><th class="num">Mínimo</th></tr></thead><tbody>' +
              critical.map(function (p) {
                return '<tr><td><strong>' + esc(p.name) + '</strong><div class="cell-sub">' + esc(p.sku) + '</div></td>' +
                  '<td class="num" style="color:var(--err);font-weight:700">' + availableForPart(p.id) + '</td>' +
                  '<td class="num">' + n2(p.minQty) + '</td></tr>';
              }).join("") + '</tbody></table>' : '<div class="empty">Nenhuma peça crítica.</div>') +
          '</div></section>' +
      '</div>' +
      '<div class="grid-2" style="margin-top:16px">' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Serviços mais realizados</h2></div><div class="card-body">' +
          (topServices.length ? listBars(topServices) : '<div class="empty">Sem dados ainda.</div>') + '</div></section>' +
        '<section class="card"><div class="card-head"><h2 class="card-title">Peças mais usadas</h2></div><div class="card-body">' +
          (topParts.length ? listBars(topParts) : '<div class="empty">Sem dados ainda.</div>') + '</div></section>' +
      '</div>';
  }
  function listBars(arr) {
    var max = Math.max.apply(null, arr.map(function (a) { return a.q; }).concat([1]));
    return '<div class="stack">' + arr.map(function (a) {
      return '<div><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>' + esc(a.name) + '</span><span class="muted">' + a.q + '</span></div>' +
        '<div style="height:8px;background:#eef1f4;border-radius:6px;overflow:hidden"><div style="height:100%;width:' + Math.round(a.q / max * 100) + '%;background:var(--accent-strong)"></div></div></div>';
    }).join("") + '</div>';
  }
  function kpi(label, value, foot, warn) {
    return '<div class="card kpi' + (warn ? " kpi--warn" : "") + '">' +
      '<div class="kpi-label">' + esc(label) + '</div>' +
      '<div class="kpi-value">' + esc(value) + '</div>' +
      '<div class="kpi-foot">' + esc(foot || "") + '</div></div>';
  }
  function viewHead(title, desc, actions) {
    return '<div class="view-head"><div><h1 class="view-title">' + esc(title) + '</h1><p class="view-desc">' + esc(desc || "") + '</p></div>' +
      (actions ? '<div class="view-actions">' + actions + '</div>' : "") + '</div>';
  }

  /* ---------------- Orcamentos ---------------- */
  function viewOrcamentos() {
    var ativos = db.orders.filter(function (o) {
      return ["ABERTA", "ORCAMENTO", "AGUARDANDO_APROVACAO"].indexOf(o.status) !== -1 && !isExpired(o);
    });
    var cancelados = db.orders.filter(function (o) {
      return o.status === "CANCELADO" || o.status === "REPROVADO" || isExpired(o);
    });
    var list = state.orcTab === "cancelados" ? cancelados : ativos;

    return viewHead("Orçamentos", "Crie orçamentos, adicione serviços e peças e envie para aprovação do cliente",
      '<button class="btn btn--primary" data-act="new-order">' + icon("plus", 16) + ' Novo orçamento</button>') +
      '<div class="tabs" style="max-width:340px">' +
        '<button data-act="orc-tab" data-tab="ativos" class="' + (state.orcTab !== "cancelados" ? "active" : "") + '">Ativos (' + ativos.length + ')</button>' +
        '<button data-act="orc-tab" data-tab="cancelados" class="' + (state.orcTab === "cancelados" ? "active" : "") + '">Cancelados (' + cancelados.length + ')</button>' +
      '</div>' +
      '<section class="card" style="margin-top:16px"><div class="card-body" style="padding:0">' +
        (list.length ? orderTable(list) : '<div class="empty">Nenhum orçamento aqui.</div>') +
      '</div></section>';
  }
  function orderTable(list) {
    return '<table><thead><tr><th>Nº</th><th>Cliente</th><th>Moto</th><th>Status</th><th>Validade</th><th class="num">Total</th><th></th></tr></thead><tbody>' +
      list.map(function (o) {
        var c = findCustomer(o.customerId), m = findMoto(o.motorcycleId);
        return '<tr>' +
          '<td><strong>' + esc(o.number) + '</strong></td>' +
          '<td>' + esc(c ? c.name : "-") + '</td>' +
          '<td>' + (m ? '<span class="plate">' + esc(m.plate) + '</span><div class="cell-sub">' + esc(m.brand + " " + m.model) + '</div>' : "-") + '</td>' +
          '<td>' + badge(displayStatus(o)) + '</td>' +
          '<td>' + (o.validUntil ? fmtDate(o.validUntil) + (isExpired(o) ? ' <span class="muted">(vencido)</span>' : "") : "-") + '</td>' +
          '<td class="num">' + money(orderTotal(o)) + '</td>' +
          '<td><button class="btn btn--sm" data-act="open-order" data-id="' + o.id + '">Abrir</button></td>' +
        '</tr>';
      }).join("") + '</tbody></table>';
  }

  /* ---------------- O.S. Kanban ---------------- */
  function viewOS() {
    var cols = ["APROVADA", "EM_EXECUCAO", "AGUARDANDO_PECA", "PRONTO", "ENTREGUE"];
    var html = viewHead("Atendimentos (O.S.)", "Acompanhe e mova as ordens pelas etapas",
      '<button class="btn btn--primary" data-act="new-order">' + icon("plus", 16) + ' Nova O.S.</button>');
    html += '<div class="kanban">';
    cols.forEach(function (k) {
      var orders = db.orders.filter(function (o) { return o.status === k; });
      html += '<div class="kcol"><div class="kcol-head">' + badge(k) + '<span class="muted">' + orders.length + '</span></div><div class="kcol-body">' +
        (orders.length ? orders.map(function (o) {
          var c = findCustomer(o.customerId), m = findMoto(o.motorcycleId);
          return '<div class="kcard" data-act="open-order" data-id="' + o.id + '">' +
            '<div class="kcard-top"><strong>' + esc(o.number) + '</strong>' + (m ? '<span class="plate">' + esc(m.plate) + '</span>' : "") + '</div>' +
            '<div class="kcard-title">' + esc(c ? c.name : "-") + '</div>' +
            '<div class="kcard-sub">' + esc(m ? (m.brand + " " + m.model) : "") + '</div>' +
            '<div style="margin-top:8px;font-weight:700">' + money(orderTotal(o)) + '</div>' +
          '</div>';
        }).join("") : '<div class="empty" style="padding:16px">—</div>') +
        '</div></div>';
    });
    html += '</div>';
    return html;
  }

  /* ---------------- Estoque ---------------- */
  function viewEstoque() {
    return viewHead("Estoque de peças", "Entradas, saídas e alerta de mínimo",
      '<button class="btn btn--primary" data-act="new-part">' + icon("plus", 16) + ' Nova peça</button>') +
      '<section class="card"><div class="card-body" style="padding:0"><table>' +
      '<thead><tr><th>SKU</th><th>Peça</th><th>Local</th><th class="num">Estoque</th><th class="num">Reservado</th><th class="num">Disponível</th><th class="num">Mínimo</th><th></th></tr></thead><tbody>' +
      db.parts.map(function (p) {
        var res = reservedByPart(p.id, null);
        var avail = availableForPart(p.id);
        var low = avail < n2(p.minQty);
        return '<tr>' +
          '<td>' + esc(p.sku) + '</td>' +
          '<td><strong>' + esc(p.name) + '</strong><div class="cell-sub">' + esc(p.brand || "") + '</div></td>' +
          '<td>' + esc(p.location || "-") + '</td>' +
          '<td class="num">' + n2(p.qty) + '</td>' +
          '<td class="num muted">' + res + '</td>' +
          '<td class="num" style="' + (low ? "color:var(--err);font-weight:700" : "") + '">' + avail + (low ? " ⚠" : "") + '</td>' +
          '<td class="num">' + n2(p.minQty) + '</td>' +
          '<td style="white-space:nowrap"><button class="btn btn--sm" data-act="stock-move" data-id="' + p.id + '" data-dir="in">Entrada</button> ' +
          '<button class="btn btn--sm" data-act="stock-move" data-id="' + p.id + '" data-dir="out">Saída</button></td>' +
        '</tr>';
      }).join("") + '</tbody></table></div></section>';
  }

  /* ---------------- Clientes ---------------- */
  function viewClientes() {
    return viewHead("Clientes", "Cadastro de clientes e suas motos",
      '<button class="btn btn--primary" data-act="new-customer">' + icon("plus", 16) + ' Novo cliente</button>') +
      '<section class="card"><div class="card-body" style="padding:0">' +
      (db.customers.length ? '<table><thead><tr><th>Nome</th><th>Contato</th><th>CPF/CNPJ</th><th>Motos</th><th></th></tr></thead><tbody>' +
        db.customers.map(function (c) {
          var motos = db.motorcycles.filter(function (m) { return m.customerId === c.id; });
          return '<tr><td><strong>' + esc(c.name) + '</strong><div class="cell-sub">' + esc(c.email || "") + '</div></td>' +
            '<td>' + esc(c.phone || "-") + '</td>' +
            '<td>' + esc(c.doc || "-") + '</td>' +
            '<td>' + motos.map(function (m) { return '<span class="plate">' + esc(m.plate) + '</span>'; }).join(" ") + (motos.length ? "" : '<span class="muted">nenhuma</span>') + '</td>' +
            '<td><button class="btn btn--sm" data-act="new-moto" data-id="' + c.id + '">+ Moto</button></td></tr>';
        }).join("") + '</tbody></table>' : '<div class="empty">Nenhum cliente.</div>') +
      '</div></section>';
  }

  /* ---------------- Servicos ---------------- */
  function viewServicos() {
    return viewHead("Catálogo de serviços", "Serviços oferecidos pela oficina",
      '<button class="btn btn--primary" data-act="new-service">' + icon("plus", 16) + ' Novo serviço</button>') +
      '<section class="card"><div class="card-body" style="padding:0"><table>' +
      '<thead><tr><th>Código</th><th>Serviço</th><th class="num">Tempo padrão</th><th class="num">Preço</th></tr></thead><tbody>' +
      db.services.map(function (s) {
        return '<tr><td>' + esc(s.code) + '</td><td><strong>' + esc(s.name) + '</strong></td>' +
          '<td class="num">' + (s.timeStd ? s.timeStd + " min" : "-") + '</td><td class="num">' + money(s.price) + '</td></tr>';
      }).join("") + '</tbody></table></div></section>';
  }

  /* ============================================================
     7. Modal da O.S. / Orcamento
     ============================================================ */
  function orderModalHTML(os, user) {
    var isClient = user.role === "CLIENTE";
    var c = findCustomer(os.customerId), m = findMoto(os.motorcycleId);
    var editable = canEditItems(os);
    var body =
      '<div class="row3">' +
        infoBox("Cliente", c ? c.name : "-") +
        infoBox("Moto", m ? (m.brand + " " + m.model) : "-") +
        infoBox("Placa", m ? m.plate : "-") +
      '</div>' +
      '<div class="row3" style="margin-top:12px">' +
        infoBox("KM de entrada", os.kmEntry != null ? os.kmEntry : "-") +
        infoBox("Queixa", os.complaint || "-") +
        infoBox("Criada em", fmtDateTime(os.createdAt)) +
      '</div>' +
      '<div class="row3" style="margin-top:12px">' +
        infoBox("Início execução", fmtDateTime(os.startedAt)) +
        infoBox("Fim execução", fmtDateTime(os.finishedAt)) +
        infoBox("Validade do orçamento", os.validUntil ? fmtDate(os.validUntil) : "-") +
      '</div>' +
      (isExpired(os) ? '<div class="alert alert--err">Este orçamento venceu em ' + fmtDate(os.validUntil) + ' e por isso aparece em <strong>Cancelados</strong>.</div>' : "") +
      '<h3 style="margin:18px 0 8px">Itens</h3>' +
      itemsTable(os, editable) +
      (editable ? addItemForm(os) : "") +
      '<div style="margin-top:14px" class="inline">' +
        '<div class="field"><label>Desconto (R$)</label><input id="f-discount" type="number" min="0" step="0.01" value="' + n2(os.discount) + '" ' + (editable ? "" : "disabled") + '></div>' +
        '<div class="field"><label>Validade</label><input id="f-valid" type="date" value="' + (os.validUntil || "") + '" ' + (editable ? "" : "disabled") + '></div>' +
        (editable ? '<button class="btn" data-act="save-quote" data-id="' + os.id + '">Salvar desconto/validade</button>' : "") +
      '</div>' +
      '<div class="total-box"><span>Total</span><span>' + money(orderTotal(os)) + '</span></div>';

    var foot = "";
    if (isClient) {
      if (os.status === "AGUARDANDO_APROVACAO" && !isExpired(os)) {
        foot = '<button class="btn" data-act="set-status" data-id="' + os.id + '" data-to="REPROVADO">Reprovar</button>' +
               '<button class="btn btn--primary" data-act="set-status" data-id="' + os.id + '" data-to="APROVADA">Aprovar orçamento</button>';
      }
    } else {
      var trs = transitionsFor(os);
      foot = trs.map(function (to) {
        var primary = (to === "AGUARDANDO_APROVACAO" || to === "APROVADA" || to === "ENTREGUE");
        return '<button class="btn ' + (primary ? "btn--primary" : "") + '" data-act="set-status" data-id="' + os.id + '" data-to="' + to + '">' + esc(TRANS_LABEL[to] || to) + '</button>';
      }).join("");
    }

    return '<div class="modal-back" data-act="close-modal-bg"><div class="modal">' +
      '<div class="modal-head"><div><h2 class="card-title">' + esc(os.number) + '</h2><div style="margin-top:4px">' + badge(displayStatus(os)) + '</div></div>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Fechar">&#215;</button></div>' +
      '<div class="modal-body">' + body + '</div>' +
      (foot ? '<div class="modal-foot">' + foot + '</div>' : "") +
      '</div></div>';
  }
  function infoBox(label, value) {
    return '<div><div class="muted" style="font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;font-weight:700">' + esc(label) + '</div><div>' + esc(value) + '</div></div>';
  }
  function itemsTable(os, editable) {
    if (!os.items.length) return '<div class="empty" style="padding:16px">Nenhum item. Adicione serviços ou peças abaixo.</div>';
    return '<table><thead><tr><th>Tipo</th><th>Descrição</th><th class="num">Qtd</th><th class="num">Preço</th><th class="num">Subtotal</th>' + (editable ? '<th></th>' : "") + '</tr></thead><tbody>' +
      os.items.map(function (i, idx) {
        return '<tr><td>' + (i.type === "LABOR" ? "Serviço" : "Peça") + '</td>' +
          '<td>' + esc(i.name) + '</td>' +
          '<td class="num">' + n2(i.qty) + '</td>' +
          '<td class="num">' + money(i.unitPrice) + '</td>' +
          '<td class="num">' + money(n2(i.qty) * n2(i.unitPrice)) + '</td>' +
          (editable ? '<td><button class="btn btn--sm" data-act="del-item" data-id="' + os.id + '" data-idx="' + idx + '">Remover</button></td>' : "") +
        '</tr>';
      }).join("") + '</tbody></table>';
  }
  function addItemForm(os) {
    var svc = db.services.map(function (s) {
      return '<option value="LABOR:' + s.id + '">' + esc(s.code + " · " + s.name + " · " + money(s.price)) + '</option>';
    }).join("");
    var prt = db.parts.map(function (p) {
      return '<option value="PART:' + p.id + '">' + esc(p.sku + " · " + p.name + " · " + money(p.price) + " · disp. " + availableForPart(p.id)) + '</option>';
    }).join("");
    return '<form id="form-add-item" class="inline" style="margin-top:14px" data-id="' + os.id + '">' +
      '<div class="field" style="flex:2"><label>Serviço ou peça</label><select name="item"><optgroup label="Serviços">' + svc + '</optgroup><optgroup label="Peças">' + prt + '</optgroup></select></div>' +
      '<div class="field" style="flex:0 0 90px"><label>Qtd</label><input name="qty" type="number" min="1" step="1" value="1"></div>' +
      '<button class="btn btn--primary" type="submit">Adicionar</button>' +
      '</form>';
  }

  /* ============================================================
     8. Portal do cliente
     ============================================================ */
  function renderClientApp(user) {
    if (!state.view) state.view = "minhasos";
    var orders = db.orders.filter(function (o) { return o.customerId === user.customerId; });
    var cards = orders.length ? orders.map(function (o) {
      var m = findMoto(o.motorcycleId);
      return '<section class="card" style="margin-bottom:12px"><div class="card-body" style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">' +
        '<div><strong>' + esc(o.number) + '</strong> ' + badge(displayStatus(o)) +
          '<div class="cell-sub">' + esc(m ? (m.brand + " " + m.model + " · " + m.plate) : "") + '</div>' +
          '<div class="cell-sub">Aberta em ' + fmtDate(o.createdAt) + ' · Total ' + money(orderTotal(o)) + '</div></div>' +
        '<button class="btn" data-act="open-order" data-id="' + o.id + '">Ver detalhes</button>' +
      '</div></section>';
    }).join("") : '<div class="empty">Você ainda não tem ordens de serviço.</div>';

    document.getElementById("app").innerHTML =
      '<div class="app">' + topbar(user, [{ id: "minhasos", label: "Minhas O.S." }], "minhasos") +
      '<div class="content">' + viewHead("Minhas O.S.", "Acompanhe suas ordens e aprove orçamentos") + cards + '</div></div>';
  }

  /* ============================================================
     9. Formularios extras (novo orcamento, cliente, moto, peca, servico)
     ============================================================ */
  function newOrderModal() {
    var opts = db.customers.map(function (c) {
      var motos = db.motorcycles.filter(function (m) { return m.customerId === c.id; });
      if (!motos.length) return "";
      return '<optgroup label="' + esc(c.name) + '">' + motos.map(function (m) {
        return '<option value="' + m.id + '">' + esc(m.brand + " " + m.model + " · " + m.plate) + '</option>';
      }).join("") + '</optgroup>';
    }).join("");
    var body =
      '<form id="form-new-order">' +
        field("Moto", '<select name="motorcycleId" required>' + (opts || '<option value="">Nenhuma moto cadastrada</option>') + '</select>') +
        '<div class="row2">' +
          field("KM de entrada", '<input name="km" type="number" min="0" required placeholder="ex.: 24500">') +
          field("Queixa / defeito", '<input name="complaint" placeholder="relato do cliente">') +
        '</div>' +
        '<div class="alert alert--info">O orçamento já nasce com validade de 7 dias (pode alterar depois).</div>' +
      '</form>';
    openModal(modalShell("Nova O.S. / Orçamento", body,
      '<button class="btn" data-act="close-modal">Cancelar</button><button class="btn btn--primary" data-act="submit-form" data-form="form-new-order">Criar</button>'));
  }
  function newCustomerModal() {
    var body = '<form id="form-new-customer">' +
      field("Nome", '<input name="name" required>') +
      '<div class="row2">' + field("Telefone", '<input name="phone">') + field("CPF/CNPJ", '<input name="doc">') + '</div>' +
      field("E-mail", '<input name="email" type="email">') +
      '</form>';
    openModal(modalShell("Novo cliente", body,
      '<button class="btn" data-act="close-modal">Cancelar</button><button class="btn btn--primary" data-act="submit-form" data-form="form-new-customer">Salvar</button>'));
  }
  function newMotoModal(customerId) {
    var body = '<form id="form-new-moto" data-customer="' + customerId + '">' +
      '<div class="row2">' + field("Marca", '<input name="brand" required>') + field("Modelo", '<input name="model" required>') + '</div>' +
      '<div class="row3">' + field("Ano", '<input name="year" type="number" min="1900" required>') + field("Placa", '<input name="plate" required>') + field("Cilindrada", '<input name="cc" type="number" min="0">') + '</div>' +
      field("Chassi", '<input name="chassi">') +
      '<div class="row2">' + field("Cor", '<input name="color">') + field("KM atual", '<input name="km" type="number" min="0" value="0">') + '</div>' +
      '</form>';
    openModal(modalShell("Nova moto", body,
      '<button class="btn" data-act="close-modal">Cancelar</button><button class="btn btn--primary" data-act="submit-form" data-form="form-new-moto">Salvar</button>'));
  }
  function newServiceModal() {
    var body = '<form id="form-new-service">' +
      '<div class="row2">' + field("Código", '<input name="code" placeholder="SV-007">') + field("Nome", '<input name="name" required>') + '</div>' +
      '<div class="row2">' + field("Preço (R$)", '<input name="price" type="number" min="0" step="0.01" required>') + field("Tempo padrão (min)", '<input name="timeStd" type="number" min="0">') + '</div>' +
      '</form>';
    openModal(modalShell("Novo serviço", body,
      '<button class="btn" data-act="close-modal">Cancelar</button><button class="btn btn--primary" data-act="submit-form" data-form="form-new-service">Salvar</button>'));
  }
  function newPartModal() {
    var body = '<form id="form-new-part">' +
      '<div class="row2">' + field("SKU", '<input name="sku" required>') + field("Nome", '<input name="name" required>') + '</div>' +
      '<div class="row2">' + field("Marca", '<input name="brand">') + field("Localização", '<input name="location" placeholder="prateleira">') + '</div>' +
      '<div class="row3">' +
        field("Preço (R$)", '<input name="price" type="number" min="0" step="0.01" required>') +
        field("Estoque", '<input name="qty" type="number" min="0" value="0">') +
        field("Mínimo", '<input name="minQty" type="number" min="0" value="0">') +
      '</div>' +
      '</form>';
    openModal(modalShell("Nova peça", body,
      '<button class="btn" data-act="close-modal">Cancelar</button><button class="btn btn--primary" data-act="submit-form" data-form="form-new-part">Salvar</button>'));
  }
  function modalShell(title, body, foot) {
    return '<div class="modal-back" data-act="close-modal-bg"><div class="modal">' +
      '<div class="modal-head"><h2 class="card-title">' + esc(title) + '</h2>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Fechar">&#215;</button></div>' +
      '<div class="modal-body">' + body + '</div>' +
      (foot ? '<div class="modal-foot">' + foot + '</div>' : "") + '</div></div>';
  }
  function formToObject(form) {
    var o = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      o[el.name] = el.value;
    });
    return o;
  }

  /* ============================================================
     10. Eventos
     ============================================================ */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");

    if (act === "login-tab") { state.loginTab = el.getAttribute("data-tab"); renderLogin(); return; }
    if (act === "nav") { e.preventDefault(); navigate(el.getAttribute("data-view")); return; }
    if (act === "logout") { setSession(null); state.view = null; render(); return; }
    if (act === "orc-tab") { state.orcTab = el.getAttribute("data-tab"); render(); return; }

    if (act === "open-order") { state.openOrderId = el.getAttribute("data-id"); state.modal = null; render(); return; }
    if (act === "close-modal" || act === "close-modal-bg") {
      if (act === "close-modal-bg" && e.target !== el) return;
      closeModal(); return;
    }

    if (act === "new-order") { newOrderModal(); return; }
    if (act === "new-customer") { newCustomerModal(); return; }
    if (act === "new-moto") { newMotoModal(el.getAttribute("data-id")); return; }
    if (act === "new-service") { newServiceModal(); return; }
    if (act === "new-part") { newPartModal(); return; }

    if (act === "submit-form") {
      var form = document.getElementById(el.getAttribute("data-form"));
      if (form) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      return;
    }

    if (act === "set-status") {
      var os = findOrder(el.getAttribute("data-id"));
      var to = el.getAttribute("data-to");
      if (!os) return;
      if ((to === "CANCELADO" || to === "REPROVADO") && !window.confirm("Confirmar mudança para \"" + (STATUS[to] ? STATUS[to].label : to) + "\"?")) return;
      if (setStatus(os, to)) {
        toast("O.S. " + os.number + " → " + (STATUS[to] ? STATUS[to].label : to));
        if (to === "ENTREGUE" || to === "CANCELADO" || to === "REPROVADO") closeModal();
        else render();
      }
      return;
    }

    if (act === "del-item") {
      var osd = findOrder(el.getAttribute("data-id"));
      var idx = parseInt(el.getAttribute("data-idx"), 10);
      if (!osd || !canEditItems(osd)) return;
      osd.items.splice(idx, 1);
      if (osd.status === "AGUARDANDO_APROVACAO") osd.status = "ORCAMENTO";
      persist(); render();
      return;
    }

    if (act === "save-quote") {
      var osq = findOrder(el.getAttribute("data-id"));
      if (!osq) return;
      osq.discount = n2(document.getElementById("f-discount").value);
      var v = document.getElementById("f-valid").value;
      osq.validUntil = v || null;
      persist(); toast("Orçamento atualizado."); render();
      return;
    }

    if (act === "stock-move") {
      var part = findPart(el.getAttribute("data-id"));
      if (!part) return;
      var dir = el.getAttribute("data-dir");
      var qtyStr = window.prompt((dir === "in" ? "Entrada" : "Saída") + " de estoque para " + part.name + " (atual: " + n2(part.qty) + "):", "1");
      if (qtyStr == null) return;
      var q = parseInt(qtyStr, 10);
      if (isNaN(q) || q <= 0) { toast("Quantidade inválida.", "err"); return; }
      if (dir === "in") part.qty = n2(part.qty) + q;
      else {
        var avail = availableForPart(part.id);
        if (q > avail) { toast("Falta no estoque (disponível: " + avail + ").", "err"); return; }
        part.qty = Math.max(0, n2(part.qty) - q);
      }
      persist(); toast("Estoque de " + part.name + " atualizado."); render();
      return;
    }

    if (act === "reset-data") {
      if (window.confirm("Restaurar os dados de exemplo? Suas alterações serão perdidas.")) {
        resetDB(); setSession(null); state.view = null; toast("Dados restaurados."); render();
      }
      return;
    }
  });

  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form.id) return;
    e.preventDefault();

    if (form.id === "form-login-staff") {
      var d = formToObject(form);
      var u = db.users.filter(function (x) { return x.email.toLowerCase() === (d.email || "").toLowerCase() && x.role === "FUNCIONARIO"; })[0];
      if (!u || u.password !== d.password) { toast("E-mail ou senha inválidos.", "err"); return; }
      setSession({ userId: u.id }); state.view = null; toast("Bem-vindo, " + u.name + "!"); render();
      return;
    }

    if (form.id === "form-login-client") {
      var dc = formToObject(form);
      var email = (dc.email || "").toLowerCase();
      var existing = db.users.filter(function (x) { return x.email.toLowerCase() === email; })[0];
      if (existing) {
        if (existing.role !== "CLIENTE" || existing.password !== dc.password) { toast("E-mail ou senha inválidos.", "err"); return; }
        setSession({ userId: existing.id }); state.view = null; toast("Bem-vindo, " + existing.name + "!"); render();
      } else {
        if (!dc.name || dc.name.trim().length < 2) { toast("Informe seu nome para criar a conta.", "err"); return; }
        var cust = { id: uid("c"), name: dc.name.trim(), email: dc.email, phone: dc.phone || "", doc: "", address: "", lgpd: true };
        db.customers.push(cust);
        var nu = { id: uid("u"), name: cust.name, email: dc.email, password: dc.password, role: "CLIENTE", customerId: cust.id };
        db.users.push(nu);
        persist(); setSession({ userId: nu.id }); state.view = null; toast("Conta criada. Bem-vindo!" ); render();
      }
      return;
    }

    if (form.id === "form-add-item") {
      var os = findOrder(form.getAttribute("data-id"));
      if (!os || !canEditItems(os)) return;
      var fo = formToObject(form);
      var parts = (fo.item || "").split(":");
      var type = parts[0], refId = parts[1], qty = Math.max(1, parseInt(fo.qty, 10) || 1);
      var name, price;
      if (type === "LABOR") {
        var svc = db.services.filter(function (s) { return s.id === refId; })[0];
        if (!svc) return;
        name = svc.name; price = n2(svc.price);
      } else {
        var part = findPart(refId);
        if (!part) return;
        var avail = availableForPart(part.id);
        if (qty > avail) { toast("Falta no estoque: disponível " + avail + " un. de " + part.name + ".", "err"); return; }
        name = part.name; price = n2(part.price);
      }
      os.items.push({ type: type, refId: refId, name: name, qty: qty, unitPrice: price });
      if (os.status === "ABERTA" || os.status === "AGUARDANDO_APROVACAO") os.status = "ORCAMENTO";
      persist(); toast("Item adicionado."); render();
      return;
    }

    if (form.id === "form-new-order") {
      var no = formToObject(form);
      var moto = findMoto(no.motorcycleId);
      if (!moto) { toast("Selecione uma moto.", "err"); return; }
      if (no.km === "" || no.km == null) { toast("Informe a KM de entrada.", "err"); return; }
      var d2 = new Date(); d2.setDate(d2.getDate() + 7);
      var order = {
        id: uid("o"), number: "OS-" + (db.seq.order++), customerId: moto.customerId, motorcycleId: moto.id,
        status: "ABERTA", kmEntry: parseInt(no.km, 10), complaint: no.complaint || "",
        discount: 0, reserved: false, createdAt: nowLocal(), startedAt: null, finishedAt: null, deliveredAt: null,
        validUntil: d2.toISOString().slice(0, 10), items: []
      };
      // atualiza a km da moto (km informada na abertura)
      moto.km = Math.max(n2(moto.km), n2(order.kmEntry));
      db.orders.push(order); persist();
      state.modal = null; state.openOrderId = order.id;
      toast("O.S. " + order.number + " aberta. Adicione itens."); render();
      return;
    }

    if (form.id === "form-new-customer") {
      var c = formToObject(form);
      db.customers.push({ id: uid("c"), name: c.name, email: c.email, phone: c.phone, doc: c.doc, address: "", lgpd: false });
      persist(); state.modal = null; toast("Cliente cadastrado."); render();
      return;
    }

    if (form.id === "form-new-moto") {
      var mo = formToObject(form);
      var cid = form.getAttribute("data-customer");
      db.motorcycles.push({
        id: uid("m"), customerId: cid, brand: mo.brand, model: mo.model, year: parseInt(mo.year, 10) || 0,
        plate: mo.plate.toUpperCase(), chassi: mo.chassi || "", cc: parseInt(mo.cc, 10) || 0, color: mo.color || "", km: parseInt(mo.km, 10) || 0
      });
      persist(); state.modal = null; toast("Moto cadastrada."); render();
      return;
    }

    if (form.id === "form-new-service") {
      var s = formToObject(form);
      db.services.push({ id: uid("s"), code: s.code || "SV", name: s.name, price: n2(s.price), timeStd: parseInt(s.timeStd, 10) || 0 });
      persist(); state.modal = null; toast("Serviço cadastrado."); render();
      return;
    }

    if (form.id === "form-new-part") {
      var p = formToObject(form);
      db.parts.push({ id: uid("p"), sku: p.sku.toUpperCase(), name: p.name, brand: p.brand || "", unit: "UN",
        price: n2(p.price), qty: parseInt(p.qty, 10) || 0, minQty: parseInt(p.minQty, 10) || 0, location: p.location || "" });
      persist(); state.modal = null; toast("Peça cadastrada."); render();
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && (state.modal || state.openOrderId)) closeModal();
  });

  /* ============================================================
     11. Inicio
     ============================================================ */
  var startUser = currentUser();
  state.view = startUser ? defaultView(startUser) : null;
  render();
})();
