// Every UTC time also in the reader's own zone, unless they are on UTC. Playtests already past are hidden.
import { $$ } from "./dom";

const hm = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const dayHm = new Intl.DateTimeFormat(undefined, { weekday: "long", hour: "2-digit", minute: "2-digit" });
function addLocal(el: HTMLElement, d: Date) {
  if (d.getTimezoneOffset() === 0 || el.querySelector(".local")) return;
  const span = document.createElement("span");
  span.className = "local";
  span.textContent = ` (${(d.getUTCDay() === d.getDay() ? hm : dayHm).format(d)} your time)`;
  el.append(span);
}
for (const t of $$<HTMLElement>("time[data-utc]")) {
  const d = new Date(t.dataset.utc ?? "");
  if (!Number.isNaN(d.getTime())) addLocal(t, d);
}
for (const t of $$<HTMLElement>("time[data-weekday]")) {
  const [h = 0, m = 0] = (t.dataset.hm ?? "").split(":").map(Number);
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m));
  d.setUTCDate(d.getUTCDate() + ((Number(t.dataset.weekday) - d.getUTCDay() + 7) % 7));
  addLocal(t, d);
}
const today = new Date().toISOString().slice(0, 10);
for (const ol of $$("[data-dates]")) for (const li of $$<HTMLLIElement>("li", ol)) li.hidden = (li.dataset.date ?? "") < today;
