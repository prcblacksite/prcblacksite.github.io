import { P, type Data, esc, inline, table } from "../lib/site";

export const render = (): string =>
  table(["If you", "What happens"], (P.camp.consequences as Data[]).map((c) => [esc(c.infraction), inline(c.result)]), "Consequences inside the fiction");
