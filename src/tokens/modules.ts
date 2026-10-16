import { P, type Data, esc, table } from "../lib/site";

export function render(): string {
  const t = P.titles["E&T"];
  const rows = (P.modules as Data[]).map((m) => [esc(m.name), `<span class="mono">${m.cost}</span>`, `${esc(m.restricted ? t.G2 : t.G1)} and up`]);
  return table(["Module", "Budget", "Who can place it"], rows, "Modules at launch");
}
