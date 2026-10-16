import { type Page, markdown, textOf } from "../lib/site";
import * as application from "./application";
import * as beside from "./beside";
import * as branches from "./branches";
import * as campLadder from "./camp-ladder";
import * as channels from "./channels";
import * as chapters from "./chapters";
import * as charter from "./charter";
import * as clearance from "./clearance";
import * as clocks from "./clocks";
import * as commands from "./commands";
import * as consequences from "./consequences";
import * as currencies from "./currencies";
import * as departmentCards from "./department-cards";
import * as departmentPicker from "./department-picker";
import * as departmentWeek from "./department-week";
import * as docCards from "./doc-cards";
import * as firstSteps from "./first-steps";
import * as follow from "./follow";
import * as glossary from "./glossary";
import * as grades from "./grades";
import * as hero from "./hero";
import * as joiningSteps from "./joining-steps";
import * as loop from "./loop";
import * as loopDiagram from "./loop-diagram";
import * as modules from "./modules";
import * as notBranches from "./not-branches";
import * as pings from "./pings";
import * as playtests from "./playtests";
import * as promotionGates from "./promotion-gates";
import * as rankLayers from "./rank-layers";
import * as rankPowers from "./rank-powers";
import * as roadmap from "./roadmap";
import * as roster from "./roster";
import * as rotation from "./rotation";
import * as specialists from "./specialists";
import * as statusBoard from "./status-board";
import * as titles from "./titles";
import * as week from "./week";
import * as wikiCards from "./wiki-cards";
import * as worksExample from "./works-example";

// Every {{ token }} a page may use, by name. A name missing from here fails the build.
export const TOKENS: Record<string, (page: Page) => string> = {
  hero: hero.render,
  loop: loop.render,
  "status-board": statusBoard.render,
  "department-cards": departmentCards.render,
  "doc-cards": docCards.render,
  follow: follow.render,
  "first-steps": firstSteps.render,
  "joining-steps": joiningSteps.render,
  "rank-layers": rankLayers.render,
  clearance: clearance.render,
  "department-picker": departmentPicker.render,
  "camp-ladder": campLadder.render,
  week: week.render,
  "works-example": worksExample.render,
  channels: channels.render,
  glossary: glossary.render,
  "wiki-cards": wikiCards.render,
  charter: charter.render,
  clocks: clocks.render,
  playtests: playtests.render,
  "loop-diagram": loopDiagram.render,
  currencies: currencies.render,
  modules: modules.render,
  branches: branches.render,
  "not-branches": notBranches.render,
  grades: grades.render,
  titles: titles.render,
  "rank-powers": rankPowers.render,
  specialists: specialists.render,
  beside: beside.render,
  "promotion-gates": promotionGates.render,
  consequences: consequences.render,
  roster: roster.render,
  rotation: rotation.render,
  "department-week": departmentWeek.render,
  application: application.render,
  commands: commands.render,
  pings: pings.render,
  chapters: chapters.render,
  roadmap: roadmap.render,
};

// The token on a line of its own, and nothing else on the line.
export const TOKEN_LINE = /^\{\{\s*([a-z0-9-]+)\s*\}\}\s*$/;

// Which scripts a page needs, by the tokens it uses.
export function tokensOf(page: Page): string[] {
  return page.body.split(/\r?\n/).flatMap((line) => {
    const m = TOKEN_LINE.exec(line.trim());
    return m ? [m[1]!] : [];
  });
}

// Reading time: the words of the page as rendered, components included, at 200 a minute.
export function minutesOf(page: Page): number {
  const body = page.body
    .split(/\r?\n/)
    .map((line) => {
      const m = TOKEN_LINE.exec(line.trim());
      return m ? (TOKENS[m[1]!]?.(page) ?? "") : line;
    })
    .join("\n");
  const words = textOf(markdown(body)).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
