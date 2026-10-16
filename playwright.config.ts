import { defineConfig } from "@playwright/test";

// The click tests run against the built site (npm run build first), in the Chrome already on the
// machine, at a desktop and a phone width (T2, T3).
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: [["list"]],
  webServer: { command: "npx astro preview --port 4321 --host 127.0.0.1", url: "http://127.0.0.1:4321/", reuseExistingServer: true },
  use: { baseURL: "http://127.0.0.1:4321", channel: "chrome" },
  projects: [
    { name: "1280", use: { viewport: { width: 1280, height: 900 } } },
    { name: "360", use: { viewport: { width: 360, height: 780 } } },
  ],
});
