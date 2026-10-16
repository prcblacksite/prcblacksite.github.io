import { P, type Data, esc, inline } from "../lib/site";

export function render(): string {
  const cards = (P.clocks as Data[]).map((c) => `<div class="card"><p class="k">${esc(c.length)}</p><p class="t">${esc(c.name)}</p><p class="d">${inline(c.moved_by)}</p><p class="feel">“${esc(c.feels)}”</p></div>`);
  return `<div class="grid three">${cards.join("")}</div>`;
}
