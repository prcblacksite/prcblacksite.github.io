import { P, type Data, esc, inline } from "../lib/site";

export function render(): string {
  const secs = (P.channel_groups as Data[]).map((g) => {
    const dl = (g.channels as Data[]).map((c) => `<dt>${esc(c.name)}</dt><dd>${inline(c.text)}</dd>`).join("");
    return `<section><h3>${esc(g.group)}</h3><dl>${dl}</dl></section>`;
  });
  return `<div class="chan">${secs.join("")}</div>`;
}
