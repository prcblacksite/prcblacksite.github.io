import { P, esc, seal } from "../lib/site";

export function render(): string {
  const m = P.meta;
  const i = m.headline.lastIndexOf(" ");
  const [head, last] = [m.headline.slice(0, i), m.headline.slice(i + 1)];
  return `<section class="hero" aria-labelledby="h-home">
<div class="hero-text">
<p class="eyebrow">${seal("prc-icon")}${esc(m.name)}</p>
<h1 id="h-home" tabindex="-1">${esc(head)} <em>${esc(last)}</em></h1>
<p class="lead">${esc(m.hero_line)}</p>
<div class="actions"><a class="btn primary" href="/orientation/">Start tonight</a><a class="btn" href="${esc(P.links.discord)}">Join the Discord</a></div>
</div>
<img class="art" src="/art/hero-art.svg" width="1200" height="360" alt="The island at night: a lit adit at the foot of the mountain, the pier lamps, and a light turning on the tower.">
</section>`;
}
