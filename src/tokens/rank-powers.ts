import { DEPT_NAME, P, type Data, esc, inline, slugify, table } from "../lib/site";

export function render(): string {
  return Object.entries(P.rank_powers as Record<string, Data[]>)
    .map(
      ([key, rows]) =>
        `<h3 id="powers-${slugify(key)}">${esc(DEPT_NAME[key])}</h3>` +
        table(["Title", "What it lets you do"], rows.map((r) => [esc(r.title), inline(r.can)]), `What a rank lets you do in ${DEPT_NAME[key]}`),
    )
    .join("");
}
