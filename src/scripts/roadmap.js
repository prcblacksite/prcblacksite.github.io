// PRC roadmap · the map, ported from the prototype as it is; only the links to an item changed.
// The map. Status rings from the centre out (live, being built, next, later,
// exploring), one sector per category, and a line for everything that waits on something else.
// Nodes are buttons laid over the drawing, so a mouse, a finger and a keyboard all reach them.
// Labels that would collide stay hidden until you zoom in, hover or pick something nearby.
// There are no dates anywhere, on purpose: order comes from what waits on what.
(() => {
  "use strict";
  const root = document.querySelector("[data-roadmap]");
  if (!root) return;
  const DATA = JSON.parse(document.getElementById("roadmap-data").textContent);
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => Array.from(el.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wide = window.matchMedia("(min-width: 720px)");
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* fine */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const STATUS = DATA.statuses.map((s) => s.key);
  const SLABEL = Object.fromEntries(DATA.statuses.map((s) => [s.key, s.label]));
  const CATS = DATA.categories.map((c) => c.key);
  const CLABEL = Object.fromEntries(DATA.categories.map((c) => [c.key, c.label]));
  const items = DATA.items;
  const byId = new Map(items.map((i) => [i.id, i]));
  const unlocks = new Map(items.map((i) => [i.id, []]));
  for (const i of items) for (const d of i.waits_on) if (unlocks.has(d)) unlocks.get(d).push(i.id);

  // ---------------------------------------------------------------- geometry, in world units
  // The map is drawn on an ellipse as wide as the box allows: labels run sideways, so width is
  // what they need. A is that stretch, set from the box each time the map is drawn.
  const TAU = Math.PI * 2;
  const GAP = (28 * Math.PI) / 180; // an empty wedge at the top, where the ring names sit
  const SPAN = (TAU - GAP) / CATS.length;
  const START = -Math.PI / 2 + GAP / 2;
  const BAND = {};
  STATUS.forEach((s, i) => {
    const c = i === 0 ? 230 : 405 + (i - 1) * 125; // the first ring holds the most, so it is wider
    const half = i === 0 ? 90 : 40;
    BAND[s] = [c - half, c + half];
  });
  const RING = Object.fromEntries(STATUS.map((s) => [s, (BAND[s][0] + BAND[s][1]) / 2]));
  const OUTER = BAND[STATUS[STATUS.length - 1]][1];
  const CAT_R = OUTER + 46; // category names run along the rim, just outside the last ring
  const FIT_R = CAT_R + 40;
  const HUB_R = 104;
  const MIN_D = 76;
  let A = 1;
  const norm = (a) => ((a % TAU) + TAU) % TAU;
  const sectorStart = (cat) => START + CATS.indexOf(cat) * SPAN;
  const relAngle = (a, a0) => { let r = norm(a - a0); if (r > Math.PI + SPAN / 2) r -= TAU; return r; };
  const at = (r, a) => ({ x: r * Math.cos(a) * A, y: r * Math.sin(a) });

  function layout() {
    const cells = new Map();
    for (const it of items) {
      const k = `${it.category}|${it.status}`;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(it);
    }
    const pos = new Map();
    const place = () => {
      for (const [k, list] of cells) {
        const [cat, st] = k.split("|");
        const a0 = sectorStart(cat), [lo, hi] = BAND[st], n = list.length, m = 0.12;
        list.forEach((it, j) => {
          const stagger = n >= 3 ? (j % 2 ? 1 : -1) * (hi - lo) * 0.28 : 0;
          pos.set(it.id, { a: a0 + m + ((j + 0.5) * (SPAN - 2 * m)) / n, r: (lo + hi) / 2 + stagger });
        });
      }
    };
    place();
    // Order each cell by where its neighbours sit, so fewer lines cross.
    const near = (id) => [...byId.get(id).waits_on, ...unlocks.get(id)].filter((n) => pos.has(n));
    for (let pass = 0; pass < 4; pass++) {
      for (const [k, list] of cells) {
        const a0 = sectorStart(k.split("|")[0]);
        const keyed = list.map((it, j) => {
          const ns = near(it.id);
          if (!ns.length) return { it, k: ((j + 0.5) / list.length) * SPAN };
          let sx = 0, sy = 0;
          for (const n of ns) { const p = pos.get(n); sx += Math.cos(p.a); sy += Math.sin(p.a); }
          return { it, k: relAngle(Math.atan2(sy, sx), a0) };
        });
        keyed.sort((x, y) => x.k - y.k);
        list.splice(0, list.length, ...keyed.map((x) => x.it));
      }
      place();
    }
    // Push apart anything too close, then hold each node inside its ring and its sector.
    const pts = items.map((it) => { const p = pos.get(it.id); return { it, ...at(p.r, p.a) }; });
    for (let iter = 0; iter < 240; iter++) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const p = pts[i], q = pts[j];
          let dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
          if (d >= MIN_D) continue;
          if (d < 0.01) { dx = 1; dy = 0; d = 1; }
          const push = (MIN_D - d) / 2;
          dx /= d; dy /= d;
          p.x -= dx * push; p.y -= dy * push; q.x += dx * push; q.y += dy * push;
        }
      }
      for (const p of pts) {
        const [lo, hi] = BAND[p.it.status], a0 = sectorStart(p.it.category), m = 0.06;
        const r = Math.min(hi, Math.max(lo, Math.hypot(p.x / A, p.y)));
        const rel = Math.min(SPAN - m, Math.max(m, relAngle(Math.atan2(p.y, p.x / A), a0)));
        const q = at(r, a0 + rel);
        p.x = q.x;
        p.y = q.y;
      }
    }
    return new Map(pts.map((p) => [p.it.id, { x: p.x, y: p.y }]));
  }

  function edgePath(a, b) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const pull = Math.min(0.45, Math.hypot(b.x - a.x, b.y - a.y) / 1600);
    const f = (n) => n.toFixed(1);
    return `M${f(a.x)} ${f(a.y)}Q${f(mx * (1 - pull))} ${f(my * (1 - pull))} ${f(b.x)} ${f(b.y)}`;
  }

  // ---------------------------------------------------------------- drawing
  const NS = "http://www.w3.org/2000/svg";
  const canvas = $("[data-canvas]");
  const stage = $(".rm-stage");
  const panel = $("[data-detail]");
  const hintEl = $("[data-hint]");
  const zoomBox = $(".rm-zoom");
  const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  let world, edgesG, hotG, pos;
  const nodeEls = new Map();
  const edgeEls = [];
  const ringLbls = [];
  const catBtns = [];
  let drawn = false;

  function draw() {
    A = Math.min(1.5, Math.max(1, canvas.clientWidth / Math.max(1, canvas.clientHeight)));
    pos = layout();
    const svg = svgEl("svg", { class: "rm-svg", "aria-hidden": "true", focusable: "false" });
    world = svgEl("g", {});
    svg.append(world);
    const core = BAND[STATUS[0]][1] + 18;
    world.append(svgEl("ellipse", { rx: core * A, ry: core, class: "rm-core" }));
    for (const s of STATUS) world.append(svgEl("ellipse", { rx: RING[s] * A, ry: RING[s], class: "rm-ring", "data-s": s }));
    for (let i = 0; i <= CATS.length; i++) {
      const a = START + i * SPAN, p0 = at(HUB_R + 24, a), p1 = at(OUTER + 30, a);
      world.append(svgEl("line", { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, class: "rm-spoke" }));
    }
    edgesG = svgEl("g", {});
    hotG = svgEl("g", {});
    world.append(edgesG, hotG);
    for (const it of items) {
      for (const d of it.waits_on) {
        if (!pos.has(d)) continue;
        const p = svgEl("path", { d: edgePath(pos.get(d), pos.get(it.id)), class: "rm-edge" });
        p.dataset.from = d;
        p.dataset.to = it.id;
        edgesG.append(p);
        edgeEls.push(p);
      }
    }
    world.append(svgEl("circle", { r: HUB_R, class: "rm-hub" }));
    world.append(svgEl("image", { href: DATA.seal, x: -88, y: -88, width: 176, height: 176 }));

    const layer = document.createElement("div");
    layer.className = "rm-layer";
    for (const s of STATUS) {
      const span = document.createElement("span");
      span.className = "rm-ring-lbl";
      span.dataset.s = s;
      span.textContent = SLABEL[s];
      span._w = { x: 0, y: -RING[s] };
      layer.append(span);
      ringLbls.push(span);
    }
    CATS.forEach((c, i) => {
      const a = START + (i + 0.5) * SPAN;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "rm-cat";
      b.dataset.cat = c;
      b.innerHTML = `${esc(CLABEL[c])}<span>${items.filter((x) => x.category === c).length}</span>`;
      b.setAttribute("aria-label", `Zoom to ${CLABEL[c]}`);
      // Turned to follow the rim, so the names at the sides take no extra width.
      let t = (Math.atan2(Math.cos(a), -A * Math.sin(a)) * 180) / Math.PI;
      if (t > 90) t -= 180;
      if (t <= -90) t += 180;
      b._rot = (t * Math.PI) / 180;
      b.style.setProperty("--rot", `${t.toFixed(1)}deg`);
      b._w = at(CAT_R, a);
      layer.append(b);
      catBtns.push(b);
    });
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "rm-node";
      b.dataset.id = it.id;
      b.dataset.s = it.status;
      if (it.redacted) b.dataset.redacted = "";
      b.setAttribute("aria-label", `${it.title}. ${SLABEL[it.status]}. ${CLABEL[it.category]}.${it.redacted ? " Classified." : ""}`);
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<span class="dot"></span><span class="lbl">${esc(it.title)}</span>`;
      b._w = pos.get(it.id);
      b._i = i;
      layer.append(b);
      nodeEls.set(it.id, b);
    });
    canvas.replaceChildren(svg, layer);
    drawn = true;
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); schedule(); });
  }

  function measure() {
    for (const b of nodeEls.values()) { const l = b.lastChild; b._lw = l.offsetWidth; b._lh = l.offsetHeight; }
    for (const l of ringLbls) { l._lw = l.offsetWidth; l._lh = l.offsetHeight; }
    for (const c of catBtns) { c._lw = c.offsetWidth; c._lh = c.offsetHeight; }
  }

  // ---------------------------------------------------------------- the view
  let W = 0, H = 0, fitK = 1, view = { k: 1, x: 0, y: 0 }, frame = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const kMin = () => fitK * 0.7;
  const kMax = () => Math.max(fitK * 6, 1.6);
  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    fitK = Math.max(0.05, Math.min((W - 48) / (2 * FIT_R * A), (H - 48) / (2 * FIT_R)));
  }
  function fitView() { return { k: fitK, x: W / 2, y: H / 2 }; }
  function clampView() {
    const r = FIT_R * view.k;
    view.x = clamp(view.x, W * 0.2 - r * A, W * 0.8 + r * A);
    view.y = clamp(view.y, H * 0.2 - r, H * 0.8 + r);
  }
  function schedule() { if (!frame && drawn) frame = requestAnimationFrame(apply); }
  function apply() {
    frame = 0;
    if (!drawn || !W) return;
    world.setAttribute("transform", `translate(${view.x.toFixed(1)} ${view.y.toFixed(1)}) scale(${view.k.toFixed(4)})`);
    for (const el of [...ringLbls, ...catBtns, ...nodeEls.values()]) {
      el._sx = view.x + el._w.x * view.k;
      el._sy = view.y + el._w.y * view.k;
      el.style.left = `${el._sx.toFixed(1)}px`;
      el.style.top = `${el._sy.toFixed(1)}px`;
    }
    placeLabels();
  }
  function zoomAt(f, px, py) {
    const k = clamp(view.k * f, kMin(), kMax());
    const s = k / view.k;
    view = { k, x: px - (px - view.x) * s, y: py - (py - view.y) * s };
    clampView();
    schedule();
  }
  let anim = 0;
  function animateTo(target) {
    cancelAnimationFrame(anim);
    if (reduce.matches) { view = target; schedule(); return; }
    const from = { ...view }, t0 = performance.now(), D = 320;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 3);
      view = { k: from.k + (target.k - from.k) * e, x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e };
      apply();
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  function centreOn(id) {
    const p = pos.get(id);
    if (!p) return;
    const k = Math.max(view.k, fitK * 1.6);
    const cx = !panel.hidden && wide.matches ? (W - panel.offsetWidth - 24) / 2 : W / 2;
    const cy = !panel.hidden && !wide.matches ? H * 0.32 : H / 2;
    animateTo({ k, x: cx - p.x * k, y: cy - p.y * k });
  }
  function zoomToCategory(cat) {
    const ps = items.filter((i) => i.category === cat).map((i) => pos.get(i.id));
    ps.push(at(CAT_R, START + (CATS.indexOf(cat) + 0.5) * SPAN));
    const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
    const x0 = Math.min(...xs) - 120, x1 = Math.max(...xs) + 120, y0 = Math.min(...ys) - 80, y1 = Math.max(...ys) + 80;
    const k = clamp(Math.min(W / (x1 - x0), H / (y1 - y0)), kMin(), kMax());
    animateTo({ k, x: W / 2 - ((x0 + x1) / 2) * k, y: H / 2 - ((y0 + y1) / 2) * k });
  }

  // Labels: the one you picked and its neighbours first, then what is planned (being built,
  // next, later, exploring), then what is already live. A label shows only where it fits
  // without covering another label, a dot, the seal or the controls.
  const PLAN_ORDER = ["building", "next", "later", "exploring", ...STATUS.filter((s) => !["building", "next", "later", "exploring"].includes(s))];
  function placeLabels() {
    const boxes = [];
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const hub = HUB_R * view.k;
    boxes.push({ x: view.x - hub, y: view.y - hub, w: hub * 2, h: hub * 2 });
    for (const l of ringLbls) boxes.push({ x: l._sx - l._lw / 2, y: l._sy - l._lh / 2, w: l._lw, h: l._lh });
    for (const c of catBtns) {
      const w = Math.abs(c._lw * Math.cos(c._rot)) + Math.abs(c._lh * Math.sin(c._rot));
      const h = Math.abs(c._lw * Math.sin(c._rot)) + Math.abs(c._lh * Math.cos(c._rot));
      boxes.push({ x: c._sx - w / 2, y: c._sy - h / 2, w, h });
    }
    if (zoomBox) boxes.push({ x: zoomBox.offsetLeft, y: zoomBox.offsetTop, w: zoomBox.offsetWidth, h: zoomBox.offsetHeight });
    if (!panel.hidden && wide.matches) boxes.push({ x: panel.offsetLeft, y: panel.offsetTop, w: panel.offsetWidth, h: panel.offsetHeight });
    const shown = [...nodeEls.values()].filter((b) => !b.hidden);
    const dots = shown.map((b) => ({ b, x: b._sx - 9, y: b._sy - 9, w: 18, h: 18 }));
    const rank = (b) => b.classList.contains("sel") ? 0 : b.classList.contains("dep") || b.classList.contains("unl") ? 1 : b.classList.contains("qhit") ? 2 : 3 + PLAN_ORDER.indexOf(b.dataset.s) + (b.classList.contains("qdim") ? 10 : 0);
    shown.sort((a, b) => rank(a) - rank(b) || a._i - b._i);
    for (const b of shown) {
      const w = b._lw, h = b._lh;
      const R = { x: b._sx + 14, y: b._sy - h / 2, w, h };
      const L = { x: b._sx - 14 - w, y: b._sy - h / 2, w, h };
      const tries = b._w.x >= 0 ? [R, L] : [L, R];
      let got = null;
      for (const t of tries) {
        const inside = t.x >= 4 && t.y >= 4 && t.x + t.w <= W - 4 && t.y + t.h <= H - 4;
        if (rank(b) === 0 || (inside && !boxes.some((o) => hit(t, o)) && !dots.some((d) => d.b !== b && hit(t, d)))) { got = t; break; }
      }
      b.classList.toggle("nolabel", !got);
      if (got) { boxes.push(got); b.classList.toggle("left", got === L); }
    }
  }

  // ---------------------------------------------------------------- picking
  let selected = null;
  const X = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  function relList(ids, cls, title, none) {
    const lis = ids.map((d) => {
      const x = byId.get(d);
      return `<li><button type="button" data-go="${esc(d)}" data-s="${esc(x.status)}"><i></i><span>${esc(x.title)}</span><small>${esc(SLABEL[x.status])}</small></button></li>`;
    }).join("");
    return `<div class="rm-rel ${cls}"><p class="k">${title}</p>${ids.length ? `<ul>${lis}</ul>` : `<p class="none">${none}</p>`}</div>`;
  }

  function renderPanel(it) {
    const sum = it.redacted
      ? '<div class="sum redacted" aria-hidden="true"><span class="bar"></span><span class="bar short"></span></div><p class="note">Classified. It is on this map because it exists.</p>'
      : `<p class="sum">${esc(it.summary)}</p>`;
    panel.innerHTML =
      `<button type="button" class="rm-close" data-close aria-label="Close">${X}</button>` +
      `<p class="k">${esc(CLABEL[it.category])}</p>` +
      `<h2 id="rm-detail-t" tabindex="-1">${esc(it.title)}</h2>` +
      `<span class="chip" data-s="${esc(it.status)}">${esc(SLABEL[it.status])}</span>${sum}` +
      relList(it.waits_on, "dep", "Waits on", "Nothing. It stands on its own.") +
      relList(unlocks.get(it.id), "unl", "Unlocks", "Nothing yet.") +
      '<div class="rm-copy"><button type="button" class="btn small" data-copy>Copy link</button><span class="ok" data-copied hidden>Copied</span></div>';
    panel.hidden = false;
  }

  function select(id, { centre = true, focusPanel = false } = {}) {
    const it = byId.get(id);
    if (!it) return;
    selected = id;
    root.classList.add("has-sel");
    const deps = new Set(it.waits_on), unl = new Set(unlocks.get(id));
    for (const [k, b] of nodeEls) {
      b.classList.toggle("sel", k === id);
      b.classList.toggle("dep", deps.has(k));
      b.classList.toggle("unl", unl.has(k));
      b.setAttribute("aria-pressed", String(k === id));
    }
    for (const p of edgeEls) {
      const isDep = p.dataset.to === id, isUnl = p.dataset.from === id;
      p.classList.toggle("dep", isDep);
      p.classList.toggle("unl", isUnl);
      (isDep || isUnl ? hotG : edgesG).append(p);
    }
    for (const r of $$(".rm-row")) r.classList.toggle("landed", r.dataset.id === id);
    renderPanel(it);
    if (drawn && centre) centreOn(id);
    if (focusPanel) $("#rm-detail-t", panel).focus({ preventScroll: true });
    try { history.replaceState(null, "", `#${id}`); } catch (e) { /* fine */ }
    schedule();
  }

  function deselect(returnFocus = false) {
    const was = selected;
    selected = null;
    root.classList.remove("has-sel");
    for (const b of nodeEls.values()) { b.classList.remove("sel", "dep", "unl"); b.setAttribute("aria-pressed", "false"); }
    for (const p of edgeEls) { p.classList.remove("dep", "unl"); edgesG.append(p); }
    for (const r of $$(".rm-row.landed")) r.classList.remove("landed");
    panel.hidden = true;
    panel.replaceChildren();
    if (was) { try { history.replaceState(null, "", location.pathname); } catch (e) { /* fine */ } }
    if (returnFocus && was && nodeEls.get(was)) nodeEls.get(was).focus();
    schedule();
  }

  canvas.addEventListener("click", (e) => {
    const n = e.target.closest(".rm-node");
    if (n) { select(n.dataset.id, { focusPanel: e.detail === 0 }); return; }
    const c = e.target.closest(".rm-cat");
    if (c) zoomToCategory(c.dataset.cat);
  });
  panel.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    // The panel is drawn again for the new pick, so focus moves to its heading.
    if (go) { select(go.dataset.go, { focusPanel: true }); return; }
    if (e.target.closest("[data-close]")) { deselect(true); return; }
    const copy = e.target.closest("[data-copy]");
    if (copy && selected) {
      const url = `${DATA.base}#${selected}`;
      const done = () => { const ok = $("[data-copied]", panel); if (ok) ok.hidden = false; };
      const fallback = () => {
        const input = document.createElement("input");
        input.readOnly = true;
        input.value = url;
        input.className = "rm-url";
        input.setAttribute("aria-label", "Link to this item");
        copy.replaceWith(input);
        input.select();
      };
      try { navigator.clipboard.writeText(url).then(done, fallback); } catch (err) { fallback(); }
    }
  });
  // Escape puts the pick down from anywhere on the page, not only from inside the map.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !selected || root.closest("[hidden]")) return;
    if (document.activeElement && document.activeElement.id === "q") return;
    e.preventDefault();
    deselect(true);
  });

  // ---------------------------------------------------------------- moving the map
  const pointers = new Map();
  let drag = null, pinch = null, moved = false;
  const rectOf = () => canvas.getBoundingClientRect();
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; moved = false; }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const r = rectOf();
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, k: view.k, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top, vx: view.x, vy: view.y };
      moved = true;
      for (const id of pointers.keys()) { try { canvas.setPointerCapture(id); } catch (err) { /* fine */ } }
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const r = rectOf();
      const k = clamp((pinch.k * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d, kMin(), kMax());
      const wx = (pinch.mx - pinch.vx) / pinch.k, wy = (pinch.my - pinch.vy) / pinch.k;
      view = { k, x: (a.x + b.x) / 2 - r.left - wx * k, y: (a.y + b.y) / 2 - r.top - wy * k };
      clampView();
      schedule();
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!moved) { moved = true; canvas.classList.add("dragging"); try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } }
    view = { k: view.k, x: drag.vx + dx, y: drag.vy + dy };
    clampView();
    schedule();
  });
  const end = (e) => {
    const wasDrag = moved;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 1) {
      const p = [...pointers.values()][0];
      drag = { x: p.x, y: p.y, vx: view.x, vy: view.y };
      return;
    }
    if (pointers.size === 0) {
      canvas.classList.remove("dragging");
      if (e.type === "pointerup" && !wasDrag && !e.target.closest("button") && selected) deselect();
      drag = null;
    }
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  // A drag that ends on a node does not also pick it.
  canvas.addEventListener("click", (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  let hintTimer = 0;
  canvas.addEventListener("wheel", (e) => {
    if (!(e.ctrlKey || e.metaKey)) {
      hintEl.hidden = false;
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => { hintEl.hidden = true; }, 1600);
      return;
    }
    e.preventDefault();
    const r = rectOf();
    zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  if (/Mac|iPhone|iPad/.test(navigator.platform || "")) hintEl.textContent = "Pinch, or hold ⌘ and scroll, to zoom";

  canvas.addEventListener("keydown", (e) => {
    if (e.target !== canvas) return;
    const step = 60;
    let used = true;
    switch (e.key) {
      case "ArrowLeft": view.x += step; break;
      case "ArrowRight": view.x -= step; break;
      case "ArrowUp": view.y += step; break;
      case "ArrowDown": view.y -= step; break;
      case "+": case "=": zoomAt(1.25, W / 2, H / 2); break;
      case "-": case "_": zoomAt(0.8, W / 2, H / 2); break;
      case "0": animateTo(fitView()); break;
      default: used = false;
    }
    if (used) { e.preventDefault(); clampView(); schedule(); }
  });
  zoomBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-zoom]");
    if (!b) return;
    if (b.dataset.zoom === "fit") animateTo(fitView());
    else {
      const k = clamp(view.k * (b.dataset.zoom === "in" ? 1.4 : 1 / 1.4), kMin(), kMax());
      const s = k / view.k;
      animateTo({ k, x: W / 2 - (W / 2 - view.x) * s, y: H / 2 - (H / 2 - view.y) * s });
    }
  });

  // ---------------------------------------------------------------- filters, search, list
  const state = { status: new Set(STATUS), cat: new Set(CATS), q: "" };
  const rows = new Map($$(".rm-row").map((r) => [r.dataset.id, r]));
  const groups = $$(".rm-group");
  const qInput = $("#rm-q");
  const countEl = $("[data-count]");
  const resetBtn = $("[data-reset]");
  const emptyEl = $("[data-empty]");
  const visible = (it) => state.status.has(it.status) && state.cat.has(it.category);
  const matches = (it) => {
    if (!state.q) return true;
    const hay = `${it.title} ${it.redacted ? "" : it.summary} ${CLABEL[it.category]} ${SLABEL[it.status]}`.toLowerCase();
    return state.q.split(/\s+/).every((w) => hay.includes(w));
  };
  function applyFilters() {
    let shown = 0, hits = 0;
    for (const it of items) {
      const v = visible(it), m = matches(it);
      if (v) shown++;
      if (v && m) hits++;
      const b = nodeEls.get(it.id);
      if (b) { b.hidden = !v; b.classList.toggle("qdim", Boolean(state.q) && !m); b.classList.toggle("qhit", Boolean(state.q) && m); }
      const row = rows.get(it.id);
      if (row) row.hidden = !(v && m);
    }
    for (const p of edgeEls) p.classList.toggle("off", !(visible(byId.get(p.dataset.from)) && visible(byId.get(p.dataset.to))));
    for (const g of groups) g.hidden = !$$(".rm-row", g).some((r) => !r.hidden);
    emptyEl.hidden = hits > 0;
    const filtered = state.status.size < STATUS.length || state.cat.size < CATS.length;
    countEl.textContent = state.q ? `${hits} of ${items.length} match` : filtered ? `Showing ${shown} of ${items.length}` : `All ${items.length} things`;
    resetBtn.hidden = !(state.q || filtered);
    if (selected && !visible(byId.get(selected))) deselect();
    schedule();
  }
  root.addEventListener("click", (e) => {
    const f = e.target.closest(".fchip");
    if (!f) return;
    const set = f.dataset.f === "status" ? state.status : state.cat;
    if (set.has(f.dataset.v)) set.delete(f.dataset.v); else set.add(f.dataset.v);
    f.setAttribute("aria-pressed", String(set.has(f.dataset.v)));
    applyFilters();
  });
  qInput.addEventListener("input", () => { state.q = qInput.value.trim().toLowerCase(); applyFilters(); });
  resetBtn.addEventListener("click", () => {
    state.status = new Set(STATUS);
    state.cat = new Set(CATS);
    state.q = "";
    qInput.value = "";
    for (const f of $$(".fchip")) f.setAttribute("aria-pressed", "true");
    applyFilters();
  });

  function setView(v, save = true) {
    document.documentElement.setAttribute("data-rm-view", v);
    for (const b of $$("[data-view]")) b.setAttribute("aria-pressed", String(b.dataset.view === v));
    if (save) store.set("prc.rm.view", v);
    if (v === "map") ensureMap();
    else if (selected && rows.get(selected)) rows.get(selected).scrollIntoView({ block: "nearest" });
  }
  root.addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) setView(b.dataset.view); });

  function ensureMap() {
    if (document.documentElement.getAttribute("data-rm-view") !== "map" || root.closest("[hidden]")) return;
    if (!canvas.clientWidth) return;
    if (!drawn) {
      draw();
      resize();
      view = fitView();
      applyFilters();
      if (selected) select(selected);
    } else {
      resize();
    }
    schedule();
  }
  // A box that changes shape a lot (a phone turned sideways) gets the map drawn again to fit it.
  function rebuild() {
    nodeEls.clear();
    edgeEls.length = 0;
    ringLbls.length = 0;
    catBtns.length = 0;
    drawn = false;
    draw();
    resize();
    view = fitView();
    applyFilters();
    if (selected) select(selected, { centre: false });
  }
  new ResizeObserver(() => {
    if (!drawn) { ensureMap(); return; }
    if (!canvas.clientWidth) return;
    const aspect = Math.min(1.5, Math.max(1, canvas.clientWidth / Math.max(1, canvas.clientHeight)));
    if (Math.abs(aspect - A) > 0.15) { rebuild(); return; }
    const before = fitK;
    resize();
    if (Math.abs(view.k - before) < 1e-6) view = fitView();
    schedule();
  }).observe(canvas);
  wide.addEventListener("change", () => schedule());

  // ---------------------------------------------------------------- arriving
  setView(document.documentElement.getAttribute("data-rm-view") || "map", false);
  // /roadmap/#floor-2 picks that item, on arrival and whenever the address changes.
  function arrive() {
    ensureMap();
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && byId.has(id)) {
      select(id);
      if (document.documentElement.getAttribute("data-rm-view") === "map") stage.scrollIntoView({ block: "nearest" });
    } else if (!id && selected) {
      deselect();
    }
  }
  window.addEventListener("hashchange", arrive);
  arrive();
})();
