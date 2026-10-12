import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium, expect as browserExpect } from "@playwright/test";

if (process.env.UI_E2E_MUTATE_DEMO !== "true") {
  throw new Error("Set UI_E2E_MUTATE_DEMO=true and use a disposable seeded demo database.");
}

const base = process.env.UI_BASE_URL ?? "http://localhost:5173";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/brave-browser",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"]
});
const errors = [];

async function signIn(email) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/login`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  return { page, context };
}

try {
  const manager = await signIn("manager@atomberg.local");
  await manager.page.getByRole("link", { name: /Kavya Iyer/ }).click();
  const editor = manager.page.locator('section[aria-label="Weights for Kavya Iyer"]');
  await editor.getByRole("heading", { name: "Kavya Iyer's plan" }).waitFor();
  const boundary = editor.getByRole("slider").first();
  const previousWeight = Number(await boundary.getAttribute("aria-valuenow"));
  await boundary.focus();
  await manager.page.keyboard.press("ArrowRight");
  await browserExpect(boundary).toHaveAttribute("aria-valuenow", String(previousWeight + 5));
  await editor.getByRole("button", { name: "Reset" }).click();
  await editor.getByLabel("Reduce supplier motor defects weight").fill("40");
  await editor.getByLabel("Raise first-pass fan assembly yield weight").fill("20");
  await editor.screenshot({ path: "docs/ui/after/team-weights-draft-light-1280.png" });
  await editor.getByRole("button", { name: "Save weights" }).click();
  await manager.page.getByText("Goal weights saved. The employee was notified.").waitFor();
  await editor.getByLabel("Reduce supplier motor defects weight").waitFor();
  assert.equal(await editor.getByLabel("Reduce supplier motor defects weight").inputValue(), "40");
  await manager.page.screenshot({ path: "docs/ui/after/team-weights-light-1280.png" });

  const employee = await signIn("kavya.iyer@atomberg.local");
  await employee.page.goto(`${base}/notifications`);
  const weightNotice = employee.page.getByRole("link", { name: /rebalanced your plan/ });
  await weightNotice.waitFor();
  await weightNotice.click();
  await employee.page.waitForURL(`${base}/plan`);
  await employee.page.goto(`${base}/notifications`);
  await employee.page.getByRole("link", { name: /rebalanced your plan.*Read/ }).waitFor();
  await employee.page.goto(`${base}/check-ins?quarter=Q4`);
  const checkIn = employee.page.locator(".checkin-record").first();
  await checkIn.locator("summary").click();
  await checkIn.getByLabel("Planned target").fill("12");
  await checkIn.getByLabel("Actual achievement").fill("10");
  await checkIn.getByRole("combobox", { name: "Progress state" }).selectOption("ON_TRACK");
  await checkIn.getByRole("button", { name: "Save Q4 check-in" }).click();
  await employee.page.getByText("Q4 check-in saved").waitFor();

  await manager.page.goto(`${base}/notifications`);
  await manager.page.reload();
  await manager.page.getByRole("link", { name: /updated a Q4 check-in/ }).waitFor();
  await manager.page.getByRole("button", { name: "Mark all as read" }).click();
  await manager.page.getByText("All notifications marked as read").waitFor();
  await manager.page.reload();
  assert.equal(await manager.page.getByRole("button", { name: "Mark all as read" }).count(), 0);

  for (const page of [manager.page, employee.page]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/notifications`);
    await page.getByRole("heading", { name: "Notifications" }).waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.equal(result.violations.filter((item) => ["serious", "critical"].includes(item.impact)).length, 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  }
  await employee.page.screenshot({ path: "docs/ui/after/notifications-employee-light-390.png" });
  await manager.page.screenshot({ path: "docs/ui/after/notifications-manager-light-390.png" });
  assert.deepEqual(errors, []);
  console.log("Manager rebalance, employee receipt/read, quarterly update, manager receipt/read, phone axe: passed.");
  await Promise.all([manager.context.close(), employee.context.close()]);
} finally {
  await browser.close();
}
