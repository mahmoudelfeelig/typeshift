import { expect, test } from "@playwright/test";

test("deep-linked game mode opens playable typing surface", async ({ page }) => {
  await page.goto("/games/meteor");
  await expect(page.getByRole("link", { name: /TypeShift/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Meteor/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Start run/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Meteor/i })).toHaveAttribute("aria-current", "page");
});

test("privacy controls can be saved without analytics", async ({ page }) => {
  await page.goto("/privacy");
  await page.getByRole("button", { name: /Essentials only/i }).first().click();
  await expect(page.getByText(/Analytics off/i)).toBeVisible();
});

test("account screen exposes auth and data-rights controls", async ({ page }) => {
  await page.goto("/profile/account");
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Export account data/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Delete account/i })).toBeVisible();
});

test("replay sharing and webhook controls are available in profile sharing", async ({ page }) => {
  await page.goto("/profile/sharing");
  await expect(page.getByRole("heading", { name: /Replay Share/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Share selected replay/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Add webhook/i })).toBeVisible();
});

test("mobile layout keeps game tabs reachable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only layout check");
  await page.goto("/games/rhythm-chart");
  await expect(page.getByLabel("Game modes")).toBeVisible();
  await expect(page.getByRole("link", { name: /Rhythm Chart/i })).toHaveAttribute("aria-current", "page");
});
