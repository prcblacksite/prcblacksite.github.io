// The home page's status board: the countdown to the doors, ticking every 30 seconds, and the
// works bar from the sky Worker's feed. Until the feed answers with numbers, the board keeps what
// the build wrote ("It starts moving when the doors open"), never an empty box.
import { $ } from "./dom";

const board = $<HTMLElement>("[data-board]");
const cd = $<HTMLElement>("[data-countdown]");
const rest = $<HTMLElement>("[data-countdown-rest]");

function tick() {
  if (!cd) return;
  const secs = (Date.parse(cd.dataset.countdown ?? "") - Date.now()) / 1000;
  if (secs <= 0) {
    cd.textContent = "Open";
    if (rest) rest.textContent = "The doors are open";
    return;
  }
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const s = (n: number) => (n === 1 ? "" : "s");
  cd.textContent = days >= 1 ? `${days} day${s(days)}` : hours >= 1 ? `${hours} hour${s(hours)}` : `${mins} minutes`;
  if (rest) rest.textContent = days >= 1 ? `and ${hours} hour${s(hours)}` : hours >= 1 ? `and ${mins} minutes` : "";
}
tick();
setInterval(tick, 30_000);

interface Works {
  bar?: unknown;
  delta?: unknown;
  dug?: unknown;
  built?: unknown;
}
async function feed() {
  const url = board?.dataset.feed;
  if (!url) return;
  const answer = (await fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)) as { works?: Works | null } | null;
  const w = answer?.works;
  if (!w || typeof w.bar !== "number" || !Number.isFinite(w.bar)) return;
  const bar = Math.min(100, Math.max(0, w.bar));
  const shown = `${Math.round(bar * 10) / 10}%`;
  const big = $<HTMLElement>("[data-works-bar]");
  const meter = $<HTMLElement>(".meter", board ?? document);
  const note = $<HTMLElement>("[data-works-note]");
  if (big) big.textContent = shown;
  if (meter) {
    meter.setAttribute("aria-valuenow", String(bar));
    const fill = meter.querySelector<HTMLElement>("span");
    if (fill) fill.style.width = shown;
  }
  const lines = [w.dug, w.built].filter((x): x is string => typeof x === "string" && x.length > 0);
  if (note && lines.length) note.textContent = lines.join(" · ");
}
void feed();
