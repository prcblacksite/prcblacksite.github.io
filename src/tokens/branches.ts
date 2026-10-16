import { P, type Data, esc, inline, seal } from "../lib/site";

export function render(): string {
  return (P.branches as Data[])
    .map((b) => {
      const facts: [string, string][] = [["Mandate", inline(b.mandate)]];
      if (b.shift) facts.push(["A shift", inline(b.shift)]);
      facts.push(["An evening", `<ul>${(b.evening as string[]).map((e) => `<li>${inline(e)}</li>`).join("")}</ul>`]);
      if (b.sections) facts.push(["Sections", `<ul>${(b.sections as Data[]).map((s) => `<li><b>${esc(s.name)}</b> <span class="mono">${esc(s.code)}</span>. ${inline(s.text)}</li>`).join("")}</ul>`]);
      if (b.suits) facts.push(["Who it suits", inline(b.suits)]);
      facts.push(["Way in", inline(b.way_in)]);
      const dl = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
      const code = b.code.toLowerCase();
      return (
        `<section class="branch" aria-labelledby="${code}">` +
        `<div class="branch-head">${seal(b.code)}<div><h2 id="${code}">${esc(b.name)}</h2><p class="code">${esc(b.code)} · ${esc(b.short)}</p></div></div>` +
        `<dl class="facts">${dl}</dl></section>`
      );
    })
    .join("");
}
