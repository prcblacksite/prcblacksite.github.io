import { P, type Data, esc, fmtDate, inline } from "../lib/site";

export function render(): string {
  const ch = (P.chapters ?? []) as Data[];
  if (!ch.length) {
    return (
      `<div class="empty-state"><p class="t">No chapters yet</p>` +
      `<p>The first one opens with the doors on ${esc(fmtDate(P.meta.doors))}. Its recap goes up here, and in <code>#story-so-far</code>, within 48 hours.</p>` +
      `<p>Each recap covers what happened, what changed on the site, what people found, and what is still open. Until the first one, the premise is on <a href="/wiki/what/">What PRC is</a>.</p></div>`
    );
  }
  const parts: [string, string][] = [["happened", "What happened"], ["changed", "What changed on the site"], ["found", "What people found"], ["still_open", "What's still open"]];
  return ch
    .map((c) => `<section class="chapter"><h2 id="chapter-${c.n}">Chapter ${c.n}: ${esc(c.title)}</h2>${parts.map(([k, t]) => `<h3>${t}</h3><p>${inline(c[k])}</p>`).join("")}</section>`)
    .join("");
}
