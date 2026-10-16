import { type Data, inline } from "../lib/site";

// Numbered steps, for first-steps and joining-steps.
export function steps(items: Data[], title = "title", text = "text"): string {
  const lis = items.map((x, i) => `<li><span class="n" aria-hidden="true">${i + 1}</span><div><h3>${inline(x[title])}</h3><p>${inline(x[text])}</p></div></li>`);
  return `<ol class="steps">${lis.join("")}</ol>`;
}
