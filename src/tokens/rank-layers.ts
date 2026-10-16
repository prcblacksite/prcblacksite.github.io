import { P, type Data, esc, inline } from "../lib/site";

export function render(): string {
  const cards = (P.rank_layers as Data[]).map((x, i) => `<div class="card"><p class="k">${i + 1} · ${esc(x.layer)}</p><p class="t">${esc(x.example)}</p><p class="d">${inline(x.text)}</p></div>`);
  return `<div class="grid three">${cards.join("")}</div>`;
}
