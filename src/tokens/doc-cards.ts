import { BY_SLUG, P, PAGES, RM, esc } from "../lib/site";
import { minutesOf } from "./index";

export function render(): string {
  const wikiPages = PAGES.filter((p) => p.slug.startsWith("/wiki/") && p.slug !== "/wiki/");
  const chapters = P.chapters ?? [];
  const facts: [string, string][] = [
    ["/orientation/", `${minutesOf(BY_SLUG["/orientation/"]!)} minute read`],
    ["/wiki/", `${wikiPages.length} pages`],
    ["/roadmap/", `${RM.items.length} things, no dates`],
    ["/story/", chapters.length ? `${chapters.length} chapters` : "Starts with the doors"],
  ];
  const cards = facts.map(([slug, k]) => {
    const p = BY_SLUG[slug]!;
    return `<a class="card" href="${slug}"><p class="k">${esc(k)}</p><p class="t">${esc(p.title)}</p><p class="d">${esc(p.description)}</p><p class="go">Open</p></a>`;
  });
  return `<div class="grid four">${cards.join("")}</div>`;
}
