// Every kind of control, by mouse and keyboard, ported from the prototype's test_ui.py (T3), plus
// no sideways scroll on any page at 360px (T2) and the old addresses forwarding (T3).
import { expect, test, type Page } from "@playwright/test";

const narrow = (page: Page) => (page.viewportSize()?.width ?? 1280) < 960;
const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
};

test("the side menu, aria-current, and previous and next", async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto("/");
  if (narrow(page)) {
    await page.click("[data-menu]");
    await expect(page.locator("body")).toHaveClass(/menu-open/);
    expect(await page.evaluate(() => (document.getElementById("side") as HTMLElement).inert)).toBe(false);
  }
  const loop = page.locator('#side a[href="/wiki/loop/"]');
  if (!(await loop.isVisible())) await page.click('#side summary:has-text("The game")');
  await loop.click();
  await expect(page).toHaveURL(/\/wiki\/loop\/$/);
  await expect(page.locator("#h-page")).toHaveText("The loop");
  await expect(page.locator('#side a[href="/wiki/loop/"]')).toHaveAttribute("aria-current", "page");
  if (narrow(page)) {
    await expect(page.locator("body")).not.toHaveClass(/menu-open/);
    expect(await page.evaluate(() => (document.getElementById("side") as HTMLElement).inert)).toBe(true);
    await page.click("[data-menu]");
    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/menu-open/);
  }
  await page.click(".pager .next");
  await expect(page).toHaveURL(/\/wiki\/camp\/$/);
  expect(errors).toEqual([]);
});

test("search finds a word, opens a hit, shows an empty state, and Escape leaves it", async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto("/wiki/");
  await page.fill("#q", "sergeant");
  await expect(page.locator(".hit").first()).toBeVisible();
  await expect(page.locator('[data-page="search"]')).toBeVisible();
  const href = await page.locator(".hit").first().getAttribute("href");
  await page.locator(".hit").first().click();
  await expect(page).toHaveURL(new RegExp(`${href?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  await page.fill("#q", "zzzqqq");
  await expect(page.locator("[data-results] .empty")).toBeVisible();
  await page.press("#q", "Escape");
  await expect(page.locator('[data-page="search"]')).toBeHidden();
  await expect(page.locator("main > section.page").first()).toBeVisible();
  // A glossary word comes back as its own result, landing on its row.
  await page.fill("#q", "adit");
  await expect(page.locator('.hit[href*="/wiki/glossary/#g-the-adit"]').first()).toBeVisible();
  // "/" jumps to the box from anywhere.
  await page.press("#q", "Escape");
  await page.keyboard.press("/");
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("q");
  expect(errors).toEqual([]);
});

test("the glossary filter and its empty state", async ({ page }) => {
  await page.goto("/wiki/glossary/");
  await page.fill("#gq", "adit");
  const shown = await page.locator(".gloss li:visible").count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(5);
  await page.fill("#gq", "nothingmatches");
  await expect(page.locator(".gloss-wrap .empty")).toBeVisible();
});

test("the department tabs, by mouse and by arrow key", async ({ page }) => {
  await page.goto("/orientation/#departments");
  await page.click("#tab-sec");
  await expect(page.locator("#panel-sec")).toBeVisible();
  await expect(page.locator("#panel-cd")).toBeHidden();
  await page.focus("#tab-sec");
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("tab-mvf");
  await expect(page.locator("#panel-mvf")).toBeVisible();
});

test("an anchor lands just under the header, and an unknown address is the 404 page", async ({ page }) => {
  await page.goto("/wiki/ranks/#every-title");
  const top = await page.evaluate(() => document.getElementById("every-title")!.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(40);
  expect(top).toBeLessThan(140);
  await page.goto("/nowhere/");
  await expect(page.locator("#h-page")).toHaveText("Not found");
});

test("the roadmap: map or list, picking, filters and search", async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto("/roadmap/");
  const view = await page.evaluate(() => document.documentElement.getAttribute("data-rm-view"));
  expect(view).toBe(narrow(page) && (page.viewportSize()?.width ?? 0) < 720 ? "list" : "map");
  if (view === "map") {
    await page.click('.rm-node[data-id="floor-2"]', { force: true });
    await expect(page.locator("[data-detail]")).toContainText("Floor 2");
    expect(await page.evaluate(() => location.hash)).toBe("#floor-2");
    await expect(page.locator(".rm-edge.dep")).toHaveCount(1);
    await expect(page.locator(".rm-edge.unl")).toHaveCount(2);
    await page.click('[data-detail] [data-go="works-bar"]');
    await expect(page.locator("[data-detail]")).toContainText("The works bar");
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-detail]")).toBeHidden();
    const transform = () => page.evaluate(() => document.querySelector(".rm-svg g")?.getAttribute("transform"));
    await page.click('[data-zoom="in"]');
    await page.waitForTimeout(450);
    const k1 = await transform();
    await page.click('[data-zoom="fit"]');
    await page.waitForTimeout(450);
    const k2 = await transform();
    expect(k1).not.toBe(k2);
    const box = (await page.locator(".rm-zoom").boundingBox())!;
    const [x0, y0] = [box.x + box.width + 40, box.y + 10];
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    await page.mouse.move(x0 + 100, y0 - 60, { steps: 5 });
    await page.mouse.up();
    expect(await transform()).not.toBe(k2);
    await page.click('[data-view="list"]');
    await expect(page.locator(".rm-list")).toBeVisible();
    await expect(page.locator(".rm-stage")).toBeHidden();
    await page.click('[data-view="map"]');
  }
  await page.click('.fchip[data-v="live"]');
  await expect(page.locator("[data-count]")).toContainText("38");
  await expect(page.locator("[data-reset]")).toBeVisible();
  await page.click("[data-reset]");
  await page.fill("#rm-q", "boat");
  await expect(page.locator("[data-count]")).toContainText("match");
  await page.fill("#rm-q", "");
  if (view === "list") {
    await page.click('.rm-row[data-id="floor-2"] a[data-go="works-bar"]');
    await expect(page.locator('.rm-row[data-id="works-bar"]')).toHaveClass(/landed/);
  }
  // A deep link picks its item on arrival.
  await page.goto("/roadmap/#floor-2");
  await expect(page.locator(".rm-row.landed")).toHaveAttribute("data-id", "floor-2");
  expect(errors).toEqual([]);
});

test("the skip link is the first thing Tab reaches", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.classList.contains("skip"))).toBe(true);
});

test("the old addresses forward", async ({ page }) => {
  await page.goto("/orientation.html#ask");
  await expect(page).toHaveURL(/\/orientation\/#stuck$/);
  await page.goto("/wiki.html#ranks");
  await expect(page).toHaveURL(/\/wiki\/ranks\/$/);
  await page.goto("/wiki.html#home");
  await expect(page).toHaveURL(/\/wiki\/$/);
});

const PAGES = ["/", "/orientation/", "/wiki/", "/wiki/joining/", "/wiki/now/", "/wiki/what/", "/wiki/loop/", "/wiki/camp/", "/wiki/week/", "/wiki/roster/", "/wiki/departments/", "/wiki/ranks/", "/wiki/promotion/", "/story/", "/wiki/glossary/", "/roadmap/", "/wiki/conduct/", "/wiki/carapace/", "/404.html"];
test("no page scrolls sideways", async ({ page }) => {
  const wide: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 0) wide.push(`${path} by ${over}px`);
  }
  expect(wide).toEqual([]);
});

test("with reduced motion, the hero art is still and the page reads the same", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto("/");
  const still = await page.evaluate(async () => {
    const svg = await fetch("/art/hero-art.svg").then((r) => r.text());
    return /prefers-reduced-motion:\s*reduce/.test(svg);
  });
  expect(still).toBe(true);
  await expect(page.locator("#h-home")).toContainText("The site isn't built");
  await context.close();
});
