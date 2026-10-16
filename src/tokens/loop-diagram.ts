import { P, type Data, esc, inline } from "../lib/site";

const n = (v: number) => String(v);

function laneBox(x: number, y: number, w: number, h: number, node: Data, cls = ""): string {
  const hot = node.hot ? " hot" : "";
  return (
    `<g class="lf-box${hot}${cls}"><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="8"/>` +
    `<text x="${n(x + w / 2)}" y="${n(y + 20)}" class="lf-name">${esc(node.name)}</text>` +
    `<text x="${n(x + w / 2)}" y="${n(y + 36)}" class="lf-note">${esc(node.note)}</text></g>`
  );
}

const arrow = (d: string, hot: boolean, mid: string) => `<path class="lf-edge${hot ? " hot" : ""}" d="${d}" marker-end="url(#${mid}${hot ? "-hot" : ""})"/>`;
const marker = (mid: string) =>
  `<marker id="${mid}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 8 4 0 8z" class="lf-head"/></marker>` +
  `<marker id="${mid}-hot" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 8 4 0 8z" class="lf-head hot"/></marker>`;
const label = (x: number, y: number, t: string, anchor = "middle") => `<text x="${n(x)}" y="${n(y)}" class="lf-edge-t" text-anchor="${anchor}">${esc(t)}</text>`;

export function render(): string {
  const L = P.loop_diagram;
  const [dig, sup] = L.lanes as Data[];
  const desc =
    `${dig!.label}: ` +
    (dig!.nodes as Data[]).map((x) => `${x.name} (${x.note})`).join(", then ") +
    `. The skip pays credits to the carrier, spent at the ${L.side.name}, which ${L.side.note}. ` +
    `${sup!.label}: ` +
    (sup!.nodes as Data[]).map((x) => `${x.name} (${x.note})`).join(", then ") +
    ". Budget and stores are both spent at the " +
    (L.merge as Data[]).map((x) => x.name).join(", which moves ") +
    ".";

  // Wide: two lanes left to right, the merge chain stacked down the right.
  const W = 680, BW = 124, BH = 46, G = 60;
  const xs = [0, BW + G, 2 * (BW + G)];
  const y1 = 100, y2 = 226;
  const sx = xs[2]! + BW + G;
  const sy = Math.floor((y1 + y2) / 2);
  let parts = [`<defs>${marker("lfw")}</defs>`, `<text x="0" y="${y1 - 12}" class="lf-lane">${esc(dig!.label.toUpperCase())}</text>`, `<text x="0" y="${y2 - 12}" class="lf-lane">${esc(sup!.label.toUpperCase())}</text>`];
  for (const [lane, y] of [[dig!, y1], [sup!, y2]] as [Data, number][]) {
    (lane.nodes as Data[]).forEach((x, i) => parts.push(laneBox(xs[i]!, y, BW, BH, x)));
    (lane.edges as string[]).forEach((t, i) => {
      const x0 = xs[i]! + BW, x1 = xs[i + 1]!;
      parts.push(arrow(`M${x0} ${n(y + BH / 2)}H${x1 - 2}`, Boolean(lane.nodes[i + 1].hot), "lfw"));
      parts.push(label((x0 + x1) / 2, y + BH / 2 - 7, t));
    });
  }
  const skx = xs[1]!;
  parts.push(laneBox(skx, 4, BW, BH, { name: L.side.name, note: L.side.note }, " side"));
  parts.push(arrow(`M${n(skx + BW / 2)} ${y1}V${4 + BH + 2}`, false, "lfw"));
  parts.push(label(skx + BW / 2 + 8, y1 - 18, L.side.edge, "start"));
  for (const [y, lane, below] of [[y1, dig!, false], [y2, sup!, true]] as [number, Data, boolean][]) {
    const cy = y + BH / 2;
    const ty = sy + (!below ? BH / 2 - 8 : BH / 2 + 8);
    parts.push(arrow(`M${xs[2]! + BW} ${n(cy)}H${xs[2]! + BW + 28}V${n(ty)}H${sx - 2}`, Boolean(lane.nodes.at(-1).hot), "lfw"));
    parts.push(label(xs[2]! + BW + 6, cy + (below ? 16 : -7), L.into, "start"));
  }
  let my = sy;
  (L.merge as Data[]).forEach((x, i) => {
    parts.push(laneBox(sx, my, BW, BH, x));
    if (i < L.merge.length - 1) {
      parts.push(arrow(`M${n(sx + BW / 2)} ${my + BH}V${my + BH + 52}`, true, "lfw"));
      parts.push(label(sx + BW / 2 + 8, my + BH + 30, L.merge_edges[i], "start"));
      my += BH + 54;
    }
  });
  const H = my + BH + 4;
  const wide = `<svg class="lf lf-wide" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="lfw-t lfw-d"><title id="lfw-t">The loop</title><desc id="lfw-d">${esc(desc)}</desc>${parts.join("")}</svg>`;

  // Tall, for phones: each lane runs down its own column, then they meet.
  const TW = 340, CW = 150, GH = 44;
  const cx = [0, TW - CW];
  const rows = [0, 1, 2].map((i) => 22 + i * (BH + GH));
  parts = [`<defs>${marker("lft")}</defs>`, `<text x="0" y="12" class="lf-lane">${esc(dig!.label.toUpperCase())}</text>`, `<text x="${cx[1]}" y="12" class="lf-lane">${esc(sup!.label.toUpperCase())}</text>`];
  [dig!, sup!].forEach((lane, c) => {
    (lane.nodes as Data[]).forEach((x, i) => parts.push(laneBox(cx[c]!, rows[i]!, CW, BH, x)));
    (lane.edges as string[]).forEach((t, i) => {
      const x = cx[c]! + CW / 2;
      parts.push(arrow(`M${x} ${rows[i]! + BH}V${rows[i + 1]! - 2}`, Boolean(lane.nodes[i + 1].hot), "lft"));
      parts.push(label(x + 8, rows[i]! + BH + GH / 2 + 4, t, "start"));
    });
  });
  const slotY = rows[2]! + BH + 56;
  const slotX = (TW - CW) / 2;
  [dig!, sup!].forEach((lane, c) => {
    const x = cx[c]! + CW / 2;
    const tx = slotX + (c === 0 ? CW / 2 - 20 : CW / 2 + 20);
    parts.push(arrow(`M${x} ${rows[2]! + BH}V${rows[2]! + BH + 26}H${n(tx)}V${slotY - 2}`, Boolean(lane.nodes.at(-1).hot), "lft"));
    parts.push(label(x + 8, rows[2]! + BH + 18, L.into, "start"));
  });
  my = slotY;
  (L.merge as Data[]).forEach((x, i) => {
    parts.push(laneBox(slotX, my, CW, BH, x));
    if (i < L.merge.length - 1) {
      parts.push(arrow(`M${TW / 2} ${my + BH}V${my + BH + GH - 2}`, true, "lft"));
      parts.push(label(TW / 2 + 8, my + BH + GH / 2 + 4, L.merge_edges[i], "start"));
      my += BH + GH;
    }
  });
  const TH = my + BH + 4;
  const tall = `<svg class="lf lf-tall" viewBox="0 0 ${TW} ${TH}" role="img" aria-labelledby="lft-t lft-d"><title id="lft-t">The loop</title><desc id="lft-d">${esc(desc)}</desc>${parts.join("")}</svg>`;
  return `<figure class="loopfig">${wide}${tall}<figcaption class="caption">${inline(L.caption)}</figcaption></figure>`;
}
