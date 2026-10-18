/* =====================================================================
   SGOM - marca/brand.js
   FONTE UNICA DA MARCA (brand kit).

   Tudo que e simbolo/cor da logo vive aqui. Para MELHORAR ou TROCAR
   a logo no futuro: edite apenas este arquivo e confira em
   marca/preview.html (nenhum outro arquivo precisa ser tocado).

   Conceito: "A - S em curso"  (S italico + aro de roda + riscos de
   velocidade, sobre badge circular laranja).

   Como usar:
     window.SGOM_brandMark(size, opts) -> string <svg>

   opts = {
     variant: "compact" (default) | "full",
       compact = badge ocupa todo o viewBox (uso em app/tamanho pequeno)
       full    = badge menor + riscos de velocidade PARA FORA do badge
                 (silhueta assimetrica; usar em tamanhos grandes/preview)
     tone: "color" (default) | "mono-white" | "mono-dark"
   }
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Tokens (paleta e medidas da marca) ---------- */
  var BRAND = {
    name: "SGOM",
    full: "Sistema de Gerenciamento para Oficina de Motos",
    concept: "A - S em curso",
    version: "1.0.0",
    colors: {
      accent: "#f97316",        /* laranja da marca */
      accentStrong: "#c2410c",  /* laranja escuro (estado ativo) */
      dark: "#14171a",          /* preto da marca */
      white: "#ffffff"
    },
    measures: {
      minPx: 20,          /* tamanho minimo recomendado */
      clearSpace: 0.5,    /* area de respiro = metade do raio do badge */
      ringWidth: 2.4,
      ringOpacity: 0.5,
      sStroke: 4.6
    },
    variants: ["compact", "full"],
    tones: ["color", "mono-white", "mono-dark"]
  };

  /* ---------- Geometria ----------
     viewBox do compact: 48x48 (badge = circulo cheio r=24)
     viewBox do full:    76x48 (badge r=22 centrado em 48,24 + riscos a esquerda)
     O "S" e um unico path com trafoes (skew italico + escala) para
     ultrapassar o aro (rompe a roda) sem virar borrao em 16px. */
  var S_PATH =
    "M30.2 17.8" +
    "C30.2 14.2 27.5 12.2 24 12.2" +
    "C20.5 12.2 17.8 14.3 17.8 17.6" +
    "C17.8 20.8 20.6 22.3 24 23.4" +
    "C27.4 24.5 30.2 26 30.2 29.2" +
    "C30.2 32.5 27.5 34.5 24 34.5" +
    "C20.5 34.5 17.8 32.6 17.8 29.2";

  var GEOM = {
    compact: {
      viewBox: "0 0 48 48",
      aspect: 1,
      badge: { cx: 24, cy: 24, r: 24 },
      ring: { cx: 24, cy: 24, r: 13.5 },
      sTransform: "translate(24 24) skewX(-7) scale(1.25) translate(-24 -24)",
      /* riscos de velocidade: no aro laranja, a esquerda (fora do aro branco) */
      streaks: [
        { d: "M3.2 19.5 H7.4", sw: 3.2 },
        { d: "M3.2 28.5 H7.4", sw: 3.2 }
      ]
    },
    full: {
      viewBox: "0 0 76 48",
      aspect: 76 / 48,
      badge: { cx: 48, cy: 24, r: 22 },
      ring: { cx: 48, cy: 24, r: 14 },
      /* path do S nasce centrado em (24,24): por isso translate(-24 -24) */
      sTransform: "translate(48 24) skewX(-7) scale(1.25) translate(-24 -24)",
      /* riscos PARA FORA do badge = silhueta dinamica */
      streaksOutside: true,
      streaks: [
        { d: "M4 18 H20", sw: 4.5 },
        { d: "M11 31 H23", sw: 4.5 }
      ]
    }
  };

  function toneColor(tone, kind) {
    /* kind: "content" (S/arco/riscos internos) | "badge" | "streak" */
    if (tone === "mono-white") return "#ffffff";
    if (tone === "mono-dark") return "#14171a";
    /* color */
    if (kind === "badge") return BRAND.colors.accent;
    if (kind === "streak") return BRAND.colors.accent; /* risco externo */
    return "#ffffff";
  }

  function esc(s) { return String(s); }

  window.SGOM_BRAND = BRAND;

  window.SGOM_brandMark = function (size, opts) {
    opts = opts || {};
    var variant = GEOM[opts.variant] ? opts.variant : "compact";
    var g = GEOM[variant];
    var tone = opts.tone || "color";
    var m = BRAND.measures;
    var h = Number(size) || 48;
    var w = Math.round(h * g.aspect * 100) / 100;

    var hasBadge = tone === "color";
    var content = toneColor(tone, "content");
    var badgeFill = toneColor(tone, "badge");
    /* risco FORA do badge usa laranja (concatena com ele);
       risco DENTRO do badge usa a cor do conteudo (senao some no laranja) */
    var streakTone = (g.streaksOutside && hasBadge) ? toneColor(tone, "streak") : content;

    var parts = [];
    parts.push(
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
      '" viewBox="' + g.viewBox + '" role="img" aria-label="Logo ' + BRAND.name + '" focusable="false">'
    );

    if (hasBadge) {
      parts.push('<circle cx="' + g.badge.cx + '" cy="' + g.badge.cy + '" r="' + g.badge.r + '" fill="' + badgeFill + '"/>');
    }

    /* aro (roda) */
    parts.push(
      '<circle cx="' + g.ring.cx + '" cy="' + g.ring.cy + '" r="' + g.ring.r +
      '" fill="none" stroke="' + content + '" stroke-width="' + m.ringWidth +
      '" opacity="' + m.ringOpacity + '"/>'
    );

    /* S em curso */
    parts.push(
      '<path d="' + S_PATH + '" transform="' + g.sTransform +
      '" fill="none" stroke="' + content + '" stroke-width="' + m.sStroke +
      '" stroke-linecap="round" stroke-linejoin="round"/>'
    );

    /* riscos de velocidade */
    g.streaks.forEach(function (st) {
      parts.push(
        '<path d="' + st.d + '" fill="none" stroke="' + streakTone +
        '" stroke-width="' + st.sw + '" stroke-linecap="round"/>'
      );
    });

    parts.push("</svg>");
    return esc(parts.join(""));
  };
})();
