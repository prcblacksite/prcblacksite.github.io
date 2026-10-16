// The department picker: click, arrow keys, Home and End, with a roving tabindex.
import { $$ } from "./dom";

for (const tabs of $$("[data-tabs]")) {
  const all = $$<HTMLButtonElement>('[role="tab"]', tabs);
  const pick = (t: HTMLButtonElement, focus: boolean) => {
    for (const x of all) {
      const on = x === t;
      x.setAttribute("aria-selected", String(on));
      x.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(x.getAttribute("aria-controls") ?? "");
      if (panel) panel.hidden = !on;
    }
    if (focus) t.focus();
  };
  tabs.addEventListener("click", (e) => {
    const t = (e.target as Element).closest<HTMLButtonElement>('[role="tab"]');
    if (t) pick(t, false);
  });
  tabs.addEventListener("keydown", (e) => {
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const keys: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: all.length - 1 };
    const to = keys[(e as KeyboardEvent).key];
    if (to === undefined) return;
    e.preventDefault();
    pick(all[(to + all.length) % all.length]!, true);
  });
}
