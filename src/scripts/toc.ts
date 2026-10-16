// On this page: marks the section you are reading.
import { $, $$ } from "./dom";

const toc = $(".toc");
if (toc) {
  const links = $$<HTMLAnchorElement>("a[data-toc]", toc);
  let frame = 0;
  const update = () => {
    frame = 0;
    let active: HTMLAnchorElement | null = null;
    for (const a of links) {
      const h = document.getElementById(a.dataset.toc ?? "");
      if (h && h.getBoundingClientRect().top < 140) active = a;
    }
    for (const a of links) {
      if (a === active) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  };
  window.addEventListener("scroll", () => (frame ||= requestAnimationFrame(update)), { passive: true });
  update();
}
