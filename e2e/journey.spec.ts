import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("complete planning journey with save, revision and validation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan your occasion" }).click();
  await page
    .getByLabel("Event name", { exact: true })
    .fill("Community garden day");
  await page.getByLabel("Location or venue").fill("Example City");
  await page.getByLabel("Number of guests").fill("60");
  await page.getByLabel("Total budget", { exact: true }).fill("120000");
  await page
    .getByRole("button", { name: "Create my plan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Community garden day", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Budget", exact: true }).click();
  await expect(page.getByTestId("remaining-budget")).toHaveText("₹0.00");
  await page
    .getByRole("button", { name: "Timeline & checklist", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: /Confirm the event brief and priorities/ })
    .check();
  await expect(
    page.getByRole("checkbox", {
      name: /Confirm the event brief and priorities/,
    }),
  ).toBeChecked();
  await page.getByRole("button", { name: "What-if", exact: true }).click();
  await page.getByLabel("Number of guests").fill("0");
  await page.getByRole("button", { name: "Compare this scenario" }).click();
  await expect(page.getByLabel("Number of guests")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Number of guests").fill("90");
  await page.getByLabel("Total budget", { exact: true }).fill("60000");
  await page.getByRole("button", { name: "Compare this scenario" }).click();
  await expect(
    page.getByRole("region", { name: "Scenario comparison" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Approve & apply scenario" }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: /I understand this plan is over budget/ })
    .check();
  await page.getByRole("button", { name: "Approve & apply scenario" }).click();
  await expect(page.getByText("90 guests", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save on this device" }).click();
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  await page.reload();
  await page.getByRole("button", { name: "My occasions" }).click();
  await page.getByRole("button", { name: "Open plan" }).click();
  await expect(page.getByText("90 guests", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Revisions (1)" }).click();
  await expect(
    page.getByRole("heading", { name: "Before scenario change" }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^planora-.*\.json$/);
});
test("landing and workspace pass automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Explore a sample" }).click();
  await expect(
    page.getByRole("heading", { name: "The garden gathering", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A day with your signature on it." }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Timeline & checklist", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your path to the occasion." }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("vendor quotations are user-entered and explicitly applied", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore a sample" }).click();
  await page.getByRole("button", { name: "Vendors", exact: true }).click();
  const card = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Venue", exact: true }) });
  await card.getByLabel("Vendor name").fill("Sample Venue");
  await card.getByLabel("Quotation (INR)").fill("50000");
  await card.getByLabel("Booking status").selectOption("booked");
  await card.getByRole("button", { name: "Update vendor" }).click();
  await expect(
    card.getByText("Vendor details updated in this plan.", { exact: false }),
  ).toBeVisible();
  await card
    .getByRole("button", { name: /Replace linked budget allocation/ })
    .click();
  await page.getByRole("button", { name: "Budget", exact: true }).click();
  const row = page
    .locator("form")
    .filter({ has: page.getByText("Venue & setting", { exact: true }) });
  await expect(row.getByLabel("Amount (INR)")).toHaveValue("50000.00");
  await expect(row.getByLabel("Cost basis")).toHaveValue("quote");
});
