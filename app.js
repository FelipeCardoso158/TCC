/* =====================================================================
   SGOM - Sistema de Gerenciamento para Oficina de Motos
   app.js - roteador, telas e regras de negocio do prototipo.

   Tudo roda no navegador (sem servidor). Os dados ficam no localStorage.
   ===================================================================== */
(function () {
  "use strict";

  var DB_KEY = "sgom_db_v1";
  var SESSION_KEY = "sgom_session_v1";
  var THEME_KEY = "sgom_theme_v1";

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
  function fixAccents(s) {
    return String(s == null ? "" : s)
      .replace(/\bOleo\b/g, "Óleo")
      .replace(/\boleo\b/g, "óleo")
      .replace(/\bRevisao\b/g, "Revisão")
      .replace(/\brevisao\b/g, "revisão")
      .replace(/\bValvulas\b/g, "Válvulas")
      .replace(/\bvalvulas\b/g, "válvulas")
      .replace(/\bRelacao\b/g, "Relação")
      .replace(/\brelacao\b/g, "relação")
      .replace(/\bInjecao\b/g, "Injeção")
      .replace(/\binjecao\b/g, "injeção")
      .replace(/\bIgnicao\b/g, "Ignição")
      .replace(/\bignicao\b/g, "ignição")
      .replace(/\bJoao\b/g, "João");
  }
  function fixField(owner, key) {
    if (typeof owner[key] !== "string") return false;
    var fixed = fixAccents(owner[key]);
    if (fixed === owner[key]) return false;
    owner[key] = fixed;
    return true;
  }
  function migrateAccents() {
    var changed = false;
    (db.services || []).forEach(function (s) { changed = fixField(s, "name") || changed; });
    (db.parts || []).forEach(function (p) { changed = fixField(p, "name") || changed; });
    (db.users || []).forEach(function (u) { changed = fixField(u, "name") || changed; });
    (db.customers || []).forEach(function (c) { changed = fixField(c, "name") || changed; });
    (db.orders || []).forEach(function (o) {
      changed = fixField(o, "complaint") || changed;
      (o.items || []).forEach(function (i) { changed = fixField(i, "name") || changed; });
    });
    (db.appointments || []).forEach(function (a) {
      changed = fixField(a, "service") || changed;
      changed = fixField(a, "complaint") || changed;
    });
    if (changed) persist();
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

  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; }
    catch (e) { return "light"; }
  }
  function applyTheme(theme) {
    var t = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* sem localStorage */ }
    var meta = document.getElementById("theme-color-meta");
    if (meta) meta.setAttribute("content", t === "dark" ? "#0f1215" : "#f8f9fa");
    updateThemeButtons();
  }
  function toggleTheme() {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  }
  function updateThemeButtons() {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-toggle]"), function (btn) {
      btn.innerHTML = isDark ? icon("sun", 18) : icon("moon", 18);
      btn.setAttribute("aria-label", isDark ? "Ativar tema claro" : "Ativar tema escuro");
      btn.setAttribute("title", isDark ? "Tema claro" : "Tema escuro");
    });
  }

  function migrateStructure() {
    var changed = false;
    if (!Array.isArray(db.appointments)) { db.appointments = clone(window.SGOM_SEED.appointments || []); changed = true; }
    if (!db.seq) { db.seq = clone(window.SGOM_SEED.seq || {}); changed = true; }
    if (!db.seq.appointment) { db.seq.appointment = 1011; changed = true; }
    var seedCosts = {};
    (window.SGOM_SEED.parts || []).forEach(function (p) { seedCosts[p.id] = n2(p.cost); });
    (db.parts || []).forEach(function (p) {
      if (p.cost == null || isNaN(Number(p.cost))) {
        p.cost = seedCosts[p.id] != null ? seedCosts[p.id] : 0;
        changed = true;
      }
    });
    if (changed) persist();
  }

  var db = loadDB();
  migrateStructure();
  migrateAccents();
  var state = {
    view: null, modal: null, openOrderId: null, orcTab: "ativos", loginTab: "staff", clientMode: "entrar", publicView: "landing",
    search: "", searchOpen: false,
    clientQuery: "",
    chatOpen: false,
    chatMessages: [],
    fin: { period: "mes", from: "", to: "" },
    agenda: { mode: "mes", cursor: todayISO() }
  };

  /* ============================================================
     2. Utilitarios
     ============================================================ */
  function uid(prefix) { return prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function normText(s) {
    return String(s == null ? "" : s).toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function normPlate(s) {
    return normText(s).replace(/[^a-z0-9]/g, "").toUpperCase();
  }
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function money(v) { return brl.format(Number(v) || 0); }
  function n2(v) { return Number(v) || 0; }
  function todayISO() { return isoFromDate(new Date()); }
  function nowLocal() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  function fmtDate(iso) {
    if (!iso) return "-";
    var s = String(iso), d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      var p = s.split("-");
      d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    } else {
      d = new Date(s);
    }
    return isNaN(d) ? esc(iso) : d.toLocaleDateString("pt-BR");
  }
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
  function partUnitCost(item) {
    if (item && item.unitCost != null) return n2(item.unitCost);
    var part = item ? findPart(item.refId) : null;
    return part ? n2(part.cost) : 0;
  }

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
  function ordersWithPart(partId) {
    return db.orders.filter(function (o) {
      return (o.items || []).some(function (i) { return i.type === "PART" && i.refId === partId; });
    });
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

  function setStatus(os, to, meta) {
    var from = os.status;
    if (to === "AGUARDANDO_APROVACAO" && os.items.length === 0) { toast("Adicione ao menos um item antes de enviar.", "err"); return false; }
    if (to === "APROVADA") { os.reserved = true; os.approvedAt = nowLocal(); }
    if (to === "EM_EXECUCAO" && !os.startedAt) os.startedAt = nowLocal();
    if (to === "PRONTO" && !os.finishedAt) os.finishedAt = nowLocal();
    if (to === "ENTREGUE") { deliverStock(os); os.deliveredAt = nowLocal(); os.reserved = false; }
    if (to === "CANCELADO" || to === "REPROVADO") os.reserved = false;
    if (to === "REPROVADO") {
      os.rejectReason = (meta && meta.reason) || "";
      os.rejectedAt = nowLocal();
    }
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
    state.searchOpen = false;
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    var user = currentUser();
    if (!user) {
      if (state.publicView === "login") renderLogin();
      else renderLanding();
      renderModals(null);
      updateThemeButtons();
      chatOpenAfterRender();
      return;
    }
    if (user.role === "CLIENTE") renderClientApp(user);
    else renderStaffApp(user);
    renderModals(user);
    updateThemeButtons();
    chatOpenAfterRender();
  }

  function renderModals(user) {
    var root = document.getElementById("modal-root");
    if (user && state.openOrderId) {
      var os = findOrder(state.openOrderId);
      if (os) { root.innerHTML = orderModalHTML(os, user); return; }
      state.openOrderId = null;
    }
    root.innerHTML = state.modal || "";
  }
  function openModal(html) { state.modal = html; state.openOrderId = null; render(); }
  function closeModal() { state.modal = null; state.openOrderId = null; render(); }

  function clearAuthHash() {
    if (String(location.hash || "").indexOf("#/login") === 0) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }
  function goLogin(tab, signup) {
    state.publicView = "login";
    state.loginTab = tab === "client" ? "client" : "staff";
    state.clientMode = signup ? "cadastro" : "entrar";
    state.modal = null;
    state.openOrderId = null;
    state.searchOpen = false;
    var target = tab === "client" ? "#/login/cliente" : "#/login";
    if (location.hash !== target) location.hash = target;
    else render();
    window.scrollTo(0, 0);
  }
  function goLanding() {
    state.publicView = "landing";
    state.modal = null;
    state.openOrderId = null;
    state.searchOpen = false;
    state.clientMode = "entrar";
    state.clientQuery = "";
    clearAuthHash();
    render();
    window.scrollTo(0, 0);
  }
  function accessModalHTML() {
    return modalShell("Entrar no SGOM",
      '<p class="muted" style="margin-top:0">Escolha como deseja acessar o sistema.</p>' +
      '<div class="access-options">' +
        '<button type="button" class="access-option" data-act="access-client">' +
          '<span class="landing-icon">' + icon("bike", 22) + '</span>' +
          '<strong>Área do Cliente</strong>' +
          '<span>Entre para acompanhar suas O.S. e aprovar orçamentos</span>' +
        '</button>' +
        '<button type="button" class="access-option" data-act="access-staff">' +
          '<span class="landing-icon">' + icon("wrench", 22) + '</span>' +
          '<strong>Área do Funcionário</strong>' +
          '<span>Acesso exclusivo da equipe da oficina</span>' +
        '</button>' +
      '</div>',
      '<button class="btn" data-act="close-modal">Fechar</button>');
  }

  /* ============================================================
     5. Tela de login
     ============================================================ */
  function renderLogin() {
    var app = document.getElementById("app");
    var isStaff = state.loginTab !== "client";
    app.innerHTML =
      '<div class="login-wrap"><div class="login-card">' +
        '<div class="login-head">' +
          '<span class="brand-mark">' + brandMark(48) + '</span>' +
          '<h1>SGOM</h1>' +
          '<p>' + (isStaff ? 'Acesso exclusivo da equipe da oficina' : 'Acompanhe suas ordens de serviço') + '</p>' +
        '</div>' +
        '<div class="login-body">' +
          '<button type="button" class="login-back" data-act="landing-back">&#8592; Voltar ao início</button>' +
          (isStaff ? loginStaffHTML() : loginClientHTML()) +
        '</div>' +
      '</div></div>';
  }

  function loginStaffHTML() {
    return '<form id="form-login-staff" autocomplete="off">' +
      field("Usuário", '<input name="email" type="text" required placeholder="funcionario@sgom" autocomplete="username">') +
      field("Senha", '<input name="password" type="password" required placeholder="sua senha" autocomplete="current-password">') +
      '<button class="btn btn--primary" style="width:100%" type="submit">Entrar</button>' +
      '<div class="hint">Acesso de demonstração: <code>funcionario@sgom</code> / <code>sgom123</code></div>' +
      '</form>';
  }
  function loginClientHTML() {
    var isSignup = state.clientMode === "cadastro";
    var subToggle =
      '<div class="tabs" style="margin-bottom:14px">' +
        '<button type="button" data-act="client-mode" data-mode="entrar" class="' + (isSignup ? "" : "active") + '">Entrar</button>' +
        '<button type="button" data-act="client-mode" data-mode="cadastro" class="' + (isSignup ? "active" : "") + '">Criar conta</button>' +
      '</div>';

    if (isSignup) {
      return subToggle +
        '<form id="form-signup-client" autocomplete="off">' +
        '<p class="muted" style="font-size:13px;margin-top:0">Crie sua conta para acompanhar suas O.S. e aprovar orçamentos.</p>' +
        field("Nome", '<input name="name" required placeholder="Seu nome completo">') +
        field("E-mail", '<input name="email" type="email" required placeholder="voce@email.com">') +
        field("Telefone", '<input name="phone" placeholder="(48) 99842-5702">') +
        field("Senha", '<input name="password" type="password" required placeholder="mínimo de 4 caracteres">') +
        field("Confirmar senha", '<input name="password2" type="password" required placeholder="digite a senha novamente">') +
        '<button class="btn btn--primary" style="width:100%" type="submit">Criar conta e entrar</button>' +
        '<div class="hint">Já tem conta? Clique em <strong>Entrar</strong> acima.</div>' +
        '</form>';
    }

    return subToggle +
      '<form id="form-login-client" autocomplete="off">' +
      field("E-mail", '<input name="email" type="email" required placeholder="voce@email.com">') +
      field("Senha", '<input name="password" type="password" required placeholder="sua senha">') +
      '<button class="btn btn--primary" style="width:100%" type="submit">Entrar</button>' +
      '<div class="hint">Dica: para ver O.S. de exemplo, entre com <code>joao@email.com</code> / <code>123</code>.</div>' +
      '</form>';
  }

  function field(label, input, hint) {
    return '<div class="field"><label>' + esc(label) + (hint ? ' <span class="muted">(' + esc(hint) + ')</span>' : "") + '</label>' + input + '</div>';
  }
  function brandMark(size) {
    var s = Math.max(16, Math.round(Number(size) || 48));
    return '<img src="logo-sgom.png" alt="Logo SGOM" width="' + s + '" height="' + s + '">';
  }

  function icon(name, size) {
    var paths = {
      bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
      wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
      gauge: '<path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
      box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
      badge: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M5.5 17.5h7"/><path d="M15.5 11.5h3.5"/><path d="M15.5 15h3.5"/>',
      list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
      file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      plus: '<path d="M5 12h14M12 5v14"/>',
      logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
      chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
      chart: '<path d="M3 3v18h18"/><path d="M7 15v2"/><path d="M12 11v6"/><path d="M17 7v10"/>',
      pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
      moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
      chevron: '<path d="m6 9 6 6 6-6"/>'
    };
    var s = size || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || "") + "</svg>";
  }

  function whatsappIcon(size) {
    var s = size || 24;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>' +
    '</svg>';
  }

  /* ============================================================
     5.1 Landing page publica
     ============================================================ */
  function renderLanding() {
    document.getElementById("app").innerHTML =
      '<div class="landing">' +
        '<a class="landing-skip" href="#inicio">Ir para o conteudo</a>' +
        landingHeader() +
        '<main>' +
          landingHero() +
          landingAbout() +
          landingServices() +
          landingContact() +
        '</main>' +
        landingFooter() +
        landingChatWidget() +
      '</div>';
  }

  function landingHeader() {
    return '<header class="landing-header">' +
      '<div class="landing-header-inner">' +
        '<a class="landing-brand" href="#inicio" data-act="landing-close" aria-label="SGOM - inicio">' +
          '<span class="brand-mark">' + brandMark(40) + '</span>' +
          '<span class="landing-brand-text"><strong>SGOM</strong><span>Oficina de Motos</span></span>' +
        '</a>' +
        '<nav class="landing-nav" id="landing-nav" aria-label="Navegacao principal">' +
          '<a href="#inicio" data-act="landing-close">Início</a>' +
          '<a href="#sobre" data-act="landing-close">Sobre nós</a>' +
          '<a href="#servicos" data-act="landing-close">Serviços</a>' +
          '<a href="#contatos" data-act="landing-close">Contatos</a>' +
          '<button class="btn btn--primary landing-nav-cta" type="button" data-act="access-open">Entrar</button>' +
        '</nav>' +
        '<button class="theme-toggle" type="button" data-theme-toggle data-act="theme-toggle"></button>' +
        '<button class="landing-menu-btn" type="button" data-act="landing-menu" aria-expanded="false" aria-controls="landing-nav" aria-label="Abrir menu">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>' +
    '</header>';
  }

  function landingHero() {
    return '<section class="landing-hero" id="inicio">' +
      '<div class="landing-hero-glow" aria-hidden="true"></div>' +
      '<div class="landing-container landing-hero-grid">' +
        '<div class="landing-hero-copy">' +
          '<span class="landing-eyebrow">Gestão para oficinas de motos</span>' +
          '<h1>Sua oficina organizada <span>do orçamento à entrega.</span></h1>' +
          '<p>O SGOM centraliza estoque, atendimentos e ordens de serviço em uma interface simples. Menos planilhas, mais controle sobre cada moto que passa pela sua oficina.</p>' +
          '<div class="landing-hero-actions">' +
            '<button class="btn btn--primary btn--lg" type="button" data-act="access-open">Entrar</button>' +
            '<a class="btn btn--lg landing-btn-ghost" href="#servicos">Conhecer os serviços</a>' +
          '</div>' +
          '<ul class="landing-hero-points">' +
            '<li>' + icon("box", 16) + ' Estoque com reserva e baixa</li>' +
            '<li>' + icon("file", 16) + ' Orçamentos com aprovação</li>' +
            '<li>' + icon("gauge", 16) + ' Acompanhamento em tempo real</li>' +
          '</ul>' +
        '</div>' +
        '<div class="landing-hero-visual" aria-hidden="true">' +
          '<div class="landing-feature-card">' +
            '<div class="landing-feature-head">' +
              '<span class="landing-feature-logo">' + icon("gauge", 24) + '</span>' +
              '<div><strong>SGOM</strong><span>Gestão completa da oficina</span></div>' +
            '</div>' +
            '<div class="landing-feature-grid">' +
              '<div class="landing-feature-item"><span class="landing-icon">' + icon("box", 18) + '</span><strong>Estoque</strong><span>Peças, reservas e alertas</span></div>' +
              '<div class="landing-feature-item"><span class="landing-icon">' + icon("wrench", 18) + '</span><strong>Atendimentos</strong><span>O.S. organizadas por etapa</span></div>' +
              '<div class="landing-feature-item"><span class="landing-icon">' + icon("file", 18) + '</span><strong>Orçamentos</strong><span>Aprovação do cliente</span></div>' +
              '<div class="landing-feature-item"><span class="landing-icon">' + icon("chart", 18) + '</span><strong>Financeiro</strong><span>Receita e custos</span></div>' +
            '</div>' +
            '<div class="landing-feature-footer"><span class="dot"></span><span>Informações atualizadas em tempo real</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function landingAbout() {
    return '<section class="landing-section" id="sobre">' +
      '<div class="landing-container">' +
        '<div class="landing-section-head">' +
          '<span class="landing-eyebrow landing-eyebrow--dark">Sobre nós</span>' +
          '<h2>Tecnologia para o dia a dia da oficina</h2>' +
          '<p>O SGOM foi pensado para oficinas de motocicletas que precisam de controle sem complicação. Reunimos as rotinas essenciais em um só sistema, do cadastro do cliente à entrega da moto.</p>' +
        '</div>' +
        '<div class="landing-about-grid">' +
          '<article class="landing-about-card">' +
            '<span class="landing-icon">' + icon("gauge", 22) + '</span>' +
            '<h3>Visão completa</h3>' +
            '<p>Acompanhe o andamento de cada atendimento e identifique rapidamente o que precisa de atenção.</p>' +
          '</article>' +
          '<article class="landing-about-card">' +
            '<span class="landing-icon">' + icon("box", 22) + '</span>' +
            '<h3>Estoque sob controle</h3>' +
            '<p>Saiba o que está disponível, o que está reservado e quando é hora de repor peças.</p>' +
          '</article>' +
          '<article class="landing-about-card">' +
            '<span class="landing-icon">' + icon("users", 22) + '</span>' +
            '<h3>Relação transparente</h3>' +
            '<p>O cliente acompanha o orçamento e aprova ou reprova com o motivo, sem ruído na comunicação.</p>' +
          '</article>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function landingServices() {
    return '<section class="landing-section landing-section--alt" id="servicos">' +
      '<div class="landing-container">' +
        '<div class="landing-section-head">' +
          '<span class="landing-eyebrow landing-eyebrow--dark">Serviços</span>' +
          '<h2>O que já está funcionando</h2>' +
          '<p>Módulos prontos para a operação da oficina, com regras de negócio pensadas para o dia a dia.</p>' +
        '</div>' +
        '<div class="landing-cards">' +
          '<article class="landing-card">' +
            '<span class="landing-icon">' + icon("box", 24) + '</span>' +
            '<h3>Controle de Estoque</h3>' +
            '<p>Entradas e saídas de peças, reserva automática ao aprovar orçamentos e alerta de estoque mínimo.</p>' +
            '<ul class="landing-list">' +
              '<li>Entrada e saída com validação</li>' +
              '<li>Reserva ao aprovar orçamento</li>' +
              '<li>Alerta de estoque crítico</li>' +
            '</ul>' +
          '</article>' +
          '<article class="landing-card">' +
            '<span class="landing-icon">' + icon("wrench", 24) + '</span>' +
            '<h3>Atendimentos</h3>' +
            '<p>Abertura de O.S., acompanhamento por etapas e visão em kanban de tudo o que está em execução.</p>' +
            '<ul class="landing-list">' +
              '<li>Abertura com KM de entrada</li>' +
              '<li>Kanban por status</li>' +
              '<li>Histórico por cliente e moto</li>' +
            '</ul>' +
          '</article>' +
          '<article class="landing-card">' +
            '<span class="landing-icon">' + icon("file", 24) + '</span>' +
            '<h3>Ordens de Serviço</h3>' +
            '<p>Orçamentos com serviços e peças, desconto, validade e aprovação do cliente.</p>' +
            '<ul class="landing-list">' +
              '<li>Itens de serviço e peça</li>' +
              '<li>Desconto e validade</li>' +
              '<li>Aprovação ou reprovação com motivo</li>' +
            '</ul>' +
          '</article>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function landingContact() {
    return '<section class="landing-section" id="contatos">' +
      '<div class="landing-container landing-contact-grid">' +
        '<div class="landing-contact-copy">' +
          '<span class="landing-eyebrow landing-eyebrow--dark">Contatos</span>' +
          '<h2>Fale com a gente</h2>' +
          '<p>Tem dúvidas sobre o sistema ou quer acompanhar sua moto? Use um dos canais abaixo.</p>' +
          '<div class="landing-location-card">' +
            '<img class="landing-location-photo" src="oficina.png" alt="Fachada da oficina SGOM" loading="lazy" width="1440" height="1081">' +
            '<div class="landing-contact-list">' +
              '<div class="landing-contact-item">' +
                '<span class="landing-icon">' + icon("chat", 18) + '</span>' +
                '<div><strong>E-mail</strong><a href="mailto:contato@sgom.com.br">contato@sgom.com.br</a></div>' +
              '</div>' +
              '<div class="landing-contact-item">' +
                '<span class="landing-icon">' + whatsappIcon(18) + '</span>' +
                '<div><strong>Telefone / WhatsApp</strong><a href="https://wa.me/5548998425702" target="_blank" rel="noopener">(48) 99842-5702</a></div>' +
              '</div>' +
              '<div class="landing-contact-item">' +
                '<span class="landing-icon">' + icon("pin", 18) + '</span>' +
                '<div><strong>Endereço</strong><span>Rod. Interpraias, 1236, Balneário Gaivota - SC, 88955-000</span></div>' +
              '</div>' +
              '<div class="landing-contact-item">' +
                '<span class="landing-icon">' + icon("clock", 18) + '</span>' +
                '<div><strong>Horário</strong><span>Seg a Sex, 8h às 18h · Sáb, 8h às 12h</span></div>' +
              '</div>' +
            '</div>' +
            '<div class="landing-hero-actions">' +
              '<a class="btn btn--primary" href="https://wa.me/5548998425702" target="_blank" rel="noopener">Falar no WhatsApp</a>' +
              '<button class="btn" type="button" data-act="access-open">Entrar</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<aside class="landing-contact-card">' +
          '<span class="badge landing-badge-soon">Acesso</span>' +
          '<h3>Já é cliente?</h3>' +
          '<p>Acompanhe suas ordens de serviço, aprove orçamentos e consulte o histórico da sua moto.</p>' +
          '<button class="btn btn--primary" type="button" data-act="client-login">Entrar na minha conta</button>' +
          '<button class="btn landing-btn-ghost" type="button" data-act="landing-signup">Criar conta de cliente</button>' +
        '</aside>' +
      '</div>' +
    '</section>';
  }

  function landingFooter() {
    return '<footer class="landing-footer">' +
      '<div class="landing-container">' +
        '<div class="landing-footer-card">' +
          '<div>' +
            '<span class="badge landing-badge-soon">Atendimento</span>' +
            '<h3>Acompanhe sua moto</h3>' +
            '<p>Entre na Área do Cliente para consultar o andamento das suas O.S. e o histórico da sua moto.</p>' +
            '<div class="landing-footer-city">' + icon("pin", 16) + ' Balneário Gaivota - SC</div>' +
          '</div>' +
          '<button class="btn btn--primary" type="button" data-act="client-login">Acompanhar Minha Moto</button>' +
        '</div>' +
        '<div class="landing-footer-inner">' +
          '<div class="landing-footer-brand">' +
            '<span class="brand-mark">' + brandMark(36) + '</span>' +
            '<div><strong>SGOM</strong><span>Sistema de Gerenciamento para Oficina de Motos</span></div>' +
          '</div>' +
          '<nav aria-label="Links do rodapé">' +
            '<a href="#inicio">Início</a>' +
            '<a href="#sobre">Sobre nós</a>' +
            '<a href="#servicos">Serviços</a>' +
            '<a href="#contatos">Contatos</a>' +
            '<a href="#" data-act="access-open">Entrar</a>' +
          '</nav>' +
          '<small>© 2026 SGOM · Balneário Gaivota - SC. Todos os direitos reservados.</small>' +
        '</div>' +
      '</div>' +
    '</footer>';
  }

  /* ============================================================
     5.2 Chat simulado (Landing)
     ============================================================ */
  function chatTime() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  function chatPush(from, text) {
    state.chatMessages.push({ from: from, text: text, time: chatTime() });
  }
  function chatBotReply(text) {
    var t = normText(text);
    if (/horario|hora|aberto|abre|funciona|fecha/.test(t)) {
      return "Nosso horário de atendimento é de segunda a sexta, das 8h às 18h, e sábado das 8h às 12h. Estamos na Rod. Interpraias, 1236, Balneário Gaivota - SC.";
    }
    if (/agendar|agendamento|revisao|marcar|marcacao/.test(t)) {
      return "Para agendar uma revisão, informe sua placa e o período desejado. Um atendente confirma o horário em seguida.";
    }
    if (/consultar|consulta|ordem|os|placa|andamento|moto/.test(t)) {
      return "Para consultar sua O.S. com segurança, entre na Área do Cliente pelo botão Entrar. Lá você vê somente as ordens da sua moto.";
    }
    if (/preco|valor|orcamento|custa/.test(t)) {
      return "Os valores dependem do serviço e das peças necessárias. Peça um orçamento e acompanhe a aprovação pela Área do Cliente.";
    }
    if (/obrigad|valeu|tchau/.test(t)) {
      return "Obrigado pelo contato! A SGOM está à disposição para cuidar da sua moto.";
    }
    return "Recebi sua mensagem. Posso ajudar com agendamento, consulta de O.S. e horário de atendimento. Escolha um dos atalhos ou detalhe sua dúvida.";
  }
  function landingChatWidget() {
    if (!state.chatMessages.length) {
      chatPush("bot", "Olá! Sou o atendimento virtual da SGOM. Como posso ajudar?");
    }
    var body = state.chatMessages.map(function (m) {
      return '<div class="wa-msg ' + (m.from === "user" ? "user" : "") + '">' +
        esc(m.text).replace(/\n/g, "<br>") +
        '<span class="wa-time">' + esc(m.time || "") + '</span>' +
      '</div>';
    }).join("");
    var windowHtml =
      '<div class="wa-window" role="dialog" aria-label="SGOM Atendimento">' +
        '<div class="wa-head">' +
          '<span class="wa-avatar">' + icon("chat", 20) + '</span>' +
          '<div class="wa-head-info"><strong>SGOM Atendimento</strong><span>Online agora</span></div>' +
          '<button class="wa-close" type="button" data-act="chat-close" aria-label="Fechar atendimento">&#215;</button>' +
        '</div>' +
        '<div class="wa-body" id="wa-body">' + body + '</div>' +
        '<div class="wa-quick">' +
          '<button type="button" data-act="chat-quick" data-key="agendar">📅 Agendar Revisão</button>' +
          '<button type="button" data-act="chat-quick" data-key="consultar">🔍 Consultar O.S.</button>' +
          '<button type="button" data-act="chat-quick" data-key="horario">📍 Horário</button>' +
        '</div>' +
        '<form class="wa-form" id="form-chat">' +
          '<input name="message" type="text" placeholder="Escreva sua mensagem..." autocomplete="off" aria-label="Mensagem">' +
          '<button class="wa-send" type="submit" aria-label="Enviar mensagem">' + icon("chat", 18) + '</button>' +
        '</form>' +
      '</div>';
    return '<div class="wa-widget">' +
      (state.chatOpen ? windowHtml : "") +
      '<button class="wa-float" type="button" data-act="chat-toggle" aria-label="Abrir atendimento SGOM">' + whatsappIcon(30) + '</button>' +
    '</div>';
  }
  function chatOpenAfterRender() {
    var bodyEl = document.getElementById("wa-body");
    if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  /* ============================================================
     6. Shell do funcionario
     ============================================================ */
  var STAFF_NAV = [
    { id: "dashboard", label: "Dashboard", icon: "gauge" },
    { id: "agenda", label: "Agenda", icon: "clock" },
    { id: "orcamentos", label: "Orçamentos", icon: "file" },
    { id: "os", label: "Atendimentos (O.S.)", shortLabel: "O.S.", icon: "wrench" },
    { id: "estoque", label: "Estoque", icon: "box" },
    { id: "clientes", label: "Clientes", icon: "users" },
    { id: "servicos", label: "Serviços", icon: "list", more: true },
    { id: "financeiro", label: "Financeiro", icon: "chart" },
    { id: "funcionarios", label: "Funcionários", icon: "badge", more: true }
  ];
  function defaultView(user) { return user.role === "CLIENTE" ? "minhasos" : "dashboard"; }

  function navLinkHTML(it, activeView) {
    return '<a href="#' + it.id + '" data-act="nav" data-view="' + it.id + '" title="' + esc(it.label) + '" class="' + (it.id === activeView ? "active" : "") + '">' + esc(it.shortLabel || it.label) + "</a>";
  }

  function topbar(user, navItems, activeView) {
    var primary = navItems.filter(function (it) { return !it.more; });
    var secondary = navItems.filter(function (it) { return it.more; });
    var nav = primary.map(function (it) { return navLinkHTML(it, activeView); }).join("");
    if (secondary.length) {
      var moreActive = secondary.some(function (it) { return it.id === activeView; });
      nav += '<details class="nav-more">' +
        '<summary class="nav-more-toggle' + (moreActive ? " active" : "") + '">Mais ' + icon("chevron", 14) + '</summary>' +
        '<div class="nav-more-menu">' + secondary.map(function (it) { return navLinkHTML(it, activeView); }).join("") + '</div>' +
      '</details>';
    }
    var searchHtml = user.role === "CLIENTE" ? "" :
      '<div class="topbar-search" id="staff-search">' +
        '<span class="search-icon">' + icon("search", 15) + '</span>' +
        '<input id="staff-search-input" type="search" placeholder="Buscar cliente, moto, placa ou O.S." autocomplete="off" aria-label="Buscar cliente, moto, placa ou O.S." value="' + esc(state.search) + '">' +
        '<div class="search-results' + (state.searchOpen ? " open" : "") + '" id="search-results">' +
          (state.searchOpen ? staffSearchResultsHTML(state.search) : "") +
        '</div>' +
      '</div>';
    return '<header class="topbar">' +
      '<a class="brand" href="#inicio" data-act="nav" data-view="' + defaultView(user) + '">' +
        '<span class="brand-mark">' + brandMark(34) + '</span>' +
        '<span class="brand-name"><strong>SGOM</strong></span>' +
      '</a>' +
      '<nav id="staff-nav" aria-label="Navegação principal">' + nav + '</nav>' +
      '<div class="spacer"></div>' +
      searchHtml +
      '<button class="theme-toggle" type="button" data-theme-toggle data-act="theme-toggle"></button>' +
      '<div class="who"><strong>' + esc(user.name) + '</strong><span>' + (user.role === "CLIENTE" ? "Cliente" : "Funcionário") + '</span></div>' +
      '<button class="btn btn--sm btn--logout" data-act="logout" title="Sair" aria-label="Sair">' + icon("logout", 15) + '<span class="logout-label">Sair</span></button>' +
      '<button class="staff-menu-btn" type="button" data-act="staff-menu" aria-expanded="false" aria-controls="staff-nav" aria-label="Abrir menu"><span></span><span></span><span></span></button>' +
      '</header>';
  }

  function renderStaffApp(user) {
    if (!state.view) state.view = "dashboard";
    var views = {
      dashboard: viewDashboard, agenda: viewAgenda, orcamentos: viewOrcamentos, os: viewOS,
      estoque: viewEstoque, clientes: viewClientes, servicos: viewServicos,
      financeiro: viewFinanceiro, funcionarios: viewFuncionarios
    };
    var build = views[state.view] || viewDashboard;
    document.getElementById("app").innerHTML =
      '<div class="app">' + topbar(user, STAFF_NAV, state.view) + '<div class="content">' + build(user) + '</div></div>';
  }

  /* ---------------- Busca global do funcionario ---------------- */
  function searchMatches(qRaw) {
    var q = normText(qRaw).trim();
    var plateQ = normPlate(qRaw);
    var empty = { customers: [], motos: [], orders: [] };
    if (q.length < 2 && plateQ.length < 2) return empty;

    var customers = db.customers.filter(function (c) {
      return normText(c.name).indexOf(q) !== -1 ||
        normText(c.email).indexOf(q) !== -1 ||
        normText(c.phone).indexOf(q) !== -1 ||
        normText(c.doc).indexOf(q) !== -1;
    });
    var motos = db.motorcycles.filter(function (m) {
      return normPlate(m.plate).indexOf(plateQ) !== -1 ||
        normText(m.brand + " " + m.model).indexOf(q) !== -1;
    });
    var orders = db.orders.filter(function (o) {
      var c = findCustomer(o.customerId), m = findMoto(o.motorcycleId);
      if (normText(o.number).indexOf(q) !== -1) return true;
      if (m && (normPlate(m.plate).indexOf(plateQ) !== -1 || normText(m.brand + " " + m.model).indexOf(q) !== -1)) return true;
      return !!(c && normText(c.name).indexOf(q) !== -1);
    });
    orders.sort(function (a, b) { return String(b.number).localeCompare(String(a.number)); });
    return { customers: customers, motos: motos, orders: orders };
  }
  function staffSearchResultsHTML(qRaw) {
    if (normText(qRaw).trim().length < 2 && normPlate(qRaw).length < 2) return "";
    var r = searchMatches(qRaw);
    var total = r.customers.length + r.motos.length + r.orders.length;
    if (!total) return '<div class="search-empty">Nenhum resultado para "' + esc(String(qRaw || "").trim()) + '".</div>';
    var html = "";
    if (r.customers.length) {
      html += '<div class="search-group"><h4>Clientes</h4>' + r.customers.slice(0, 6).map(function (c) {
        var motos = db.motorcycles.filter(function (m) { return m.customerId === c.id; });
        return '<button type="button" class="search-item" data-act="search-client" data-id="' + c.id + '">' +
          '<span class="landing-icon" style="width:32px;height:32px;border-radius:9px;margin:0">' + icon("users", 16) + '</span>' +
          '<span class="search-item-main"><strong>' + esc(c.name) + '</strong><span>' + esc(c.phone || "-") + ' · ' + motos.length + ' moto(s)</span></span>' +
        '</button>';
      }).join("") + '</div>';
    }
    if (r.motos.length) {
      html += '<div class="search-group"><h4>Motos</h4>' + r.motos.slice(0, 6).map(function (m) {
        var c = findCustomer(m.customerId);
        return '<button type="button" class="search-item" data-act="search-moto" data-id="' + m.id + '">' +
          '<span class="landing-icon" style="width:32px;height:32px;border-radius:9px;margin:0">' + icon("bike", 16) + '</span>' +
          '<span class="search-item-main"><strong>' + esc(m.brand + " " + m.model) + ' · ' + esc(m.plate) + '</strong><span>' + esc(c ? c.name : "-") + '</span></span>' +
        '</button>';
      }).join("") + '</div>';
    }
    if (r.orders.length) {
      html += '<div class="search-group"><h4>Ordens de serviço</h4>' + r.orders.slice(0, 8).map(function (o) {
        var c = findCustomer(o.customerId), m = findMoto(o.motorcycleId);
        var st = STATUS[displayStatus(o)] || { label: displayStatus(o) };
        return '<button type="button" class="search-item" data-act="open-order" data-id="' + o.id + '">' +
          '<span class="landing-icon" style="width:32px;height:32px;border-radius:9px;margin:0">' + icon("wrench", 16) + '</span>' +
          '<span class="search-item-main"><strong>' + esc(o.number) + ' · ' + esc(st.label) + '</strong><span>' + esc(c ? c.name : "-") + ' · ' + esc(m ? m.plate : "-") + '</span></span>' +
        '</button>';
      }).join("") + '</div>';
    }
    return html;
  }
  function closeSearchResults() {
    state.searchOpen = false;
    var box = document.getElementById("search-results");
    if (box) box.classList.remove("open");
  }
  function ordersForMoto(motoId) {
    return db.orders.filter(function (o) { return o.motorcycleId === motoId; })
      .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
  }
  function miniOrderRow(o) {
    return '<div class="mini-order">' +
      '<div class="mini-order-info"><strong>' + esc(o.number) + '</strong> ' + badge(displayStatus(o)) +
        '<span>' + fmtDate(o.createdAt) + ' · ' + money(orderTotal(o)) + '</span></div>' +
      '<button class="btn btn--sm" data-act="open-order" data-id="' + o.id + '">Abrir O.S.</button>' +
    '</div>';
  }
  function searchClientModal(customerId) {
    var c = findCustomer(customerId);
    if (!c) return;
    var motos = db.motorcycles.filter(function (m) { return m.customerId === c.id; });
    var body =
      '<div class="client-file-grid">' +
        '<div class="client-file-box">' + infoBox("Telefone", c.phone || "-") + '</div>' +
        '<div class="client-file-box">' + infoBox("E-mail", c.email || "-") + '</div>' +
        '<div class="client-file-box">' + infoBox("CPF/CNPJ", c.doc || "-") + '</div>' +
        '<div class="client-file-box">' + infoBox("Motos", String(motos.length)) + '</div>' +
      '</div>' +
      '<h3 style="margin:0 0 4px">Motos cadastradas</h3>' +
      (motos.length ? motos.map(function (m) {
        var orders = ordersForMoto(m.id);
        return '<div class="client-moto">' +
          '<div class="client-moto-head">' +
            '<div><span class="plate">' + esc(m.plate) + '</span> <strong>' + esc(m.brand + " " + m.model) + '</strong>' +
              '<div class="cell-sub">' + esc(m.year || "-") + ' · ' + n2(m.km).toLocaleString("pt-BR") + ' km</div></div>' +
            '<span class="badge">' + orders.length + ' O.S.</span>' +
          '</div>' +
          '<div class="client-moto-body">' +
            (orders.length ? orders.map(miniOrderRow).join("") : '<div class="empty" style="padding:14px">Nenhuma O.S. para esta moto.</div>') +
          '</div>' +
        '</div>';
      }).join("") : '<div class="empty">Nenhuma moto cadastrada.</div>');
    openModal(modalShell("Cliente · " + c.name, body, '<button class="btn" data-act="close-modal">Fechar</button>'));
  }
  function searchMotoModal(motoId) {
    var m = findMoto(motoId);
    if (!m) return;
    var c = findCustomer(m.customerId);
    var orders = ordersForMoto(m.id);
    var body =
      '<div class="client-file-grid">' +
        '<div class="client-file-box">' + infoBox("Placa", m.plate) + '</div>' +
        '<div class="client-file-box">' + infoBox("Modelo", m.brand + " " + m.model) + '</div>' +
        '<div class="client-file-box">' + infoBox("Proprietário", c ? c.name : "-") + '</div>' +
        '<div class="client-file-box">' + infoBox("KM atual", n2(m.km).toLocaleString("pt-BR")) + '</div>' +
      '</div>' +
      '<h3 style="margin:0 0 4px">O.S. vinculadas</h3>' +
      (orders.length ? '<div class="client-moto"><div class="client-moto-body">' + orders.map(miniOrderRow).join("") + '</div></div>' : '<div class="empty">Nenhuma O.S. para esta moto.</div>');
    openModal(modalShell("Moto · " + m.plate, body, '<button class="btn" data-act="close-modal">Fechar</button>'));
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

  /* ---------------- Financeiro ---------------- */
  function parseISODate(iso) {
    var p = String(iso || "").slice(0, 10).split("-");
    if (p.length !== 3) return null;
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  function isoFromDate(d) {
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return d.getFullYear() + "-" + (m.length < 2 ? "0" + m : m) + "-" + (day.length < 2 ? "0" + day : day);
  }
  function startOfWeekDate(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var offset = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - offset);
    return x;
  }
  function orderRefISO(o) { return String(o.deliveredAt || "").slice(0, 10); }
  function finRange() {
    var today = todayISO();
    if (state.fin.period === "semana") {
      var mon = startOfWeekDate(new Date());
      var sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      return { from: isoFromDate(mon), to: isoFromDate(sun), label: "Esta semana" };
    }
    if (state.fin.period === "mes") {
      var now = new Date();
      var first = new Date(now.getFullYear(), now.getMonth(), 1);
      var last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: isoFromDate(first), to: isoFromDate(last), label: "Este mês" };
    }
    if (state.fin.period === "custom") {
      var from = state.fin.from || today;
      var to = state.fin.to || from;
      if (from > to) { var tmp = from; from = to; to = tmp; }
      return { from: from, to: to, label: fmtDate(from) + " a " + fmtDate(to) };
    }
    return { from: today, to: today, label: "Hoje" };
  }
  function finOrdersInRange(from, to) {
    return db.orders.filter(function (o) {
      if (displayStatus(o) !== "ENTREGUE") return false;
      var ref = orderRefISO(o);
      return !!ref && ref >= from && ref <= to;
    });
  }
  function finSummary(orders) {
    var total = 0, labor = 0, partsSale = 0, partsCost = 0;
    orders.forEach(function (o) {
      o.items.forEach(function (i) {
        var v = n2(i.qty) * n2(i.unitPrice);
        if (i.type === "LABOR") labor += v;
        else {
          partsSale += v;
          partsCost += n2(i.qty) * partUnitCost(i);
        }
      });
      total += orderTotal(o);
    });
    return { total: total, labor: labor, partsSale: partsSale, partsCost: partsCost, profit: total - partsCost, count: orders.length };
  }
  function financeTable(orders) {
    if (!orders.length) return '<div class="empty">Nenhuma O.S. entregue no período selecionado.</div>';
    var sorted = orders.slice().sort(function (a, b) { return orderRefISO(b).localeCompare(orderRefISO(a)); });
    return '<table><thead><tr><th>Nº da O.S.</th><th>Data</th><th>Cliente</th><th class="num">Mão de Obra (R$)</th><th class="num">Peças (R$)</th><th class="num">Total (R$)</th></tr></thead><tbody>' +
      sorted.map(function (o) {
        var c = findCustomer(o.customerId);
        var labor = 0, parts = 0;
        o.items.forEach(function (i) {
          var v = n2(i.qty) * n2(i.unitPrice);
          if (i.type === "LABOR") labor += v;
          else parts += v;
        });
        return '<tr>' +
          '<td><button class="fin-order-link" type="button" data-act="open-order" data-id="' + o.id + '"><strong>' + esc(o.number) + '</strong></button><div style="margin-top:4px">' + badge(displayStatus(o)) + '</div></td>' +
          '<td>' + fmtDate(orderRefISO(o)) + '</td>' +
          '<td>' + esc(c ? c.name : "-") + '</td>' +
          '<td class="num">' + money(labor) + '</td>' +
          '<td class="num">' + money(parts) + '</td>' +
          '<td class="num"><strong>' + money(orderTotal(o)) + '</strong></td>' +
        '</tr>';
      }).join("") + '</tbody></table>';
  }
  function viewFinanceiro() {
    var range = finRange();
    var orders = finOrdersInRange(range.from, range.to);
    var sum = finSummary(orders);
    var todaySum = finSummary(finOrdersInRange(todayISO(), todayISO()));
    var periods = [["hoje", "Hoje"], ["semana", "Esta Semana"], ["mes", "Este Mês"], ["custom", "Personalizado"]];
    var periodsHtml = '<div class="fin-periods">' + periods.map(function (p) {
      return '<button type="button" data-act="fin-period" data-period="' + p[0] + '" class="' + (state.fin.period === p[0] ? "active" : "") + '">' + p[1] + '</button>';
    }).join("") + '</div>';
    var customHtml = state.fin.period === "custom" ?
      '<div class="fin-custom">' +
        '<div class="field"><label>Data inicial</label><input id="fin-from" type="date" value="' + esc(state.fin.from || range.from) + '"></div>' +
        '<div class="field"><label>Data final</label><input id="fin-to" type="date" value="' + esc(state.fin.to || range.to) + '"></div>' +
        '<button class="btn btn--sm btn--primary" type="button" data-act="fin-apply">Aplicar</button>' +
      '</div>' : "";

    return viewHead("Financeiro", "Receita, custos de peças e lucro das ordens entregues") +
      '<div class="fin-filters">' + periodsHtml + customHtml + '</div>' +
      '<p class="fin-hint">Período: <strong>' + esc(range.label) + '</strong> · Somente O.S. entregues. Lucro = faturamento − custo das peças. Peças sem custo cadastrado entram como R$ 0,00.</p>' +
      '<div class="grid-kpi fin-kpis">' +
        kpi("Receita de Hoje", money(todaySum.total), "O.S. entregues hoje") +
        kpi("Faturamento Total", money(sum.total), range.label) +
        kpi("Custos de Peças", money(sum.partsCost), "peças utilizadas no período") +
        kpi("Lucro Líquido", money(sum.profit), "faturamento − custos", sum.profit < 0) +
      '</div>' +
      '<section class="card" style="margin-top:16px">' +
        '<div class="card-head"><h2 class="card-title">Lançamentos do período</h2><span class="badge">' + orders.length + ' O.S.</span></div>' +
        '<div class="card-body" style="padding:0">' + financeTable(orders) + '</div>' +
      '</section>';
  }

  /* ---------------- Agenda ---------------- */
  var APPT_STATUS = {
    PRE_AGENDADO: { label: "Pré-agendamento", cls: "appt-pre" },
    CONFIRMADO: { label: "Confirmado", cls: "appt-conf" },
    EM_ATENDIMENTO: { label: "Em Atendimento", cls: "appt-exec" },
    CONCLUIDO: { label: "Concluído", cls: "appt-done" }
  };
  function apptStatusMeta(status) {
    return APPT_STATUS[status] || { label: status, cls: "appt-done" };
  }
  function apptBadge(status) {
    var m = apptStatusMeta(status);
    return '<span class="appt-status-badge ' + m.cls + '">' + esc(m.label) + '</span>';
  }
  function findAppointment(id) {
    return db.appointments.filter(function (a) { return a.id === id; })[0] || null;
  }
  function apptsByDate() {
    var map = {};
    db.appointments.forEach(function (a) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.keys(map).forEach(function (k) {
      map[k].sort(function (a, b) { return String(a.time).localeCompare(String(b.time)); });
    });
    return map;
  }
  function agendaCursor() {
    return parseISODate(state.agenda.cursor) || new Date();
  }
  function agendaTitle() {
    var d = agendaCursor();
    if (state.agenda.mode === "semana") {
      var start = startOfWeekDate(d), end = new Date(start);
      end.setDate(end.getDate() + 6);
      return start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " a " +
        end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }
    if (state.agenda.mode === "dia") {
      return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    }
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
  function apptChip(a) {
    var c = findCustomer(a.customerId);
    var m = apptStatusMeta(a.status);
    var name = c ? c.name.split(" ")[0] : "Cliente";
    return '<button type="button" class="cal-appt ' + m.cls + '" data-act="appt-open" data-id="' + a.id + '" title="' +
      esc((a.service || "Agendamento") + " · " + (c ? c.name : "")) + '"><strong>' + esc(a.time) + '</strong> ' + esc(name) + '</button>';
  }
  function agendaMonthHTML(cursor) {
    var year = cursor.getFullYear(), month = cursor.getMonth();
    var first = new Date(year, month, 1);
    var start = new Date(first);
    start.setDate(start.getDate() - ((first.getDay() + 6) % 7));
    var map = apptsByDate();
    var weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    var days = "";
    for (var i = 0; i < 42; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      var iso = isoFromDate(d);
      var list = map[iso] || [];
      days += '<div class="cal-day' + (d.getMonth() !== month ? " out" : "") + (iso === todayISO() ? " today" : "") + '">' +
        '<span class="cal-day-num">' + d.getDate() + '</span>' +
        list.map(apptChip).join("") +
      '</div>';
    }
    return '<div class="cal-scroll"><div class="cal-month">' +
      weekdays.map(function (w) { return '<div class="cal-weekday">' + w + '</div>'; }).join("") +
      days + '</div></div>';
  }
  function agendaWeekHTML(cursor) {
    var start = startOfWeekDate(cursor);
    var map = apptsByDate();
    var cols = "";
    for (var i = 0; i < 7; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      var iso = isoFromDate(d);
      var list = map[iso] || [];
      cols += '<div class="cal-week-col">' +
        '<div class="cal-week-head">' + esc(d.toLocaleDateString("pt-BR", { weekday: "short" })) + '<strong>' + d.getDate() + '</strong></div>' +
        (list.length ? list.map(apptChip).join("") : '<div class="muted" style="font-size:12px">—</div>') +
      '</div>';
    }
    return '<div class="cal-scroll"><div class="cal-week">' + cols + '</div></div>';
  }
  function agendaDayHTML(cursor) {
    var iso = isoFromDate(cursor);
    var list = apptsByDate()[iso] || [];
    if (!list.length) return '<div class="card"><div class="empty">Nenhum agendamento nesta data.</div></div>';
    return '<div class="cal-day-list">' + list.map(function (a) {
      var c = findCustomer(a.customerId), m = findMoto(a.motorcycleId);
      return '<div class="cal-day-row">' +
        '<span class="cal-day-time">' + esc(a.time) + '</span>' +
        '<div class="cal-day-main"><strong>' + esc(c ? c.name : "-") + ' · ' + esc(m ? m.plate : "-") + '</strong><span>' + esc(a.service || "Agendamento") + '</span></div>' +
        apptBadge(a.status) +
        '<button class="btn btn--sm" data-act="appt-open" data-id="' + a.id + '">Abrir</button>' +
      '</div>';
    }).join("") + '</div>';
  }
  function viewAgenda() {
    var cursor = agendaCursor();
    var modes = [["mes", "Mês"], ["semana", "Semana"], ["dia", "Dia"]];
    var tabs = '<div class="tabs" style="max-width:280px;margin-bottom:0">' + modes.map(function (m) {
      return '<button type="button" data-act="agenda-mode" data-mode="' + m[0] + '" class="' + (state.agenda.mode === m[0] ? "active" : "") + '">' + m[1] + '</button>';
    }).join("") + '</div>';
    var toolbar = '<div class="agenda-toolbar">' + tabs +
      '<div class="agenda-nav">' +
        '<button class="btn btn--sm" type="button" data-act="agenda-prev" aria-label="Anterior">&#8249;</button>' +
        '<button class="btn btn--sm" type="button" data-act="agenda-today">Hoje</button>' +
        '<button class="btn btn--sm" type="button" data-act="agenda-next" aria-label="Próximo">&#8250;</button>' +
        '<span class="agenda-title">' + esc(agendaTitle()) + '</span>' +
      '</div>' +
    '</div>';
    var content = state.agenda.mode === "semana" ? agendaWeekHTML(cursor) :
      state.agenda.mode === "dia" ? agendaDayHTML(cursor) : agendaMonthHTML(cursor);
    return viewHead("Agenda", "Agendamentos da oficina por status",
      '<button class="btn btn--primary" data-act="appt-new">' + icon("plus", 16) + ' Novo agendamento</button>') +
      toolbar + content;
  }
  function appointmentModalHTML(a) {
    var c = findCustomer(a.customerId), m = findMoto(a.motorcycleId);
    var meta = apptStatusMeta(a.status);
    var linked = a.orderId ? findOrder(a.orderId) : null;
    var body =
      '<div class="row3">' +
        infoBox("Cliente", c ? c.name : "-") +
        infoBox("Moto", m ? (m.brand + " " + m.model) : "-") +
        infoBox("Placa", m ? m.plate : "-") +
      '</div>' +
      '<div class="row3" style="margin-top:12px">' +
        infoBox("Data", fmtDate(a.date)) +
        infoBox("Hora", a.time) +
        infoBox("Status", meta.label) +
      '</div>' +
      '<div class="row3" style="margin-top:12px">' +
        infoBox("Serviço", a.service || "-") +
        infoBox("Queixa / observação", a.complaint || "-") +
        infoBox("Criado em", fmtDateTime(a.createdAt)) +
      '</div>' +
      (linked ? '<div class="alert alert--info" style="margin-top:14px">Convertido na O.S. <strong>' + esc(linked.number) + '</strong>.</div>' : "");
    var foot = '<button class="btn" data-act="close-modal">Fechar</button>';
    if (linked) {
      foot += '<button class="btn btn--primary" data-act="open-order" data-id="' + linked.id + '">Abrir O.S.</button>';
    } else {
      if (a.status === "PRE_AGENDADO") foot += '<button class="btn" data-act="appt-status" data-id="' + a.id + '" data-to="CONFIRMADO">Confirmar</button>';
      if (a.status === "PRE_AGENDADO" || a.status === "CONFIRMADO") foot += '<button class="btn" data-act="appt-status" data-id="' + a.id + '" data-to="EM_ATENDIMENTO">Iniciar atendimento</button>';
      if (a.status !== "CONCLUIDO") foot += '<button class="btn" data-act="appt-status" data-id="' + a.id + '" data-to="CONCLUIDO">Concluir</button>';
      foot += '<button class="btn btn--primary" data-act="appt-convert" data-id="' + a.id + '">Converter em O.S.</button>';
    }
    return modalShell("Agendamento · " + a.number, body, foot);
  }
  function newAppointmentModal() {
    var opts = db.customers.map(function (c) {
      var motos = db.motorcycles.filter(function (m) { return m.customerId === c.id; });
      if (!motos.length) return "";
      return '<optgroup label="' + esc(c.name) + '">' + motos.map(function (m) {
        return '<option value="' + m.id + '">' + esc(m.brand + " " + m.model + " · " + m.plate) + '</option>';
      }).join("") + '</optgroup>';
    }).join("");
    var svc = db.services.map(function (s) {
      return '<option value="' + s.id + '">' + esc(s.code + " · " + s.name) + '</option>';
    }).join("");
    var statuses = Object.keys(APPT_STATUS).map(function (k) {
      return '<option value="' + k + '"' + (k === "PRE_AGENDADO" ? " selected" : "") + '>' + esc(APPT_STATUS[k].label) + '</option>';
    }).join("");
    var body = '<form id="form-new-appointment">' +
      field("Moto", '<select name="motorcycleId" required>' + (opts || '<option value="">Nenhuma moto cadastrada</option>') + '</select>') +
      '<div class="row2">' +
        field("Data", '<input name="date" type="date" required value="' + esc(state.agenda.cursor || todayISO()) + '">') +
        field("Hora", '<input name="time" type="time" required value="09:00">') +
      '</div>' +
      '<div class="row2">' +
        field("Serviço", '<select name="serviceId"><option value="">Sem serviço definido</option>' + svc + '</select>') +
        field("Status", '<select name="status">' + statuses + '</select>') +
      '</div>' +
      field("Queixa / observação", '<input name="complaint" placeholder="ex.: revisão dos 10.000 km">') +
      '</form>';
    openModal(modalShell("Novo agendamento", body,
      '<button class="btn" data-act="close-modal">Cancelar</button>' +
      '<button class="btn btn--primary" data-act="submit-form" data-form="form-new-appointment">Salvar</button>'));
  }
  function convertAppointmentToOrder(apptId) {
    var a = findAppointment(apptId);
    if (!a) return;
    if (a.orderId && findOrder(a.orderId)) {
      state.openOrderId = a.orderId; state.modal = null; render(); return;
    }
    var moto = findMoto(a.motorcycleId);
    if (!moto) { toast("Moto do agendamento não encontrada.", "err"); return; }
    var svc = a.serviceId ? db.services.filter(function (s) { return s.id === a.serviceId; })[0] : null;
    var order = {
      id: uid("o"), number: "OS-" + (db.seq.order++), customerId: a.customerId, motorcycleId: a.motorcycleId,
      status: "APROVADA", kmEntry: n2(moto.km), complaint: a.complaint || a.service || "Agendamento",
      discount: 0, reserved: false, createdAt: nowLocal(), startedAt: null, finishedAt: null, deliveredAt: null,
      validUntil: null,
      items: svc ? [{ type: "LABOR", refId: svc.id, name: svc.name, qty: 1, unitPrice: n2(svc.price) }] : []
    };
    db.orders.push(order);
    a.orderId = order.id;
    a.status = "CONCLUIDO";
    persist();
    toast("Agendamento " + a.number + " convertido em " + order.number + ".");
    state.view = "os";
    state.modal = null;
    state.openOrderId = order.id;
    render();
    window.scrollTo(0, 0);
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
          '<button class="btn btn--sm" data-act="stock-move" data-id="' + p.id + '" data-dir="out">Saída</button> ' +
          '<button class="btn btn--sm btn--danger" data-act="delete-part" data-id="' + p.id + '" title="Excluir peça">Excluir</button></td>' +
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

  /* ---------------- Funcionarios ---------------- */
  function viewFuncionarios() {
    var staff = db.users.filter(function (u) { return u.role === "FUNCIONARIO"; });
    return viewHead("Funcionários", "Contas de acesso ao sistema (criação restrita a funcionários)",
      '<button class="btn btn--primary" data-act="new-staff">' + icon("plus", 16) + ' Novo funcionário</button>') +
      '<section class="card"><div class="card-body" style="padding:0">' +
      (staff.length
        ? '<table><thead><tr><th>Nome</th><th>E-mail</th></tr></thead><tbody>' +
          staff.map(function (u) {
            return '<tr><td><strong>' + esc(u.name) + '</strong></td><td>' + esc(u.email) + '</td></tr>';
          }).join("") + '</tbody></table>'
        : '<div class="empty">Nenhum funcionário cadastrado.</div>') +
      '</div></section>';
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
      (os.rejectReason ? '<div class="alert alert--err"><strong>Reprovado em ' + fmtDateTime(os.rejectedAt) + '</strong> — ' + esc(os.rejectReason) + '</div>' : "") +
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
  function clientFilteredOrders(user) {
    var q = normText(state.clientQuery).trim();
    var plateQ = normPlate(state.clientQuery);
    return db.orders.filter(function (o) {
      if (o.customerId !== user.customerId) return false;
      if (!q && !plateQ) return true;
      var m = findMoto(o.motorcycleId);
      return normText(o.number).indexOf(q) !== -1 ||
        !!(m && (normPlate(m.plate).indexOf(plateQ) !== -1 || normText(m.brand + " " + m.model).indexOf(q) !== -1));
    });
  }
  function clientOrdersHTML(orders) {
    if (!orders.length) {
      return '<div class="empty">' + (state.clientQuery.trim() ? 'Nenhuma O.S. encontrada para esta busca.' : 'Você ainda não tem ordens de serviço.') + '</div>';
    }
    return orders.map(function (o) {
      var m = findMoto(o.motorcycleId);
      return '<section class="card" style="margin-bottom:12px"><div class="card-body" style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">' +
        '<div><strong>' + esc(o.number) + '</strong> ' + badge(displayStatus(o)) +
          '<div class="cell-sub">' + esc(m ? (m.brand + " " + m.model + " · " + m.plate) : "") + '</div>' +
          '<div class="cell-sub">Aberta em ' + fmtDate(o.createdAt) + ' · Total ' + money(orderTotal(o)) + '</div></div>' +
        '<button class="btn" data-act="open-order" data-id="' + o.id + '">Ver detalhes</button>' +
      '</div></section>';
    }).join("");
  }
  function renderClientApp(user) {
    if (!state.view) state.view = "minhasos";
    var cards = clientOrdersHTML(clientFilteredOrders(user));

    document.getElementById("app").innerHTML =
      '<div class="app">' + topbar(user, [{ id: "minhasos", label: "Minhas O.S." }], "minhasos") +
      '<div class="content">' + viewHead("Minhas O.S.", "Acompanhe suas ordens e aprove orçamentos") +
        '<section class="card client-filter"><div class="card-body">' +
          field("Buscar por placa ou número da O.S.", '<input id="client-order-search" type="search" placeholder="Ex.: ABC1D23 ou OS-1002" value="' + esc(state.clientQuery) + '">') +
        '</div></section>' +
        '<div id="client-orders-list">' + cards + '</div>' +
      '</div></div>';
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
      '<div class="row2">' +
        field("Preço de venda (R$)", '<input name="price" type="number" min="0" step="0.01" required>') +
        field("Custo (R$)", '<input name="cost" type="number" min="0" step="0.01" value="0">') +
      '</div>' +
      '<div class="row2">' +
        field("Estoque", '<input name="qty" type="number" min="0" value="0">') +
        field("Mínimo", '<input name="minQty" type="number" min="0" value="0">') +
      '</div>' +
      '</form>';
    openModal(modalShell("Nova peça", body,
      '<button class="btn" data-act="close-modal">Cancelar</button><button class="btn btn--primary" data-act="submit-form" data-form="form-new-part">Salvar</button>'));
  }
  function stockMoveModal(partId, dir, error, qty) {
    var part = findPart(partId);
    if (!part) return "";
    var isIn = dir === "in";
    var value = (qty == null || qty === "") ? 1 : qty;
    var body =
      '<div class="stock-kind"><span class="badge ' + (isIn ? "badge--in" : "badge--out") + '">' + (isIn ? "Entrada" : "Saída") + '</span></div>' +
      '<div class="stock-summary">' +
        '<div class="stock-line"><span>Peça</span><strong>' + esc(part.name) + '</strong></div>' +
        '<div class="stock-line"><span>SKU</span><strong>' + esc(part.sku) + '</strong></div>' +
        '<div class="stock-line"><span>Estoque atual</span><strong>' + n2(part.qty) + ' un.</strong></div>' +
        (isIn ? "" : '<div class="stock-line"><span>Disponível para saída</span><strong>' + availableForPart(part.id) + ' un.</strong></div>') +
      '</div>' +
      (error ? '<div class="alert alert--err">' + esc(error) + '</div>' : "") +
      '<form id="form-stock-move" data-id="' + part.id + '" data-dir="' + (isIn ? "in" : "out") + '" novalidate>' +
        field("Quantidade", '<input name="qty" type="number" min="1" step="1" inputmode="numeric" value="' + esc(value) + '" autofocus>') +
        '<p class="stock-hint">' + (isIn ? "A quantidade será somada ao estoque atual." : "A quantidade será subtraída do estoque e não pode ultrapassar o disponível.") + '</p>' +
      '</form>';
    return modalShell(
      isIn ? "Entrada de estoque" : "Saída de estoque",
      body,
      '<button class="btn" data-act="close-modal">Cancelar</button>' +
      '<button class="btn btn--primary" data-act="submit-form" data-form="form-stock-move">' + (isIn ? "Confirmar entrada" : "Confirmar saída") + '</button>',
      "modal--sm"
    );
  }
  function deletePartModal(part) {
    var linked = ordersWithPart(part.id);
    var body =
      '<div class="stock-summary">' +
        '<div class="stock-line"><span>Peça</span><strong>' + esc(part.name) + '</strong></div>' +
        '<div class="stock-line"><span>SKU</span><strong>' + esc(part.sku) + '</strong></div>' +
        '<div class="stock-line"><span>Estoque atual</span><strong>' + n2(part.qty) + ' un.</strong></div>' +
        '<div class="stock-line"><span>Reservado</span><strong>' + reservedByPart(part.id, null) + ' un.</strong></div>' +
      '</div>' +
      (linked.length
        ? '<div class="alert alert--err">Esta peça está vinculada a ' + linked.length + ' O.S. (' + esc(linked.map(function (o) { return o.number; }).join(", ")) + '). Remova-a dos orçamentos/atendimentos antes de excluir.</div>'
        : '<div class="alert alert--err">Esta ação é permanente e não pode ser desfeita.</div>');
    return modalShell("Excluir peça", body,
      '<button class="btn" data-act="close-modal">' + (linked.length ? "Fechar" : "Cancelar") + '</button>' +
      (linked.length ? "" : '<button class="btn btn--danger-solid" data-act="confirm-delete-part" data-id="' + part.id + '">Excluir peça</button>'),
      "modal--sm");
  }
  function newStaffModal() {
    var body = '<form id="form-new-staff">' +
      field("Nome", '<input name="name" required placeholder="Nome completo">') +
      field("E-mail", '<input name="email" type="email" required placeholder="funcionario@sgom">') +
      '<div class="row2">' +
        field("Senha", '<input name="password" type="password" required placeholder="mínimo de 4 caracteres">') +
        field("Confirmar senha", '<input name="password2" type="password" required placeholder="digite novamente">') +
      '</div>' +
      '<div class="alert alert--info">Novo funcionário poderá entrar no sistema e gerenciar a oficina.</div>' +
      '</form>';
    openModal(modalShell("Novo funcionário", body,
      '<button class="btn" data-act="close-modal">Cancelar</button><button class="btn btn--primary" data-act="submit-form" data-form="form-new-staff">Criar</button>'));
  }
  function modalShell(title, body, foot, variant) {
    return '<div class="modal-back" data-act="close-modal-bg"><div class="modal' + (variant ? " " + variant : "") + '">' +
      '<div class="modal-head"><h2 class="card-title">' + esc(title) + '</h2>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Fechar">&#215;</button></div>' +
      '<div class="modal-body">' + body + '</div>' +
      (foot ? '<div class="modal-foot">' + foot + '</div>' : "") + '</div></div>';
  }
  function rejectModalHTML(os) {
    var body =
      '<form id="form-reject" data-id="' + os.id + '">' +
        '<div class="alert alert--info">O.S. <strong>' + esc(os.number) + '</strong> · Total <strong>' + money(orderTotal(os)) + '</strong>. ' +
        'A reprovação encerra este orçamento (estado final) e o funcionário verá o motivo.</div>' +
        field("Motivo da reprovação", '<textarea id="f-reject-reason" name="reason" rows="3" maxlength="300" required placeholder="Ex.: valor acima do esperado, quero orçamento separado..."></textarea>') +
      '</form>';
    return modalShell("Reprovar orçamento", body,
      '<button class="btn" data-act="close-modal">Cancelar</button>' +
      '<button class="btn btn--primary" data-act="confirm-reject" data-id="' + os.id + '">Confirmar reprovação</button>');
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
    if (!e.target.closest("#staff-search")) closeSearchResults();
    if (!e.target.closest(".nav-more")) {
      Array.prototype.forEach.call(document.querySelectorAll(".nav-more[open]"), function (d) { d.removeAttribute("open"); });
    }
    var staffNav = document.getElementById("staff-nav");
    if (staffNav && staffNav.classList.contains("open") &&
      !e.target.closest("#staff-nav") && !e.target.closest(".staff-menu-btn")) {
      staffNav.classList.remove("open");
      var staffBtn = document.querySelector(".staff-menu-btn");
      if (staffBtn) staffBtn.setAttribute("aria-expanded", "false");
    }
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");

    if (act === "access-open") { e.preventDefault(); openModal(accessModalHTML()); return; }
    if (act === "access-client") { e.preventDefault(); goLogin("client"); return; }
    if (act === "access-staff") { e.preventDefault(); goLogin("staff"); return; }
    if (act === "client-login") { e.preventDefault(); goLogin("client"); return; }
    if (act === "landing-login") { e.preventDefault(); goLogin("staff"); return; }
    if (act === "landing-signup") { e.preventDefault(); goLogin("client", true); return; }
    if (act === "landing-back") { e.preventDefault(); goLanding(); return; }
    if (act === "theme-toggle") { toggleTheme(); return; }
    if (act === "search-client") { state.searchOpen = false; searchClientModal(el.getAttribute("data-id")); return; }
    if (act === "search-moto") { state.searchOpen = false; searchMotoModal(el.getAttribute("data-id")); return; }
    if (act === "chat-toggle") { state.chatOpen = !state.chatOpen; render(); return; }
    if (act === "chat-close") { state.chatOpen = false; render(); return; }
    if (act === "chat-quick") {
      var key = el.getAttribute("data-key");
      if (key === "agendar") {
        chatPush("user", "Quero agendar uma revisão.");
        chatPush("bot", chatBotReply("Quero agendar uma revisão."));
        render();
      } else if (key === "horario") {
        chatPush("user", "Qual é o horário de atendimento?");
        chatPush("bot", chatBotReply("Qual é o horário de atendimento?"));
        render();
      } else {
        state.chatOpen = false;
        toast("Entre na Área do Cliente para consultar suas O.S.");
        goLogin("client");
      }
      return;
    }
    if (act === "fin-period") {
      state.fin.period = el.getAttribute("data-period");
      if (state.fin.period === "custom" && (!state.fin.from || !state.fin.to)) {
        var nowFin = new Date();
        state.fin.from = isoFromDate(new Date(nowFin.getFullYear(), nowFin.getMonth(), 1));
        state.fin.to = todayISO();
      }
      render();
      return;
    }
    if (act === "fin-apply") {
      var fromEl = document.getElementById("fin-from");
      var toEl = document.getElementById("fin-to");
      state.fin.from = fromEl ? fromEl.value : state.fin.from;
      state.fin.to = toEl ? toEl.value : state.fin.to;
      state.fin.period = "custom";
      render();
      return;
    }
    if (act === "agenda-mode") { state.agenda.mode = el.getAttribute("data-mode"); render(); return; }
    if (act === "agenda-prev" || act === "agenda-next") {
      var delta = act === "agenda-prev" ? -1 : 1;
      var cursor = agendaCursor();
      if (state.agenda.mode === "mes") cursor.setMonth(cursor.getMonth() + delta);
      else if (state.agenda.mode === "semana") cursor.setDate(cursor.getDate() + delta * 7);
      else cursor.setDate(cursor.getDate() + delta);
      state.agenda.cursor = isoFromDate(cursor);
      render();
      return;
    }
    if (act === "agenda-today") { state.agenda.cursor = todayISO(); render(); return; }
    if (act === "appt-new") { newAppointmentModal(); return; }
    if (act === "appt-open") {
      var apptOpen = findAppointment(el.getAttribute("data-id"));
      if (apptOpen) openModal(appointmentModalHTML(apptOpen));
      return;
    }
    if (act === "appt-status") {
      var apptSt = findAppointment(el.getAttribute("data-id"));
      var toSt = el.getAttribute("data-to");
      if (!apptSt || !APPT_STATUS[toSt]) return;
      apptSt.status = toSt;
      persist();
      toast("Agendamento " + apptSt.number + " → " + APPT_STATUS[toSt].label);
      openModal(appointmentModalHTML(apptSt));
      return;
    }
    if (act === "appt-convert") { convertAppointmentToOrder(el.getAttribute("data-id")); return; }
    if (act === "landing-menu") {
      var lnav = document.getElementById("landing-nav");
      var lopen = lnav ? lnav.classList.toggle("open") : false;
      el.setAttribute("aria-expanded", lopen ? "true" : "false");
      return;
    }
    if (act === "staff-menu") {
      var snav = document.getElementById("staff-nav");
      var sopen = snav ? snav.classList.toggle("open") : false;
      el.setAttribute("aria-expanded", sopen ? "true" : "false");
      return;
    }
    if (act === "landing-close") {
      var lnavC = document.getElementById("landing-nav");
      if (lnavC) lnavC.classList.remove("open");
      var lbtnC = document.querySelector(".landing-menu-btn");
      if (lbtnC) lbtnC.setAttribute("aria-expanded", "false");
      return;
    }

    if (act === "client-mode") { state.clientMode = el.getAttribute("data-mode") === "cadastro" ? "cadastro" : "entrar"; renderLogin(); return; }
    if (act === "nav") { e.preventDefault(); navigate(el.getAttribute("data-view")); return; }
    if (act === "logout") { setSession(null); state.view = null; state.publicView = "landing"; state.clientQuery = ""; clearAuthHash(); render(); return; }
    if (act === "orc-tab") { state.orcTab = el.getAttribute("data-tab"); render(); return; }

    if (act === "open-order") { state.searchOpen = false; state.openOrderId = el.getAttribute("data-id"); state.modal = null; render(); return; }
    if (act === "close-modal" || act === "close-modal-bg") {
      if (act === "close-modal-bg" && e.target !== el) return;
      closeModal(); return;
    }

    if (act === "new-order") { newOrderModal(); return; }
    if (act === "new-customer") { newCustomerModal(); return; }
    if (act === "new-moto") { newMotoModal(el.getAttribute("data-id")); return; }
    if (act === "new-service") { newServiceModal(); return; }
    if (act === "new-part") { newPartModal(); return; }
    if (act === "new-staff") { newStaffModal(); return; }

    if (act === "submit-form") {
      var form = document.getElementById(el.getAttribute("data-form"));
      if (form) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      return;
    }

    if (act === "set-status") {
      var os = findOrder(el.getAttribute("data-id"));
      var to = el.getAttribute("data-to");
      if (!os) return;
      if (to === "REPROVADO") { openModal(rejectModalHTML(os)); return; }
      if (to === "CANCELADO" && !window.confirm("Confirmar mudança para \"" + (STATUS[to] ? STATUS[to].label : to) + "\"?")) return;
      if (setStatus(os, to)) {
        toast("O.S. " + os.number + " → " + (STATUS[to] ? STATUS[to].label : to));
        if (to === "ENTREGUE" || to === "CANCELADO" || to === "REPROVADO") closeModal();
        else render();
      }
      return;
    }

    if (act === "confirm-reject") {
      var osr = findOrder(el.getAttribute("data-id"));
      if (!osr) return;
      var ta = document.getElementById("f-reject-reason");
      var reason = ta ? String(ta.value || "").trim() : "";
      if (!reason) { toast("Informe o motivo da reprovação.", "err"); if (ta) ta.focus(); return; }
      if (setStatus(osr, "REPROVADO", { reason: reason })) {
        toast("O.S. " + osr.number + " → Reprovado");
        closeModal();
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
      openModal(stockMoveModal(part.id, el.getAttribute("data-dir")));
      return;
    }

    if (act === "delete-part") {
      var partDel = findPart(el.getAttribute("data-id"));
      if (!partDel) return;
      openModal(deletePartModal(partDel));
      return;
    }

    if (act === "confirm-delete-part") {
      var partDpc = findPart(el.getAttribute("data-id"));
      if (!partDpc) { closeModal(); return; }
      if (ordersWithPart(partDpc.id).length) {
        openModal(deletePartModal(partDpc));
        return;
      }
      db.parts = db.parts.filter(function (p) { return p.id !== partDpc.id; });
      persist(); closeModal(); toast("Peça " + partDpc.name + " excluída.");
      return;
    }

    if (act === "reset-data") {
      if (window.confirm("Restaurar os dados de exemplo? Suas alterações serão perdidas.")) {
        resetDB(); setSession(null); state.view = null; state.publicView = "landing"; toast("Dados restaurados."); render();
      }
      return;
    }
  });

  document.addEventListener("input", function (e) {
    if (e.target.id === "client-order-search") {
      state.clientQuery = e.target.value;
      var list = document.getElementById("client-orders-list");
      var user = currentUser();
      if (list && user && user.role === "CLIENTE") list.innerHTML = clientOrdersHTML(clientFilteredOrders(user));
      return;
    }
    if (e.target.id !== "staff-search-input") return;
    state.search = e.target.value;
    state.searchOpen = true;
    var box = document.getElementById("search-results");
    if (box) {
      box.innerHTML = staffSearchResultsHTML(state.search);
      box.classList.add("open");
    }
  });
  document.addEventListener("focusin", function (e) {
    if (e.target.id !== "staff-search-input") return;
    state.searchOpen = true;
    var box = document.getElementById("search-results");
    if (box) {
      box.innerHTML = staffSearchResultsHTML(state.search);
      box.classList.add("open");
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
      clearAuthHash();
      setSession({ userId: u.id }); state.view = null; toast("Bem-vindo, " + u.name + "!"); render();
      return;
    }

    if (form.id === "form-login-client") {
      var dc = formToObject(form);
      var email = (dc.email || "").toLowerCase();
      var u = db.users.filter(function (x) { return x.email.toLowerCase() === email && x.role === "CLIENTE"; })[0];
      if (!u || u.password !== dc.password) { toast("E-mail ou senha inválidos.", "err"); return; }
      clearAuthHash();
      setSession({ userId: u.id }); state.view = null; state.clientMode = "entrar"; state.clientQuery = "";
      toast("Bem-vindo, " + u.name + "!"); render();
      return;
    }

    if (form.id === "form-signup-client") {
      var ds = formToObject(form);
      var emailS = (ds.email || "").toLowerCase();
      if (!ds.name || ds.name.trim().length < 2) { toast("Informe seu nome.", "err"); return; }
      if (!ds.password || ds.password.length < 4) { toast("A senha precisa de no mínimo 4 caracteres.", "err"); return; }
      if (ds.password !== ds.password2) { toast("As senhas não conferem.", "err"); return; }
      var dup = db.users.filter(function (x) { return x.email.toLowerCase() === emailS; })[0];
      if (dup) { toast("E-mail já cadastrado. Use Entrar.", "err"); return; }
      var custNew = { id: uid("c"), name: ds.name.trim(), email: ds.email, phone: ds.phone || "", doc: "", address: "", lgpd: true };
      db.customers.push(custNew);
      var nu = { id: uid("u"), name: custNew.name, email: ds.email, password: ds.password, role: "CLIENTE", customerId: custNew.id };
      db.users.push(nu);
      persist(); clearAuthHash(); setSession({ userId: nu.id }); state.view = null; state.clientMode = "entrar"; state.clientQuery = "";
      toast("Conta criada. Bem-vindo, " + nu.name + "!"); render();
      return;
    }

    if (form.id === "form-chat") {
      var fc = formToObject(form);
      var text = String(fc.message || "").trim();
      if (!text) return;
      chatPush("user", text);
      chatPush("bot", chatBotReply(text));
      form.reset();
      render();
      return;
    }

    if (form.id === "form-new-appointment") {
      var na = formToObject(form);
      var motoA = findMoto(na.motorcycleId);
      if (!motoA) { toast("Selecione uma moto.", "err"); return; }
      if (!na.date || !na.time) { toast("Informe data e hora.", "err"); return; }
      var conflict = db.appointments.filter(function (a) {
        return a.date === na.date && a.time === na.time && a.status !== "CONCLUIDO";
      })[0];
      if (conflict) { toast("Já existe agendamento nesse horário.", "err"); return; }
      var svcA = na.serviceId ? db.services.filter(function (s) { return s.id === na.serviceId; })[0] : null;
      var appt = {
        id: uid("a"), number: "AG-" + (db.seq.appointment++),
        customerId: motoA.customerId, motorcycleId: motoA.id,
        date: na.date, time: na.time, status: na.status || "PRE_AGENDADO",
        serviceId: svcA ? svcA.id : null, service: svcA ? svcA.name : (na.complaint || "Agendamento"),
        complaint: na.complaint || "", orderId: null, createdAt: nowLocal()
      };
      db.appointments.push(appt);
      persist();
      state.modal = null;
      state.agenda.cursor = na.date;
      toast("Agendamento " + appt.number + " criado.");
      render();
      return;
    }

    if (form.id === "form-add-item") {
      var os = findOrder(form.getAttribute("data-id"));
      if (!os || !canEditItems(os)) return;
      var fo = formToObject(form);
      var parts = (fo.item || "").split(":");
      var type = parts[0], refId = parts[1], qty = Math.max(1, parseInt(fo.qty, 10) || 1);
      var name, price, cost = 0;
      if (type === "LABOR") {
        var svc = db.services.filter(function (s) { return s.id === refId; })[0];
        if (!svc) return;
        name = svc.name; price = n2(svc.price);
      } else {
        var part = findPart(refId);
        if (!part) return;
        var avail = availableForPart(part.id);
        if (qty > avail) { toast("Falta no estoque: disponível " + avail + " un. de " + part.name + ".", "err"); return; }
        name = part.name; price = n2(part.price); cost = n2(part.cost);
      }
      os.items.push({ type: type, refId: refId, name: name, qty: qty, unitPrice: price, unitCost: cost });
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
        price: n2(p.price), cost: n2(p.cost), qty: parseInt(p.qty, 10) || 0, minQty: parseInt(p.minQty, 10) || 0, location: p.location || "" });
      persist(); state.modal = null; toast("Peça cadastrada."); render();
      return;
    }

    if (form.id === "form-stock-move") {
      var part = findPart(form.getAttribute("data-id"));
      var dir = form.getAttribute("data-dir");
      if (!part) { closeModal(); return; }
      var fo = formToObject(form);
      var q = parseInt(fo.qty, 10);
      if (isNaN(q) || q <= 0) {
        openModal(stockMoveModal(part.id, dir, "Informe uma quantidade maior que zero.", fo.qty));
        return;
      }
      if (dir === "out") {
        var avail = availableForPart(part.id);
        if (q > avail) {
          openModal(stockMoveModal(part.id, dir, "Quantidade indisponível. Disponível para saída: " + avail + " un.", fo.qty));
          return;
        }
        part.qty = Math.max(0, n2(part.qty) - q);
      } else {
        part.qty = n2(part.qty) + q;
      }
      persist(); closeModal(); toast("Estoque de " + part.name + " atualizado.");
      return;
    }

    if (form.id === "form-new-staff") {
      var st = formToObject(form);
      var emailSt = (st.email || "").toLowerCase();
      if (!st.name || st.name.trim().length < 2) { toast("Informe o nome do funcionário.", "err"); return; }
      if (!emailSt) { toast("Informe o e-mail.", "err"); return; }
      if (!st.password || st.password.length < 4) { toast("A senha precisa de no mínimo 4 caracteres.", "err"); return; }
      if (st.password !== st.password2) { toast("As senhas não conferem.", "err"); return; }
      var dupSt = db.users.filter(function (x) { return x.email.toLowerCase() === emailSt; })[0];
      if (dupSt) { toast("E-mail já cadastrado. Use outro.", "err"); return; }
      db.users.push({ id: uid("u"), name: st.name.trim(), email: st.email, password: st.password, role: "FUNCIONARIO" });
      persist(); state.modal = null; toast("Funcionário " + st.name.trim() + " cadastrado."); render();
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (state.searchOpen) { closeSearchResults(); return; }
    var openMore = document.querySelector(".nav-more[open]");
    if (openMore) { openMore.removeAttribute("open"); return; }
    var staffNavEl = document.getElementById("staff-nav");
    if (staffNavEl && staffNavEl.classList.contains("open")) {
      staffNavEl.classList.remove("open");
      var staffMenuBtn = document.querySelector(".staff-menu-btn");
      if (staffMenuBtn) staffMenuBtn.setAttribute("aria-expanded", "false");
      return;
    }
    if (state.modal || state.openOrderId) closeModal();
  });

  /* ============================================================
     11. Rotas de login e inicio
     ============================================================ */
  function applyAuthHash(renderAfter) {
    var hash = String(location.hash || "");
    if (currentUser()) {
      if (hash === "#/login" || hash === "#/login/cliente") clearAuthHash();
      return;
    }
    if (hash === "#/login/cliente") {
      state.publicView = "login";
      state.loginTab = "client";
      state.clientMode = "entrar";
      state.modal = null;
      if (renderAfter) render();
      return;
    }
    if (hash === "#/login") {
      state.publicView = "login";
      state.loginTab = "staff";
      state.clientMode = "entrar";
      state.modal = null;
      if (renderAfter) render();
      return;
    }
    if (state.publicView === "login") {
      state.publicView = "landing";
      if (renderAfter) render();
    }
  }
  window.addEventListener("hashchange", function () { applyAuthHash(true); });

  applyTheme(getTheme());
  applyAuthHash(false);
  var startUser = currentUser();
  state.view = startUser ? defaultView(startUser) : null;
  render();
})();
