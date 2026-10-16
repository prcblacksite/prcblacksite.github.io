import { unified } from "@astrojs/markdown-remark";
import { defineConfig, fontProviders } from "astro/config";
import remarkHeadingId from "remark-heading-id";
import { rehypeTables } from "./src/lib/rehype-tables";
import { remarkTokens } from "./src/lib/remark-tokens";

const fontsource = (pkg: string, family: string, weights: number[]) =>
  weights.map((weight) => ({ src: [`./node_modules/@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff2`], weight, style: "normal" as const }));

export default defineConfig({
  site: "https://prcblacksite.github.io",
  output: "static",
  trailingSlash: "always",
  build: { format: "directory" },
  markdown: {
    syntaxHighlight: false,
    // Smart punctuation stays off: it would turn hyphens into the dashes the house rules forbid.
    processor: unified({ smartypants: false, remarkPlugins: [remarkHeadingId, remarkTokens], rehypePlugins: [rehypeTables] }),
  },
  // Self-hosted from the Fontsource packages, with fallbacks sized to match so nothing shifts (S3).
  fonts: [
    { provider: fontProviders.local(), name: "Barlow Condensed", cssVariable: "--font-barlow", fallbacks: ["Arial Narrow", "sans-serif"], options: { variants: fontsource("barlow-condensed", "Barlow Condensed", [600, 700]) } },
    { provider: fontProviders.local(), name: "IBM Plex Sans", cssVariable: "--font-plex-sans", fallbacks: ["sans-serif"], options: { variants: fontsource("ibm-plex-sans", "IBM Plex Sans", [400, 500, 600]) } },
    { provider: fontProviders.local(), name: "IBM Plex Mono", cssVariable: "--font-plex-mono", fallbacks: ["monospace"], options: { variants: fontsource("ibm-plex-mono", "IBM Plex Mono", [400, 500]) } },
  ],
});
