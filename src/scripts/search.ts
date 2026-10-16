// Search, through Pagefind's index of every page's <main>. Typing swaps the page for the results;
// clearing the box brings the page back. Enter opens the first hit, Escape clears. Glossary words
// and roadmap items are headings with ids, so each comes back as a result of its own.
import { $, $$ } from "./dom";

interface Sub {
  title: string;
  url: string;
  excerpt: string;
  locations?: number[];
}
interface Hit {
  url: string;
  excerpt: string;
  meta: { title?: string; group?: string };
  sub_results?: Sub[];
}
interface Pagefind {
  init(): void;
  search(q: string): Promise<{ results: { data(): Promise<Hit> }[] } | null>;
}

const q = $<HTMLInputElement>("#q")!;
const results = $<HTMLElement>('[data-page="search"]')!;
const pageSections = () => $$<HTMLElement>("main > section.page").filter((s) => s !== results);
const list = $<HTMLElement>("[data-results]")!;
const title = $<HTMLElement>("[data-results-title]")!;
const count = $<HTMLElement>("[data-results-count]")!;
const pageTitle = document.title;
const MAX = 24;

let engine: Promise<Pagefind | null> | null = null;
let ready = false;
function load(): Promise<Pagefind | null> {
  const url = "/pagefind/pagefind.js";
  engine ??= import(/* @vite-ignore */ url).then(
    (pf: Pagefind) => {
      pf.init();
      ready = true;
      return pf;
    },
    () => null,
  );
  return engine;
}

// Pagefind marks matches with <mark>; only those marks and the text are kept, never other markup.
function excerpt(html: string): DocumentFragment {
  const doc = new DOMParser().parseFromString(`<p>${html}</p>`, "text/html");
  const frag = document.createDocumentFragment();
  for (const node of Array.from(doc.body.firstElementChild?.childNodes ?? [])) {
    if (node.nodeName === "MARK") {
      const mark = document.createElement("mark");
      mark.textContent = node.textContent;
      frag.append(mark);
    } else frag.append(node.textContent ?? "");
  }
  return frag;
}

function showResults(on: boolean) {
  for (const s of pageSections()) s.hidden = on;
  results.hidden = !on;
  document.title = on ? "Search · PRC" : pageTitle;
}

function hit(href: string, small: string, bold: string, text: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.className = "hit";
  a.href = href;
  const s = document.createElement("small");
  s.textContent = small;
  const b = document.createElement("b");
  b.textContent = bold;
  const span = document.createElement("span");
  span.append(excerpt(text));
  a.append(s, b, span);
  return a;
}

let run = 0;
async function runSearch() {
  const v = q.value.trim();
  const mine = ++run;
  if (!v) {
    showResults(false);
    return;
  }
  if (results.hidden) {
    showResults(true);
    window.scrollTo(0, 0);
  }
  title.textContent = `Results for “${v}”`;
  // S1: say so while the index loads, the first time only.
  if (!ready) count.textContent = "Loading the index";
  const pf = await load();
  if (mine !== run) return;
  if (!pf) {
    count.textContent = "";
    list.replaceChildren(Object.assign(document.createElement("div"), { className: "empty", textContent: "Search is not available on this copy of the site. The menu has every page." }));
    return;
  }
  const found = await pf.search(v);
  const data = await Promise.all((found?.results ?? []).slice(0, 10).map((r) => r.data()));
  if (mine !== run) return;
  const hits: HTMLAnchorElement[] = [];
  for (const d of data) {
    const page = d.meta.title ?? "";
    const group = d.meta.group ?? "";
    const subs = (d.sub_results ?? []).slice().sort((a, b) => (b.locations?.length ?? 0) - (a.locations?.length ?? 0));
    if (!subs.length) hits.push(hit(d.url, group, page, d.excerpt));
    for (const s of subs.slice(0, 3)) hits.push(hit(s.url, s.title === page ? group : `${page} · ${group}`, s.title, s.excerpt));
  }
  const shown = hits.slice(0, MAX);
  count.textContent = shown.length ? `${shown.length === MAX ? `The first ${MAX}` : shown.length} result${shown.length === 1 ? "" : "s"}` : "";
  list.replaceChildren(...shown);
  if (!shown.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Nothing matches that. Try one word, or the glossary, which has every code and place name. Or ask in #faq-desk.";
    list.append(empty);
  }
}

let timer = 0;
q.addEventListener("input", () => {
  clearTimeout(timer);
  timer = window.setTimeout(runSearch, 80);
});
q.addEventListener("focus", () => void load(), { once: true });
q.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    clearTimeout(timer);
    await runSearch();
    $<HTMLAnchorElement>(".hit", list)?.click();
  } else if (e.key === "Escape") {
    q.value = "";
    void runSearch();
    q.blur();
  }
});
