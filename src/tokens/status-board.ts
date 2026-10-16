import { P, chip, countdownText, esc, fmtDate, inline, opsTime, shortDate, upcomingPlaytests } from "../lib/site";

export function render(): string {
  const m = P.meta;
  const [big, rest] = countdownText(m.doors_at, new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`));
  const tests = upcomingPlaytests().filter((p) => !String(p.label).toLowerCase().includes("doors"));
  const next = tests[0];
  const hm = opsTime();
  let nextCell = '<p class="k">Next playtest</p><p class="big">None left</p><p class="d">The doors are next.</p>';
  if (next) {
    let label = String(next.label).split(": ").slice(1).join(": ") || String(next.label);
    label = label[0]!.toUpperCase() + label.slice(1);
    const iso = `${String(next.date)}T${hm}:00Z`;
    nextCell = `<p class="k">Next playtest</p><p class="big" data-next-test>${esc(shortDate(next.date))}</p><p class="d">${inline(label)} · <time datetime="${iso}" data-utc="${iso}">${hm} UTC</time></p>`;
  }
  const doorsTime = m.doors_at.slice(11, 16);
  return `<section class="board" aria-labelledby="board-h" data-board data-feed="${esc(P.links.works_feed)}">
<div class="board-head"><h2 id="board-h">Where things stand</h2>${chip("building", "Before the doors")}</div>
<div class="board-grid">
<div class="cell"><p class="k">The doors open in</p><p class="big" data-countdown="${esc(m.doors_at)}">${big}</p><p class="d"><span data-countdown-rest>${esc(rest)}</span> · ${esc(fmtDate(m.doors))}, <time datetime="${esc(m.doors_at)}" data-utc="${esc(m.doors_at)}">${doorsTime} UTC</time></p></div>
<div class="cell">${nextCell}</div>
<div class="cell"><p class="k">The works bar</p><p class="big" data-works-bar>0%</p><div class="meter" role="progressbar" aria-label="The works bar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span style="width:0%"></span></div><p class="d" data-works-note>It starts moving when the doors open. Every module placed moves it.</p></div>
</div>
<p class="board-foot"><a href="/roadmap/">What waits on what: the roadmap</a></p>
</section>`;
}
