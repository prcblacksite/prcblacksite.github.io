import { P, type Data, esc, inline, table } from "../lib/site";

export const render = (): string => table(["Role", "Pings you for"], (P.pings as Data[]).map((p) => [esc(p.name), inline(p.for)]), "Ping roles");
