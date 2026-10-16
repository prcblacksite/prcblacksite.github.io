import { P, type Data, esc, inline } from "../lib/site";

export function render(): string {
  const cards = (P.not_branches as Data[]).map((x) => `<div class="card"><p class="t">${esc(x.name)}</p><p class="d">${inline(x.text)}</p></div>`);
  return `<div class="grid three">${cards.join("")}</div>`;
}
