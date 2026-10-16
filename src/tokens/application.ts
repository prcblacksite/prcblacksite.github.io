import { BRANCH, P, type Data, chip, esc, inline, table } from "../lib/site";

export function render(): string {
  const a = P.joining.application;
  const picked = (a.picked_in_the_command as string[]).map((x) => `<li>${inline(x)}</li>`).join("");
  const typed = (a.typed_in_the_form as Data[])
    .map(
      (f) =>
        `<li><span class="f-label">${esc(f.label)}</span>${chip(f.required ? "live" : "later", f.required ? "Required" : "Optional")}` +
        (f.hint ? `<span class="f-hint">${inline(f.hint)}</span>` : "") +
        "</li>",
    )
    .join("");
  const extras = Object.entries(a.extras as Record<string, string>).map(([k, v]) => [esc(BRANCH[k]!.name), inline(v)]);
  return (
    `<p>${inline(a.summary)}</p>` +
    `<div class="grid two app"><div class="card"><p class="k">Picked in /apply</p><ol>${picked}</ol></div>` +
    `<div class="card"><p class="k">Typed in the form</p><ul class="fields">${typed}</ul></div></div>` +
    `<h3 id="extras">What else each department asks for</h3>` +
    table(["Department", "Also"], extras, "What else each department asks for") +
    `<p>Every application gets an answer within ${inline(a.answer_within)}.</p>`
  );
}
