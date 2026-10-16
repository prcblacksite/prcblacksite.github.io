import { P, type Data, esc, inline } from "../lib/site";

export function render(): string {
  const w = P.works_example;
  const rows = (w.rows as Data[]).map((r) => `<div><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd><dd class="chg" data-tone="${esc(r.tone)}">${esc(r.change)}</dd></div>`).join("");
  return (
    `<div class="works" role="group" aria-label="An example of the morning works post">` +
    `<div class="works-top"><span class="pct">${w.bar}%</span><div class="meter" role="progressbar" aria-label="The works bar, example" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${w.bar}"><span style="width:${w.bar}%"></span></div><span class="delta">${esc(w.delta)}</span></div>` +
    `<dl class="works-rows">${rows}</dl></div><p class="caption">${inline(w.note)}</p>`
  );
}
