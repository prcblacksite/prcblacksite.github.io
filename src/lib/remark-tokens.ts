// The Markdown side of the data tokens. A paragraph that is only {{ name }} becomes that
// component's HTML, and an unknown name fails the build. On every page but the home page, the
// first paragraph is lifted out as the lead for the page head. ███ in text becomes a redaction bar.
import { toHtml } from "hast-util-to-html";
import type { Html, Paragraph, Root, RootContent, Text } from "mdast";
import { toHast } from "mdast-util-to-hast";
import { SKIP, visit } from "unist-util-visit";
import { TOKENS, TOKEN_LINE, minutesOf } from "../tokens/index";
import { BY_SLUG, REDACT } from "./site";

const tokenName = (node: RootContent): string | null => {
  if (node.type !== "paragraph" || node.children.length !== 1 || node.children[0]?.type !== "text") return null;
  return TOKEN_LINE.exec(node.children[0].value.trim())?.[1] ?? null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function remarkTokens() {
  return (tree: Root, file: { data: { astro?: { frontmatter?: Record<string, unknown> } } }) => {
    const fm = file.data.astro?.frontmatter ?? {};
    const page = BY_SLUG[String(fm.slug)];
    if (!page) throw new Error(`A page has slug ${String(fm.slug)}, which no Markdown file in src/content/pages declares.`);

    const first = tree.children[0];
    if (fm.layout !== "home" && first && first.type === "paragraph" && !tokenName(first)) {
      const hast = toHast(first as Paragraph) as { children?: unknown[] };
      fm.lead = toHtml((hast.children ?? []) as Parameters<typeof toHtml>[0]).replaceAll("███", REDACT);
      tree.children.shift();
    }

    visit(tree, "paragraph", (node, index, parent) => {
      const name = tokenName(node);
      if (!name || !parent || index === undefined) return;
      const render = TOKENS[name];
      if (!render) throw new Error(`${page.slug}: unknown token {{ ${name} }}. Add it to src/tokens/index.ts, or fix the name.`);
      parent.children[index] = { type: "html", value: render(page) } as Html;
      return SKIP;
    });

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes("███")) return;
      const pieces = node.value.split("███").flatMap((text, i) => [...(i ? [{ type: "html", value: REDACT } as Html] : []), ...(text ? [{ type: "text", value: text } as Text] : [])]);
      (parent.children as RootContent[]).splice(index, 1, ...pieces);
      return [SKIP, index + pieces.length];
    });

    fm.minutes = minutesOf(page);
  };
}
