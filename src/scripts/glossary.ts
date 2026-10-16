// The glossary filter, and an empty state that sends people to #faq-desk and /whatis.
import { $, $$ } from "./dom";

for (const g of $$("[data-gloss]")) {
  const input = $<HTMLInputElement>("input", g)!;
  const items = $$<HTMLLIElement>("li", g);
  const empty = $<HTMLElement>(".empty", g)!;
  input.addEventListener("input", () => {
    const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const li of items) {
      const on = words.every((w) => (li.dataset.q ?? "").includes(w));
      li.hidden = !on;
      if (on) shown++;
    }
    empty.hidden = shown > 0;
  });
}
