import { P, esc, inline, table } from "../lib/site";

export function render(): string {
  const c = P.currencies;
  const keys: [string, string][] = [["belongs_to", "Belongs to"], ["earned_by", "Earned by"], ["spent_on", "Spent on"], ["spent_by", "Spent by"]];
  const rows = keys.map(([k, label]) => [esc(label), inline(c.credits[k]), inline(c.budget[k])]);
  return table(["", "Credits", "Budget"], rows, "The two currencies", "kv") + `<blockquote><p><strong>${esc(c.rule)}</strong></p></blockquote>`;
}
