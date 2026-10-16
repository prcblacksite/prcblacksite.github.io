import { P, type Data, esc, inline, table } from "../lib/site";

export function render(): string {
  const rows = (P.camp.ladder as Data[]).map((r) => [`<span class="mono">${esc(r.rung)}</span> ${esc(r.title)}`, inline(r.how), inline(r.gets)]);
  return table(["Rung", "How you get there", "What you get"], rows, "The detainee ladder");
}
