import { P, type Data, esc, inline, table } from "../lib/site";

export const render = (): string =>
  table(["Step", "Gate", "What it asks for"], (P.promotion.gates as Data[]).map((g) => [`<span class="mono">${esc(g.step)}</span>`, esc(g.gate), inline(g.proves)]), "What each step asks for");
