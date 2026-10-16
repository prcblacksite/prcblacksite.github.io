import { P, type Data, esc, inline, seal } from "../lib/site";

export function render(): string {
  const tabs: string[] = [];
  const panels: string[] = [];
  (P.branches as Data[]).forEach((b, i) => {
    const code = b.code.toLowerCase();
    const sel = i === 0;
    tabs.push(
      `<button type="button" role="tab" class="tab" id="tab-${code}" aria-controls="panel-${code}" aria-selected="${sel}" tabindex="${sel ? 0 : -1}">${seal(b.code)}<span>${esc(b.name)}</span></button>`,
    );
    const evening = (b.evening as string[]).map((e) => `<li>${inline(e)}</li>`).join("");
    const suits = b.suits ? `<p class="k">Who it suits</p><p>${inline(b.suits)}</p>` : "";
    const shut = b.joinable === "never" ? " shut" : "";
    panels.push(
      `<div class="tabpanel" role="tabpanel" id="panel-${code}" aria-labelledby="tab-${code}" tabindex="0"${sel ? "" : " hidden"}>` +
        `<h3>${esc(b.name)} <span class="code mono">${esc(b.code)}</span></h3><p class="line">${inline(b.mandate)}</p>` +
        `<p class="k">An evening</p><ul>${evening}</ul>${suits}` +
        `<p class="howin${shut}"><b>How you get in.</b> ${inline(b.way_in)}</p></div>`,
    );
  });
  return `<div class="tabs" data-tabs><div class="tablist" role="tablist" aria-label="Departments">${tabs.join("")}</div>${panels.join("")}</div>`;
}
