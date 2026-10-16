// The side menu: a drawer under 960px, inert while closed, Escape and the scrim close it, and the
// groups you opened are remembered. "/" jumps to search from anywhere.
import { $, $$, store } from "./dom";

const side = $<HTMLElement>("#side")!;
const menuBtn = $<HTMLButtonElement>("[data-menu]")!;
const scrim = $<HTMLElement>("[data-scrim]")!;
const narrow = window.matchMedia("(max-width: 959px)");

const OPEN_KEY = "prc.nav.open";
const saved = store.get(OPEN_KEY);
if (saved !== null) {
  const open = new Set(saved.split(","));
  for (const d of $$<HTMLDetailsElement>("details[data-group]", side)) d.open = open.has(d.dataset.group ?? "") || d.dataset.group === "start" || Boolean(d.querySelector("[aria-current]"));
}
side.addEventListener(
  "toggle",
  () => store.set(OPEN_KEY, $$<HTMLDetailsElement>("details[data-group]", side).filter((d) => d.open).map((d) => d.dataset.group).join(",")),
  true,
);

const isOpen = () => document.body.classList.contains("menu-open");
const syncInert = () => (side.inert = narrow.matches && !isOpen());
function openMenu() {
  document.body.classList.add("menu-open");
  menuBtn.setAttribute("aria-expanded", "true");
  syncInert();
  ($<HTMLAnchorElement>("a[aria-current]", side) ?? $<HTMLAnchorElement>("a", side))?.focus();
}
function closeMenu(returnFocus = true) {
  if (!isOpen()) return;
  document.body.classList.remove("menu-open");
  menuBtn.setAttribute("aria-expanded", "false");
  syncInert();
  if (returnFocus) menuBtn.focus();
}
menuBtn.addEventListener("click", () => (isOpen() ? closeMenu() : openMenu()));
scrim.addEventListener("click", () => closeMenu());
side.addEventListener("click", (e) => {
  if ((e.target as Element).closest("a")) closeMenu(false);
});
narrow.addEventListener("change", () => {
  if (!narrow.matches) closeMenu(false);
  syncInert();
});
syncInert();

document.addEventListener("keydown", (e) => {
  const el = document.activeElement as HTMLElement | null;
  const typing = !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
  if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    const q = $<HTMLInputElement>("#q");
    q?.focus();
    q?.select();
  }
  if (e.key === "Escape" && isOpen()) closeMenu();
});
