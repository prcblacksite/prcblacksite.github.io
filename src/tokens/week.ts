import { P, type Data, esc, inline, table } from "../lib/site";

const DAYS: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };

export function render(): string {
  const rows = (P.week as Data[]).map((w) => {
    const when = w.time ? `<time data-weekday="${DAYS[w.day]}" data-hm="${esc(w.time)}">${esc(w.day)} ${esc(w.time)} UTC</time>` : esc(w.day);
    return [when, `<b>${esc(w.name)}</b> ${inline(w.about)}`, esc(w.length)];
  });
  return table(["When", "What", "How long"], rows, "The week");
}
