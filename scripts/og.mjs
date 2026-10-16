// Open Graph images and favicons, rendered before the build (SITEMAP, "Meta, icons and fonts").
// Each page gets public/og/<name>.png at 1200 by 630: the night strip from art/hero-art.svg, the
// seal, and the page title in Barlow Condensed. The favicons come from the PRC icon seal.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import { parse } from "yaml";

const root = process.cwd();
const pub = join(root, "public");
const tokens = readFileSync(join(root, "src/styles/tokens.css"), "utf8");
const token = (name) => new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(tokens)[1];
const [bg, ink, ink3, amber] = ["bg", "ink", "ink-3", "amber"].map(token);

// resvg reads TrueType, not WOFF. A WOFF 1 file is the same tables, each zlib-compressed: unpack them.
function woffToTtf(woff) {
  const tables = woff.readUInt16BE(12);
  const flavor = woff.readUInt32BE(4);
  const entries = [];
  for (let i = 0; i < tables; i++) {
    const at = 44 + i * 20;
    const [tag, offset, compLength, origLength, checksum] = [woff.readUInt32BE(at), woff.readUInt32BE(at + 4), woff.readUInt32BE(at + 8), woff.readUInt32BE(at + 12), woff.readUInt32BE(at + 16)];
    const raw = woff.subarray(offset, offset + compLength);
    entries.push({ tag, checksum, data: compLength < origLength ? inflateSync(raw) : raw });
  }
  const head = 12 + tables * 16;
  const pad = (n) => (n + 3) & ~3;
  const out = Buffer.alloc(head + entries.reduce((s, e) => s + pad(e.data.length), 0));
  const power = 2 ** Math.floor(Math.log2(tables));
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(tables, 4);
  out.writeUInt16BE(power * 16, 6);
  out.writeUInt16BE(Math.log2(power), 8);
  out.writeUInt16BE(tables * 16 - power * 16, 10);
  let offset = head;
  entries.forEach((e, i) => {
    out.writeUInt32BE(e.tag, 12 + i * 16);
    out.writeUInt32BE(e.checksum, 16 + i * 16);
    out.writeUInt32BE(offset, 20 + i * 16);
    out.writeUInt32BE(e.data.length, 24 + i * 16);
    e.data.copy(out, offset);
    offset += pad(e.data.length);
  });
  return out;
}
const font = (pkg, weight) => woffToTtf(readFileSync(join(root, `node_modules/@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff`)));
const fontBuffers = [font("barlow-condensed", 700), font("ibm-plex-mono", 500)];

const dataUri = (path) => `data:image/svg+xml;base64,${readFileSync(path).toString("base64")}`;
const hero = dataUri(join(pub, "art/hero-art.svg"));
const sealPrc = dataUri(join(pub, "seals/seal-prc.svg"));
const sealIcon = join(pub, "seals/seal-prc-icon.svg");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const png = (svg, width) => new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: "Barlow Condensed" } }).render().asPng();

function card(title) {
  // Barlow Condensed runs about 0.46 of its size per letter; shrink a long title to fit 1056px.
  const size = Math.min(112, Math.floor(1056 / (title.length * 0.46)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${bg}"/>
<image href="${hero}" x="0" y="250" width="1200" height="380" preserveAspectRatio="xMidYMid slice"/>
<image href="${sealPrc}" x="72" y="64" width="80" height="80"/>
<text x="172" y="114" font-family="IBM Plex Mono" font-weight="500" font-size="20" letter-spacing="4" fill="${ink3}">PROMETHEUS RESEARCH CORPORATION</text>
<text x="72" y="${200 + size * 0.8}" font-family="Barlow Condensed" font-weight="700" font-size="${size}" fill="${ink}">${esc(title)}</text>
<rect x="72" y="${226 + size * 0.8}" width="96" height="4" fill="${amber}"/>
</svg>`;
}

const pagesDir = join(root, "src/content/pages");
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".md") ? [join(dir, e.name)] : []));
mkdirSync(join(pub, "og"), { recursive: true });
let made = 0;
for (const file of walk(pagesDir)) {
  const fm = parse(/^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"))[1]);
  const name = fm.slug === "/" ? "home" : fm.slug.replace(/^\/|\/$/g, "").replaceAll("/", "-");
  writeFileSync(join(pub, "og", `${name}.png`), png(card(fm.slug === "/" ? "The site isn't built yet" : fm.title), 1200));
  made++;
}

// Favicons: the icon seal as it is, and on the page colour for the two PNGs.
copyFileSync(sealIcon, join(pub, "favicon.svg"));
const icon = (size, inset) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/><image href="${dataUri(sealIcon)}" x="${inset}" y="${inset}" width="${size - 2 * inset}" height="${size - 2 * inset}"/></svg>`;
writeFileSync(join(pub, "favicon-32.png"), png(icon(32, 1), 32));
writeFileSync(join(pub, "apple-touch-icon.png"), png(icon(180, 16), 180));
console.log(`og: ${made} page images, favicon.svg, favicon-32.png, apple-touch-icon.png`);
