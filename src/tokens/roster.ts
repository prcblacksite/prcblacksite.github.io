import { P, type Data, esc, inline, table } from "../lib/site";

export const render = (): string =>
  table(["Role", "Held by", "The job"], (P.duty_roster as Data[]).map((r) => [esc(r.role), inline(r.held_by), inline(r.job)]), "Duty roster");
