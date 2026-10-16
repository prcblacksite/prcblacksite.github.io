import { P, RM, SVG_SEARCH, type Data, chip, esc, inline } from "../lib/site";

export function render(): string {
  const items = RM.items as Data[];
  const STATUS: Record<string, Data> = Object.fromEntries((RM.statuses as Data[]).map((s) => [s.key, s]));
  const CAT: Record<string, Data> = Object.fromEntries((RM.categories as Data[]).map((c) => [c.key, c]));
  const title: Record<string, string> = Object.fromEntries(items.map((i) => [i.id, i.title]));
  const unlocks: Record<string, string[]> = Object.fromEntries(items.map((i) => [i.id, [] as string[]]));
  for (const i of items) for (const d of i.waits_on ?? []) unlocks[d]!.push(i.id);
  const count = (pred: (i: Data) => boolean) => items.filter(pred).length;
  const sfil = Object.entries(STATUS)
    .map(([k, s]) => `<button type="button" class="fchip" data-f="status" data-v="${k}" aria-pressed="true"><i data-s="${k}"></i>${esc(s.label)}<span>${count((i) => i.status === k)}</span></button>`)
    .join("");
  const cfil = Object.entries(CAT)
    .map(([k, c]) => `<button type="button" class="fchip" data-f="cat" data-v="${k}" aria-pressed="true">${esc(c.label)}<span>${count((i) => i.category === k)}</span></button>`)
    .join("");
  const go = (id: string) => `<a href="#${id}" data-go="${id}">${esc(title[id])}</a>`;
  const groups = Object.entries(STATUS).map(([k, s]) => {
    const rows = items
      .filter((i) => i.status === k)
      .map((i) => {
        const deps: string[] = i.waits_on ?? [];
        const unl = unlocks[i.id]!;
        const summ = i.redacted
          ? '<p class="d redacted"><span class="bar"></span><span class="bar short"></span><span class="sr-only">Classified.</span></p><p class="note">Classified. It is on this map because it exists.</p>'
          : `<p class="d">${inline(i.summary)}</p>`;
        const q = `${i.title} ${i.summary ?? ""} ${CAT[i.category]!.label} ${s.label}`.toLowerCase();
        // Each item's title is an h3 with its id, so search finds it on its own and /roadmap/#id lands on it.
        return (
          `<li class="rm-row" data-id="${i.id}" data-s="${k}" data-c="${i.category}" data-q="${esc(q)}"${i.redacted ? " data-redacted" : ""}>` +
          `<h3 class="t" id="${i.id}">${esc(i.title)}</h3>${summ}` +
          `<p class="meta"><span class="cat">${esc(CAT[i.category]!.label)}</span> · Waits on ${deps.map(go).join(", ") || "nothing"}${unl.length ? ` · Unlocks ${unl.map(go).join(", ")}` : ""}</p></li>`
        );
      })
      .join("");
    return `<section class="rm-group" data-s="${k}" aria-labelledby="status-${k}"><h2 id="status-${k}">${chip(k, s.label)}<span class="m">${esc(s.meaning)}</span><span class="n">${count((i) => i.status === k)}</span></h2><ul class="rm-rows">${rows}</ul></section>`;
  });
  const skeleton = [80, 160, 240, 320, 400].map((r) => `<circle r="${r}"/>`).join("");
  const data = {
    base: P.links.roadmap,
    seal: "/seals/seal-prc.svg",
    statuses: RM.statuses,
    categories: RM.categories,
    items: items.map((i) => ({ id: i.id, title: i.title, category: i.category, status: i.status, summary: i.redacted ? "" : (i.summary ?? null), redacted: i.redacted ?? null, waits_on: i.waits_on ?? [] })),
  };
  return `<script>(function(){var v=null;try{v=localStorage.getItem("prc.rm.view")}catch(e){}document.documentElement.setAttribute("data-rm-view",v==="map"||v==="list"?v:(innerWidth<720?"list":"map"))})()</script>
<script type="application/json" id="roadmap-data">${JSON.stringify(data).replace(/<\//g, "<\\/")}</script>
<div class="rm" data-roadmap>
<div class="rm-bar">
<div class="seg" role="group" aria-label="Show the roadmap as"><button type="button" data-view="map" aria-pressed="true">Map</button><button type="button" data-view="list" aria-pressed="false">List</button></div>
<label class="rm-search" for="rm-q">${SVG_SEARCH}<span class="sr-only">Find on the roadmap</span><input id="rm-q" type="search" placeholder="Find on the roadmap" autocomplete="off" spellcheck="false"></label>
<p class="rm-count" aria-live="polite" data-count>All ${items.length} things</p>
<button type="button" class="btn small rm-reset" data-reset hidden>Show everything</button>
</div>
<div class="rm-filters"><div role="group" aria-label="Status">${sfil}</div><div role="group" aria-label="Category">${cfil}</div></div>
<div class="rm-stage" data-panel="map">
<div class="rm-canvas" tabindex="0" aria-label="The roadmap map. Drag to move, use the buttons or Ctrl and scroll to zoom." data-canvas>
<div class="rm-skeleton" aria-hidden="true"><svg viewBox="-420 -420 840 840">${skeleton}</svg><p>Drawing the map</p></div>
</div>
<div class="rm-zoom" role="group" aria-label="Zoom">
<button type="button" data-zoom="in" aria-label="Zoom in"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
<button type="button" data-zoom="out" aria-label="Zoom out"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
<button type="button" data-zoom="fit" aria-label="Show the whole map"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
</div>
<p class="rm-hint" data-hint hidden>Hold Ctrl and scroll to zoom</p>
<aside class="rm-panel" data-detail hidden aria-labelledby="rm-detail-t"></aside>
</div>
<p class="caption rm-help" data-panel="map">The closer to the centre, the sooner. Lines join what waits on what. Pick anything to see both ends.</p>
<div class="rm-list" data-panel="list">${groups.join("")}<p class="empty" data-empty hidden>Nothing matches. Try fewer words, or show everything.</p></div>
</div>`;
}
