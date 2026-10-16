import { BRANCH, P, esc, table } from "../lib/site";

export function render(): string {
  const rows = Object.entries(P.specialists as Record<string, string[]>).map(([k, v]) => [esc(BRANCH[k]!.name), esc(v.join(", "))]);
  return table(["Department", "Specialist slots"], rows, "Specialist slots");
}
