// Everything the pages and the data tokens share: the facts from prc.yaml and roadmap.yaml, every
// page's frontmatter, the menu, and the small HTML helpers. Read once, at build time, from plain
// files, so the Markdown plugin (which runs outside Vite) and the Astro pages see the same data.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import MarkdownIt from "markdown-it";
import { parse } from "yaml";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Data = Record<string, any>;
export const P: Data = parse(read("src/data/prc.yaml"));
export const RM: Data = parse(read("src/data/roadmap.yaml"));
export const ICONS: Record<string, string> = JSON.parse(read("src/data/icons.json"));

// The build date, in UTC. Past playtests drop off at build, and the script hides any that pass later.
export const TODAY = new Date().toISOString().slice(0, 10);
export const YEAR = TODAY.slice(0, 4);

export const GROUPS: [string, string][] = [
  ["start", "Start here"],
  ["game", "The game"],
  ["ranks", "Departments and ranks"],
  ["world", "The world"],
  ["next", "What's next"],
  ["community", "Community"],
];
export const GROUP_LABEL: Record<string, string> = Object.fromEntries(GROUPS);
export const EXTERNAL: Record<string, [string, string][]> = {
  community: [
    ["Discord", P.links.discord],
    ["Roblox community", P.links.roblox_group],
  ],
};
const NAV_LABEL: Record<string, string> = { "/": "Home", "/wiki/": "All wiki pages" };

// ------------------------------------------------------------------ pages
export interface Page {
  title: string;
  description: string;
  slug: string;
  group?: string;
  order: number;
  toc?: boolean;
  layout?: "home" | "page" | "wide" | "plain";
  nav: string;
  body: string;
  file: string;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".md") ? [join(dir, e.name)] : []));
}

export const PAGES: Page[] = walk(join(ROOT, "src/content/pages"))
  .sort()
  .map((path) => {
    const [, fm = "", body = ""] = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(readFileSync(path, "utf8")) ?? [];
    const data = parse(fm) as Omit<Page, "nav" | "body" | "file">;
    return {
      ...data,
      group: data.group ?? (data.slug === "/" ? "start" : undefined),
      order: data.order ?? (data.slug === "/" ? 1 : 99),
      nav: NAV_LABEL[data.slug] ?? data.title,
      body,
      file: relative(join(ROOT, "src/content/pages"), path).replaceAll("\\", "/"),
    };
  });
export const BY_SLUG: Record<string, Page> = Object.fromEntries(PAGES.map((p) => [p.slug, p]));
export const NAV: [string, string, Page[]][] = GROUPS.map(([g, label]) => [g, label, PAGES.filter((p) => p.group === g).sort((a, b) => a.order - b.order)]);
// Menu order, for previous and next.
export const READING: Page[] = NAV.flatMap(([, , pages]) => pages);

// ------------------------------------------------------------------ helpers
export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c] ?? c);

const MD = new MarkdownIt("commonmark", { html: true, typographer: false }).enable("table");
const CMDS = [...new Set([...P.bot.public_commands.map((c: Data) => String(c.cmd).replace(/^\//, "")), "recap"])].sort((a, b) => b.length - a.length);
const RE_CMD = new RegExp(`(?<![\\w/\`])/(${CMDS.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "g");
const RE_CHAN = /(?<![\w`&#])#([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g;
export const REDACT = '<span class="redact" role="img" aria-label="redacted"></span>';

// Channel names and commands in yaml text become code spans, as they are in the pages.
export function autocode(s: string): string {
  return s
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(RE_CHAN, "`#$1`").replace(RE_CMD, "`/$1`")))
    .join("");
}

export const inline = (s: unknown) => MD.renderInline(autocode(String(s ?? ""))).replaceAll("███", REDACT);
export const markdown = (s: string) => MD.render(s);

export function slugify(s: string): string {
  const text = s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").toLowerCase().replace(/&/g, " and ");
  return text.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
}

export function table(head: string[], rows: string[][], label: string, cls = ""): string {
  const th = head.map((h) => `<th scope="col">${h}</th>`).join("");
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
  return `<div class="tw${cls ? ` ${cls}` : ""}" role="region" aria-label="${esc(label)}" tabindex="0"><table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export const chip = (status: string, label: string) => `<span class="chip" data-s="${esc(status)}">${esc(label)}</span>`;

export function seal(code: string, label?: string): string {
  return label
    ? `<span class="seal seal-${code.toLowerCase()}" role="img" aria-label="${esc(label)}"></span>`
    : `<span class="seal seal-${code.toLowerCase()}" aria-hidden="true"></span>`;
}

export const icon = (name: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[name]}"/></svg>`;

export const SVG_EXT =
  '<svg class="ext" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const SVG_CHEVRON =
  '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const SVG_SEARCH =
  '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
export const SVG_MENU =
  '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const at = (day: string) => new Date(`${String(day).slice(0, 10)}T12:00:00Z`);

// "Saturday 31 October 2026", or "31 October 2026" without the weekday.
export function fmtDate(day: string, weekday = true): string {
  const d = at(day);
  return `${weekday ? `${DAYS[d.getUTCDay()]} ` : ""}${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "Sat 17 Oct"
export function shortDate(day: string): string {
  const d = at(day);
  return `${DAYS[d.getUTCDay()]!.slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]!.slice(0, 3)}`;
}

export const opsTime = (day = "Wednesday"): string => P.week.find((w: Data) => w.day === day).time;
export const BRANCH: Record<string, Data> = Object.fromEntries(P.branches.map((b: Data) => [b.code, b]));
export const DEPT_NAME: Record<string, string> = { SEC: "Security Division", "E&T": "Engineering & Technical", LOG: "Logistics", ADM: "Administrative Branch", MVF: "Mobile Vanguard Force" };
export const upcomingPlaytests = (): Data[] => P.playtests.filter((p: Data) => String(p.date) >= TODAY);

export function countdownText(doorsAt: string, now: Date): [string, string] {
  const secs = (Date.parse(doorsAt) - now.getTime()) / 1000;
  if (secs <= 0) return ["Open", "The doors are open."];
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  if (days >= 2) return [`${days} days`, `and ${hours} hours`];
  if (days === 1) return ["1 day", `and ${hours} hours`];
  return [`${hours} hours`, ""];
}

// The words a reader meets on a page, components included, as the prototype counted them.
export function textOf(fragment: string): string {
  return fragment
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<(svg|title|desc)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
