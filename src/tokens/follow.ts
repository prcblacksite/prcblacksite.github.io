import { P, esc, icon } from "../lib/site";

export function render(): string {
  const L = P.links;
  const S = L.social;
  const items: [string, string, string][] = [
    ["discord", "Discord", L.discord],
    ["roblox", "Roblox", L.roblox_group],
    ["tiktok", "TikTok", S.tiktok],
    ["youtube", "YouTube", S.youtube],
    ["x", "X", S.x],
    ["instagram", "Instagram", S.instagram],
    ["reddit", "Reddit", S.reddit],
    ["github", "GitHub", S.github],
  ];
  const links = items.map(([i, t, u]) => `<a href="${esc(u)}">${icon(i)}${esc(t)}</a>`).join("");
  return `<div class="follow-wrap"><p class="eyebrow">Follow the build</p><div class="follow">${links}</div></div>`;
}
