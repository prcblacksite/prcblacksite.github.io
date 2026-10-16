// npm run check:site, part one: every check in the build pack's CHECKLIST.md marked "auto" that
// reads files rather than clicking. Run after npm run build. Prints a pass and fail table.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const rows = [];
const check = (id, name, problems) => rows.push({ id, name, problems: [...new Set(problems)] });
const walk = (dir, ext) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name), ext) : ext.some((x) => e.name.endsWith(x)) ? [join(dir, e.name)] : []));
const rel = (f) => relative(root, f).replaceAll("\\", "/");
const read = (f) => readFileSync(f, "utf8");

if (!existsSync(join(dist, "index.html"))) {
  console.error("No dist/. Run npm run build first.");
  process.exit(1);
}
const pages = walk(dist, [".html"]).filter((f) => !f.includes(`${join("dist", "pagefind")}`));
const ownCss = ["src/styles/tokens.css", "src/styles/site.css", "src/styles/roadmap.css", "src/styles/seals.css"].map((f) => join(root, f));
const builtCss = walk(join(dist, "_astro"), [".css"]);
const tokens = read(join(root, "src/styles/tokens.css"));
const palette = new Set([...tokens.matchAll(/#([0-9A-Fa-f]{6})\b/g)].map((m) => m[1].toLowerCase()));

// V1: every colour in our CSS, the built CSS and the hero art is a token value.
{
  const problems = [];
  for (const f of [...ownCss, ...builtCss, join(root, "public/art/hero-art.svg"), join(root, "public/orientation.html"), join(root, "public/wiki.html")]) {
    for (const m of read(f).matchAll(/#([0-9A-Fa-f]{6})\b/g)) if (!palette.has(m[1].toLowerCase())) problems.push(`${rel(f)}: #${m[1]}`);
  }
  for (const f of ownCss.slice(1)) for (const m of read(f).matchAll(/rgba?\(([^)]*)\)/g)) problems.push(`${rel(f)}: a literal rgb(${m[1]})`);
  check("V1", "Colours only from tokens.css", problems);
}

// V8: font sizes and fonts only from the ramp.
{
  const problems = [];
  for (const f of ownCss.slice(1)) {
    const t = read(f);
    for (const m of t.matchAll(/font-size:\s*([^;]+);/g)) if (m[1].trim() !== "var(--code-size)") problems.push(`${rel(f)}: font-size ${m[1].trim()}`);
    for (const m of t.matchAll(/(?<![\w-])font:\s*([^;]+);/g)) if (!m[1].trim().startsWith("var(--t-")) problems.push(`${rel(f)}: font ${m[1].trim()}`);
    for (const m of t.matchAll(/font-weight:\s*([^;]+);/g)) if (!["400", "500", "600", "700"].includes(m[1].trim())) problems.push(`${rel(f)}: font-weight ${m[1].trim()}`);
  }
  check("V8", "Type only from the ramp", problems);
}

// S5: three radiuses in CSS; in SVG, rx is 4, 8 or a full pill.
{
  const problems = [];
  for (const f of ownCss.slice(1)) {
    for (const m of read(f).matchAll(/border-radius:\s*([^;]+);/g)) {
      if (!m[1].trim().split(/\s+/).every((p) => ["0", "var(--r-sm)", "var(--r-md)", "var(--r-full)"].includes(p))) problems.push(`${rel(f)}: ${m[1].trim()}`);
    }
  }
  for (const f of [join(dist, "index.html"), join(dist, "wiki/loop/index.html"), join(root, "public/art/hero-art.svg")]) {
    for (const tag of read(f).match(/<rect\b[^>]*>/g) ?? []) {
      const rx = Number(/\brx="([0-9.]+)"/.exec(tag)?.[1] ?? 0);
      const h = Number(/\bheight="([0-9.]+)"/.exec(tag)?.[1] ?? 0);
      if (rx && ![4, 8, 3.5, 7.5].includes(rx) && Math.abs(rx * 2 - h) > 1) problems.push(`${rel(f)}: rx ${rx}`);
    }
  }
  check("S5", "Only the three radiuses", problems);
}

// F5: one shadow, the overlay one.
{
  const problems = [];
  for (const f of ownCss.slice(1)) for (const m of read(f).matchAll(/box-shadow:\s*([^;]+);/g)) if (m[1].trim() !== "var(--shadow-overlay)") problems.push(`${rel(f)}: ${m[1].trim()}`);
  check("F5", "One shadow", problems);
}

// V3: nothing moves on hover; only the group focus (a :has( rule) may dim and blur its neighbours.
{
  const problems = [];
  for (const f of ownCss.slice(1)) {
    for (const m of read(f).matchAll(/([^{}]*:hover[^{]*)\{([^}]*)\}/g)) {
      if (/\btransform\s*:/.test(m[2]) || (/\bfilter\s*:/.test(m[2]) && !m[1].includes(":has("))) problems.push(`${rel(f)}: ${m[0].trim().slice(0, 60)}`);
    }
  }
  check("V3", "Hover is quiet", problems);
}

// House rule and V4: no em or en dash anywhere, and no emoji in the built pages.
{
  const problems = [];
  const dash = /[–—]/;
  const texts = [...walk(join(root, "src"), [".md", ".yaml", ".ts", ".astro", ".css", ".js", ".json"]), ...pages, join(dist, "prc.json")];
  for (const f of texts) if (dash.test(read(f))) problems.push(`${rel(f)}: a dash`);
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
  for (const f of pages) {
    const visible = read(f).replace(/<script[\s\S]*?<\/script>/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "");
    if (emoji.test(visible)) problems.push(`${rel(f)}: an emoji`);
  }
  check("V4", "No dashes, no emoji", problems);
}

// T1: title, description, canonical, Open Graph and Twitter image, favicons on every page.
{
  const problems = [];
  for (const f of pages) {
    const t = read(f);
    if (rel(f).endsWith("orientation.html") || rel(f).endsWith("wiki.html")) continue;
    const need = [/<title>[^<]+<\/title>/, /<meta name="description" content="[^"]+"/, /<link rel="canonical" href="https:\/\/prcblacksite\.github\.io\/[^"]*"/, /<meta property="og:image" content="[^"]+"/, /<meta name="twitter:card" content="summary_large_image"/, /<meta name="twitter:image" content="[^"]+"/, /<link rel="icon" href="\/favicon\.svg"/, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/];
    for (const re of need) if (!re.test(t)) problems.push(`${rel(f)}: missing ${re.source.slice(0, 40)}`);
    const og = /<meta property="og:image" content="https:\/\/prcblacksite\.github\.io(\/og\/[^"]+)"/.exec(t)?.[1];
    if (og && !existsSync(join(dist, og))) problems.push(`${rel(f)}: no file ${og}`);
  }
  for (const f of ["favicon.svg", "favicon-32.png", "apple-touch-icon.png", "prc.json"]) if (!existsSync(join(dist, f))) problems.push(`dist/${f} missing`);
  check("T1", "Meta, icons and Open Graph", problems);
}

// S3: each page's HTML and its CSS under 150 KB, before fonts and images.
{
  const problems = [];
  for (const f of pages) {
    const t = read(f);
    const css = [...t.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].reduce((s, m) => s + statSync(join(dist, m[1])).size, 0);
    const kb = (Buffer.byteLength(t) + css) / 1024;
    if (kb > 150) problems.push(`${rel(f)}: ${kb.toFixed(0)} KB`);
  }
  check("S3", "Each page under 150 KB", problems);
}

// T3 (files): every internal link and anchor resolves; external links answer.
{
  const problems = [];
  const ids = new Map();
  const idsOf = (file) => {
    if (!ids.has(file)) ids.set(file, new Set([...read(file).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    return ids.get(file);
  };
  const external = new Set();
  for (const f of pages) {
    const page = "/" + rel(f).replace(/^dist\//, "").replace(/index\.html$/, "");
    for (const m of read(f).matchAll(/\shref="([^"]+)"/g)) {
      const href = m[1].replaceAll("&amp;", "&");
      if (/^(mailto:|#$)/.test(href)) continue;
      if (/^https?:/.test(href)) {
        if (!href.startsWith("https://prcblacksite.github.io")) external.add(href);
        continue;
      }
      const [path, anchor] = href.startsWith("#") ? [page, href.slice(1)] : href.split("#");
      if (path.startsWith("/_astro/") || path.startsWith("/og/")) continue;
      const target = path.endsWith("/") ? join(dist, path, "index.html") : join(dist, path);
      if (!existsSync(target)) problems.push(`${rel(f)}: ${href} goes nowhere`);
      else if (anchor && target.endsWith(".html") && !idsOf(target).has(decodeURIComponent(anchor))) problems.push(`${rel(f)}: ${href} has no #${anchor}`);
    }
  }
  if (!process.argv.includes("--offline")) {
    const answers = await Promise.all(
      [...external].map(async (url) => {
        const r = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (prc link check)" }, signal: AbortSignal.timeout(15000) }).catch((e) => ({ ok: false, status: e.message }));
        // Some sites refuse a robot but open in a browser: 403 and 429 count as reachable.
        return r.ok || [403, 429].includes(r.status) ? null : `${url}: ${r.status}`;
      }),
    );
    problems.push(...answers.filter(Boolean));
  }
  check("T3", `Links resolve (${external.size} external)`, problems);
}

// prc.json: the glossary, links, week, playtests and chapters, and nothing else.
{
  const problems = [];
  const data = JSON.parse(read(join(dist, "prc.json")));
  const keys = Object.keys(data).sort().join(",");
  if (keys !== "chapters,glossary,links,playtests,week") problems.push(`keys are ${keys}`);
  if (!Array.isArray(data.glossary) || data.glossary.length < 10) problems.push("the glossary is missing");
  check("D1", "prc.json holds only what the bot reads", problems);
}

const width = Math.max(...rows.map((r) => r.name.length));
for (const r of rows) {
  console.log(`${r.problems.length ? "FAIL" : "PASS"}  ${r.id.padEnd(3)} ${r.name.padEnd(width)}${r.problems.length ? `  ${r.problems.length} found` : ""}`);
  for (const p of r.problems.slice(0, 12)) console.log(`        ${p}`);
}
const failed = rows.filter((r) => r.problems.length).length;
console.log(`${rows.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
