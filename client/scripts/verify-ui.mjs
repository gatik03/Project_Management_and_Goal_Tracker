import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.UI_BASE_URL ?? "http://localhost:5173";
const widths = [390, 768, 1280, 1536];
const routes = {
  public: ["/", "/login"],
  employee: ["/plan", "/check-ins", "/notifications"],
  manager: ["/team", "/team/check-ins", "/notifications", "/reports"],
  admin: [
    "/admin/people",
    "/admin/hierarchy",
    "/admin/cycles",
    "/admin/unlocks",
    "/admin/audit",
    "/reports",
  ],
};
const emails = {
  employee: "employee@atomberg.local",
  manager: "manager@atomberg.local",
  admin: "admin@atomberg.local",
};
const findings = [];
await mkdir("docs/ui/after", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/brave-browser",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  for (const theme of ["light", "dark"])
    for (const role of Object.keys(routes)) {
      const context = await browser.newContext({
        viewport: { width: 1536, height: 900 },
        deviceScaleFactor: 1,
      });
      await context.addInitScript(
        (value) => localStorage.setItem("goal-tracker-theme", value),
        theme,
      );
      const page = await context.newPage();
      page.on("pageerror", (error) =>
        findings.push({ role, theme, error: error.message }),
      );
      if (role !== "public") {
        await page.goto(`${base}/login`);
        await page.getByLabel("Email address").fill(emails[role]);
        await page.getByLabel("Password", { exact: true }).fill("Password123!");
        await page.getByRole("button", { name: "Sign in" }).click();
        await page.waitForURL((url) => !url.pathname.startsWith("/login"));
      }
      for (const path of routes[role]) {
        await page.goto(`${base}${path}`);
        await page.locator("h1").first().waitFor({ timeout: 15000 });
        await page.waitForTimeout(path === "/plan" ? 650 : 250);
        const slug =
          path === "/"
            ? "entry"
            : path === "/reports" || path === "/notifications"
              ? `${role}-${path.slice(1)}`
              : path.slice(1).replaceAll("/", "-");
        const issues = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const serious = issues.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact),
        );
        if (serious.length)
          findings.push({
            role,
            theme,
            path,
            axe: serious.map((item) => ({
              id: item.id,
              impact: item.impact,
              nodes: item.nodes.map((node) => node.target),
            })),
          });
        for (const width of widths) {
          await page.setViewportSize({ width, height: 900 });
          await page.screenshot({
            path: `docs/ui/after/${slug}-${theme}-${width}.png`,
            fullPage: false,
          });
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          );
          if (overflow)
            findings.push({ role, theme, path, width, overflow: true });
        }
      }
      await context.close();
    }
} finally {
  await browser.close();
}
await writeFile(
  "docs/ui/after/verification.json",
  JSON.stringify(findings, null, 2),
);
console.log(
  JSON.stringify(
    {
      screenshots:
        Object.values(routes).reduce((sum, list) => sum + list.length, 0) *
        widths.length *
        2,
      findings,
    },
    null,
    2,
  ),
);
if (findings.length) process.exitCode = 1;
