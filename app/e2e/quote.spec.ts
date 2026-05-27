import { test, expect } from "@playwright/test";

test("create catalog, build quote, view share URL", async ({ page }) => {
  // Assumes DATABASE_URL is configured and migrations have been applied.
  await page.goto("/");

  await page.getByRole("link", { name: "Catalog" }).click();
  await page.getByRole("link", { name: "New product" }).click();

  await page.getByLabel("Product name").fill("Analytics Suite");
  await page.getByRole("button", { name: "Create" }).click();

  // Add tiers
  await page.getByPlaceholder("Growth").fill("Growth");
  await page.getByPlaceholder("50").fill("50");
  await page.getByRole("button", { name: "Add tier" }).click();

  // Add feature
  await page.getByPlaceholder("Single Sign-On (SSO)").fill("Single Sign-On (SSO)");
  await page.getByRole("button", { name: "Add feature" }).click();

  // Set the feature as an add-on for Growth
  const modeForm = page.locator("form", { has: page.locator('select[name="mode"]') }).first();
  await modeForm.locator('select[name="mode"]').selectOption("addon");
  await modeForm.getByRole("button", { name: "Save" }).click();

  // Configure add-on pricing
  await page.locator('select[name="model"]').first().selectOption("fixed_per_month");
  await page.locator('input[name="fixedPricePerMonthUsd"]').first().fill("200");
  await page.getByRole("button", { name: "Save pricing" }).click();

  // Build quote
  await page.getByRole("link", { name: "New quote" }).click();

  await page.getByLabel("Quote name").fill("Acme Corp - Q3 2026 Proposal");
  await page.getByLabel("Customer").fill("Acme Corporation");
  await page.getByLabel("Seats").fill("25");
  await page.getByLabel("Term").selectOption("annual");

  await page.getByRole("checkbox").first().check();

  await page.getByRole("button", { name: "Save quote" }).click();

  await expect(page).toHaveURL(/\/quotes\//);
  await expect(page.getByRole("heading", { name: "Acme Corp - Q3 2026 Proposal" })).toBeVisible();
  await expect(page.getByText("Acme Corporation")).toBeVisible();
  await expect(page.getByText("Cost breakdown")).toBeVisible();
});

