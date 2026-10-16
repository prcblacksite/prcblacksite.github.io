import { P, type Data, esc, table } from "../lib/site";

export function render(): string {
  const cols = ["ADM", "E&T", "LOG", "SEC", "MVF"];
  const rows = Object.entries(P.grades as Record<string, Data>).map(([g, v]) => [`<span class="mono">${g}</span>`, esc(v.band), ...cols.map((c) => esc(P.titles[c][g] ?? ""))]);
  return table(["Grade", "Band", ...cols.map(esc)], rows, "Every title");
}
