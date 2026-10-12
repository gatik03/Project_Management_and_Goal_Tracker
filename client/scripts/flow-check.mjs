import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

if (process.env.UI_E2E_MUTATE_DEMO !== "true") {
  throw new Error("Set UI_E2E_MUTATE_DEMO=true to run this flow against a disposable seeded demo database.");
}
const base = process.env.UI_BASE_URL ?? "http://localhost:5173";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/brave-browser",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [];
async function signIn(email) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/login`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  await page.getByRole("heading", { level: 1 }).waitFor();
  return { context, page };
}
try {
  const employee = await signIn("pooja.deshmukh@atomberg.local");
  await employee.page.getByRole("button", { name: "New goal" }).click();
  const sheet = employee.page.getByRole("dialog");
  await sheet.getByLabel("Goal title").fill("Verify motor test fixtures");
  await sheet.getByLabel("Description").fill("Validate the motor test fixtures against the approved calibration sheet.");
  await sheet.getByLabel("Thrust area").fill("Product quality");
  await sheet.getByLabel("Target").fill("12");
  await sheet.getByLabel("Weight").fill("10");
  await sheet.getByLabel("Deadline").fill(`${new Date().getFullYear()}-12-31`);
  await sheet.getByRole("button", { name: "Add goal" }).click();
  await employee.page.getByRole("button", { name: "Save weights" }).waitFor({ state: "hidden" }).catch(() => {});
  await employee.page.getByRole("button", { name: /^Remove 5% from/ }).first().click();
  await employee.page.getByRole("button", { name: /^Remove 5% from/ }).first().click();
  await employee.page.getByRole("button", { name: "Save weights" }).click();
  await employee.page.getByText("Weights saved", { exact: true }).waitFor();
  await employee.page.getByRole("button", { name: "Submit plan" }).click();
  await employee.page.getByRole("dialog").getByRole("button", { name: "Submit plan" }).click();
  await employee.page.getByText("Plan submitted", { exact: true }).waitFor();

  const manager = await signIn("manager@atomberg.local");
  await manager.page.getByRole("link", { name: /Pooja Deshmukh/ }).click();
  const review = manager.page.locator(".review-goal").first();
  const goalTitle = await review.locator("h3").textContent();
  await review.getByRole("button", { name: "Send back" }).click();
  await manager.page.getByRole("dialog").screenshot({ path: "docs/ui/after/review-dialog-light-1280.png" });
  await manager.page.getByRole("dialog").getByLabel("Reason for rework").fill("Please attach the updated baseline and measurement source.");
  await manager.page.getByRole("dialog").getByRole("button", { name: "Send back" }).click();
  await manager.page.getByText("Goal sent back for rework", { exact: true }).waitFor();

  await employee.page.reload();
  const returned = employee.page.locator(".record").filter({ hasText: goalTitle }).first();
  await returned.getByRole("button", { name: "Edit" }).click();
  const editSheet = employee.page.getByRole("dialog");
  const description = await editSheet.getByLabel("Description").inputValue();
  await editSheet.getByLabel("Description").fill(`${description} The baseline and measurement source are attached.`);
  await editSheet.getByRole("button", { name: "Save goal" }).click();
  await employee.page.getByRole("button", { name: "Submit plan" }).click();
  await employee.page.getByRole("dialog").getByRole("button", { name: "Submit plan" }).click();

  await manager.page.reload();
  await manager.page.getByRole("link", { name: /Pooja Deshmukh/ }).click();
  const resubmitted = manager.page.locator(".review-goal").filter({ hasText: goalTitle }).first();
  await resubmitted.getByRole("button", { name: "Approve goal" }).click();
  await manager.page.getByRole("dialog").getByRole("button", { name: "Approve goal" }).click();
  await manager.page.getByText("Goal approved", { exact: true }).waitFor();

  const admin = await signIn("admin@atomberg.local");
  await admin.page.goto(`${base}/admin/unlocks`);
  const unlocked = admin.page.locator(".record").filter({ hasText: "Pooja Deshmukh" }).filter({ hasText: goalTitle }).first();
  await unlocked.getByRole("button", { name: "Unlock goal" }).click();
  await admin.page.getByRole("dialog").screenshot({ path: "docs/ui/after/unlock-dialog-light-1280.png" });
  await admin.page.getByRole("dialog").getByLabel("Reason").fill("The calibration source changed after approval; revise the target.");
  await admin.page.getByRole("dialog").getByRole("button", { name: "Unlock for rework" }).click();
  await admin.page.getByText("Goal unlocked for rework", { exact: true }).waitFor();

  await admin.page.goto(`${base}/reports`);
  await admin.page.getByRole("combobox", { name: "Quarter" }).selectOption("Q1");
  assert.ok(admin.page.url().includes("quarter=Q1"));
  const download = admin.page.waitForEvent("download");
  await admin.page.getByRole("button", { name: "Export CSV" }).click();
  assert.match((await download).suggestedFilename(), /\.csv$/);
  assert.deepEqual(errors, []);
  console.log("Employee create/rebalance/submit, manager send-back/approve, admin unlock, report filter/export: passed.");
  await Promise.all([employee.context.close(), manager.context.close(), admin.context.close()]);
} finally {
  await browser.close();
}
