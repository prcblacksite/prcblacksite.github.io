import { P, type Data, esc, inline, table } from "../lib/site";

export const render = (): string =>
  table(["Op", "What happens"], (P.saturday_rotation as Data[]).map((r) => [esc(r.name), inline(r.about)]), "The Saturday rotation");
