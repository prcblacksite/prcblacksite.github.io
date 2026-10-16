import { P, type Data, chip, esc, inline, table } from "../lib/site";

export const render = (): string =>
  table(
    ["Command", "What it does"],
    (P.bot.public_commands as Data[]).map((c) => [`<code>${esc(c.cmd)}</code>`, inline(c.does) + (c.status === "planned" ? ` ${chip("next", "Planned")}` : "")]),
    "Commands anyone can use",
  );
