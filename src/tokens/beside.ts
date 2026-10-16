import { P, type Data, esc, inline, table } from "../lib/site";

export const render = (): string =>
  table(["Name", "What it is"], (P.beside_the_ladder as Data[]).map((b) => [esc(b.name), inline(b.text)]), "Beside the ladder");
