import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Every page is one Markdown file. The id is its file path, not its slug: the slug is the page's
// address (/wiki/ranks/), which src/pages/[...path].astro turns into the route.
const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.md", generateId: ({ entry }) => entry.replace(/\.md$/, "") }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string().regex(/^\/([a-z0-9-]+\/)*$/),
    group: z.enum(["start", "game", "ranks", "world", "next", "community"]).optional(),
    order: z.number().optional(),
    toc: z.boolean().optional(),
    layout: z.enum(["home", "page", "wide", "plain"]).optional(),
  }),
});

export const collections = { pages };
