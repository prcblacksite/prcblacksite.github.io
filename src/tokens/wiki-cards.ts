import { NAV, esc } from "../lib/site";

export function render(): string {
  return NAV.map(([g, label, pages]) => {
    const wiki = pages.filter((p) => p.slug.startsWith("/wiki/") && p.slug !== "/wiki/");
    if (!wiki.length) return "";
    const cards = wiki.map((p) => `<a class="card" href="${p.slug}"><p class="t">${esc(p.title)}</p><p class="d">${esc(p.description)}</p></a>`).join("");
    return `<h2 id="${g}">${esc(label)}</h2><div class="grid three">${cards}</div>`;
  }).join("");
}
