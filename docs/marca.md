# SGOM — Guia da Marca (Brand Kit)

> Visão rápida e passo a passo para **alterar, melhorar ou criar outra logo** depois.
> **Fonte única:** [`marca/brand.js`](../marca/brand.js). Confira sempre em [`marca/preview.html`](../marca/preview.html).

---

## 1. Conceito

**"A — S em curso"**: um badge **circular laranja** (a roda), com **aro interno branco** fino,
um **"S" italico de traço grosso que rompe o aro**, e **riscos de velocidade** que dão o
sentido de movimento. A roda + o S em movimento remetem direto ao público-alvo (motos).

- **Legibilidade:** o S é desenhado com traço grosso e cantos arredondados, então não
  vira borrão nem a 16px.
- **Assimetria:** os riscos de velocidade (variant `full`) saem do badge e criam a
  silhueta reconhecível. A 34/48px usa-se a variant `compact`, mais limpa.

---

## 2. Arquivos

| Arquivo | O que é | Quando mexer |
|---|---|---|
| `marca/brand.js` | **Fonte única**: tokens (cores/medidas), geometria (paths, viewBox, transform) e a função `window.SGOM_brandMark(size, opts)` | **Sempre** — é aqui que a logo mora |
| `marca/preview.html` | Galeria de validação (tamanhos, fundos, variantes, lockups, favicon) | Ao validar qualquer mudança |
| `marca/sync-favicon.js` | Regenera o `favicon.svg` a partir do `brand.js` (rode `node marca/sync-favicon.js`) | Nunca edita a logo; só sincroniza |
| `favicon.svg` | Favicon autocontido (cópia do `compact`, gerada) | Nunca na mão — rode o `sync-favicon.js` |
| `docs/marca.md` | Este guia | Ao mudar conceito/regras |
| `styles.css` → `.brand-mark`, `.login-head h1`, `.topbar .brand strong` | Caixa do badge + caixa do wordmark | Só se a caixa/tipo do badge mudar |

O app chama a marca em dois pontos:
- `app.js` → `brandMark(48)` (tela de login)
- `app.js` → `brandMark(34)` (topbar)

Com **fallback**: se `brand.js` não carregar, `brandMark()` devolve `icon("bike")`
e o app continua funcionando.

---

## 3. Tokens

| Token | Valor | Uso |
|---|---|---|
| `accent` | `#f97316` | Badge, elementos de ação, destaques |
| `accentStrong` | `#c2410c` | Hover/pressed do laranja |
| `dark` | `#14171a` | Fundos escuros, texto sobre laranja/branco |
| `white` | `#ffffff` | Conteúdo do badge (S, aro, riscos internos) |

**Medidas-chave** (`BRAND.measures`): `minPx: 20` · `ringWidth: 2.4` · `ringOpacity: 0.5` ·
`sStroke: 4.6`.

---

## 4. Variantes e tons

`SGOM_brandMark(size, { variant, tone })`

| Opção | Valores | Quando usar |
|---|---|---|
| `variant` | `compact` (default) · `full` | `compact` = badge cheio, tamanhos ≤48px (app). `full` = badge menor + riscos **para fora** (silhueta assimétrica) — só ≥128px |
| `tone` | `color` (default) · `mono-white` · `mono-dark` | `color` = laranja + branco. `mono-white` = tudo branco (fundo escuro). `mono-dark` = tudo preto (fundo claro) |

**Regra de fundo:** sobre **laranja** ou **preto** use `color`/`mono-white`; sobre
**branco/claro** use `mono-dark` (senão o conteúdo branco some).

---

## 5. Uso correto

- **Tamanho mínimo:** 20px de altura (aba/favicon: 16px é aceitável; abaixo disso use só o badge).
- **Área de respiro:** metade do raio do badge em todos os lados (≈ `size/4`).
- **Fundo:** preferir `#14171a` (login/topbar) ou `#f4f5f7`. Sobre foto usar `mono-white` + sombra.
- **Wordmark "SGOM":** texto simples, `font-weight: 800`, `letter-spacing: .1em` —
  **não** desenhar detalhe no "O".

### Usos errados
- Distorcer/apertar (o SVG tem proporção travada — respeite `width/height`).
- Girar ou inclinar o badge além do skew embutido no "S".
- Trocar o laranja por outra cor sem atualizar os tokens.
- Aplicar `color` (branco) sobre fundo branco.
- Reduzir abaixo de 20px ou adicionar sombra/grande efeito no badge.

---

## 6. Passo a passo para TROCAR a logo no futuro

1. **Edite só `marca/brand.js`**: troque `GEOM.*.badge/ring/sTransform/streaks`
   (e `S_PATH`, se quiser outra letra). Mantenha o `viewBox` consistente com o desenho.
2. **Abra `marca/preview.html`** no navegador e confira: 16/20/34/48px, os 4 fundos,
   as 3 variantes de tom, os lockups de login/topbar e o favicon. Se aparecer erro
   em vermelho no topo, a função não carregou.
3. **Sincronize o `favicon.svg`**: rode `node marca/sync-favicon.js` (ele reescreve o
   arquivo a partir do `compact`). Não edite o favicon à mão, senão defasa.
4. **Regras de geometria que já valem** (para não recair em erro):
   - o **risco dentro do badge precisa ser branco** (`streaksOutside: false` → usa a cor
     do conteúdo); só o risco **fora** do badge usa laranja;
   - o `S` precisa **cruzar o aro** (`distância máx. > ring.r`) mas **caber no badge**
     (`distância máx. + metade do traço ≤ badge.r`);
   - riscos e `S` não podem se encostar (folga ≥ 0,6u);
   - o `S_PATH` nasce centrado em `(24,24)` — no `full`, o `sTransform` começa com
     `translate(48 24)` e termina com `translate(-24 -24)`.
5. **Só se a caixa do badge mudar**, ajuste `.brand-mark` em `styles.css`
   (hoje o `<span>` tem `background: var(--accent)` + `border-radius: 50%`, o que
   serve de fallback visual caso o SVG falhe). Se a nova logo não for circular,
   remova `border-radius: 50%` e o background.
6. **Valide no app:** abra a tela de login e a topbar; confira `node --check app.js`
   e a suíte smoke (o smoke inclui `t0a`/`t2b`, que garantem a logo no login e na
   topbar, e um cenário sem `brand.js` que prova o fallback).
7. Atualize a versão em `BRAND.version` e registre a mudança neste arquivo.

### Estrutura rápida do `brand.js`
```
BRAND      → tokens (name, colors, measures, variants, tones)
GEOM       → compact { viewBox 48x48, badge r24, ring r13.5, sTransform scale 1.25,
                       streaks dentro do aro laranja (brancos) }
             full    { viewBox 76x48, badge r22, ring r14, sTransform scale 1.25
                       (translate(48 24) ... translate(-24 -24)),
                       streaksOutside: true, streaks fora do badge (laranja) }
S_PATH     → path do "S" (traço único, sem fill, centrado em 24,24)
toneColor()→ resolve cor por tom
SGOM_brandMark(size, opts) → string <svg>
```
