import { P, type Data, esc, inline } from "../lib/site";

export function render(): string {
  const items: Data[] = P.loop;
  const lis = items.map((x, i) => `<li${i === items.length - 1 ? ' class="last"' : ""}><p class="k">${i + 1} · ${esc(x.label)}</p><p class="v">${inline(x.text)}</p></li>`);
  return `<ol class="loop" aria-label="The loop, in ${items.length} steps">${lis.join("")}</ol>`;
}
