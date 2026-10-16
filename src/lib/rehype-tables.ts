// A Markdown table scrolls inside its own box on a phone, as the components' tables do.
import type { Element, Root } from "hast";
import { SKIP, visit } from "unist-util-visit";

export function rehypeTables() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      const classes = parent.type === "element" ? String((parent as Element).properties?.className ?? "") : "";
      if (classes.includes("tw")) return;
      parent.children[index] = { type: "element", tagName: "div", properties: { className: ["tw"], tabIndex: 0 }, children: [node] };
      return SKIP;
    });
  };
}
