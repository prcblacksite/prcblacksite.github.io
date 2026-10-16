import { P, type Data, esc, inline, table } from "../lib/site";

export function render(): string {
  const rows = Object.entries(P.grades as Record<string, Data>).map(([g, v]) => [
    `<span class="mono">${g}</span>`,
    esc(v.band),
    inline(v.meaning),
    esc(v.roughly),
    v.min_days ? `At least ${v.min_days} days` : "",
  ]);
  return table(["Grade", "Band", "What it means", "Roughly", "Time in grade"], rows, "Grades");
}
