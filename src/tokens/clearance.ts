import { P, type Data, esc, inline, table } from "../lib/site";

export function render(): string {
  const rows = (P.clearance as Data[]).map((c) => [`<span class="mono">${esc(c.level)}</span>`, inline(c.opens), inline(c.who)]);
  return table(["Level", "Opens", "Who has it"], rows, "Clearance levels");
}
