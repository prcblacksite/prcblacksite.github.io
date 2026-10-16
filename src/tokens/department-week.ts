import { P, type Data, esc, inline, table } from "../lib/site";

export const render = (): string =>
  table(
    ["Department", "Tonight", "This month", "For good"],
    (P.department_week as Data[]).map((d) => [esc(d.dept), inline(d.tonight), inline(d.month), inline(d.for_good)]),
    "What each department is doing",
  );
