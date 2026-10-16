import { P, SVG_SEARCH, type Data, esc, inline, slugify } from "../lib/site";

// Each word is an h3 with an id, so search finds it on its own and a link lands on its row.
export function render(): string {
  const words = P.glossary as Data[];
  const lis = words
    .map((g) => `<li data-q="${esc(`${g.term} ${g.means}`.toLowerCase())}"><h3 class="t" id="g-${slugify(g.term)}">${esc(g.term)}</h3><span class="m">${inline(g.means)}</span></li>`)
    .join("");
  return (
    `<div class="gloss-wrap" data-gloss><label class="gloss-search" for="gq">${SVG_SEARCH}<span class="sr-only">Filter the glossary</span>` +
    `<input id="gq" type="search" placeholder="Filter ${words.length} words" autocomplete="off" spellcheck="false"></label>` +
    `<ul class="gloss">${lis}</ul><p class="empty" hidden>Nothing matches. Ask in <code>#faq-desk</code>, or run <code>/whatis</code> in the server.</p></div>`
  );
}
