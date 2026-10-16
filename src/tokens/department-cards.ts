import { P, type Data, esc, seal } from "../lib/site";

export function render(): string {
  const cards = (P.branches as Data[])
    .filter((b) => b.joinable !== "never")
    .map(
      (b) =>
        `<a class="card dept" href="/wiki/departments/#${b.code.toLowerCase()}">${seal(b.code)}` +
        `<p class="k">${esc(b.code)}</p><p class="t">${esc(b.name)}</p><p class="d">${esc(b.short)}</p>` +
        `<p class="how"><span>Way in</span>${esc(b.way_in_short)}</p></a>`,
    );
  return `<div class="grid five">${cards.join("")}</div>`;
}
