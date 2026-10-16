import { chip, esc, inline, opsTime, shortDate, upcomingPlaytests } from "../lib/site";

export function render(): string {
  const hm = opsTime();
  let first = true;
  const lis = upcomingPlaytests().map((p) => {
    const doors = String(p.label).toLowerCase().includes("doors");
    let tag = "";
    if (!doors && first) {
      tag = chip("next", "Next");
      first = false;
    } else if (doors) tag = chip("building", "Doors");
    const iso = `${String(p.date)}T${hm}:00Z`;
    return `<li data-date="${String(p.date)}"><time datetime="${iso}" data-utc="${iso}">${esc(shortDate(p.date))}</time><span>${inline(p.label)}</span>${tag}</li>`;
  });
  return `<ol class="dates" data-dates>${lis.join("")}</ol>`;
}
