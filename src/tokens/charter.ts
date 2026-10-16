import { P, inline } from "../lib/site";

export function render(): string {
  const paras = String(P.charter_in_voice).trim().split("\n\n").map((p) => inline(p.trim()));
  const head = paras[0]!.replaceAll("\n", "<br>");
  return `<div class="doc-voice"><p class="dv-head">${head}</p>${paras.slice(1).map((p) => `<p>${p}</p>`).join("")}</div>`;
}
