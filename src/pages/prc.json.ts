// /prc.json: the public facts the bot reads once a day for /whatis and /catchup. The glossary,
// links, week, playtests and chapters from prc.yaml, and nothing else.
import { P } from "../lib/site";

export function GET(): Response {
  const { glossary, links, week, playtests } = P;
  return new Response(JSON.stringify({ glossary, links, week, playtests, chapters: P.chapters ?? [] }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
