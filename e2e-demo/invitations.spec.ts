import { expect, test, type Page } from "@playwright/test";

const diagnostics = new WeakMap<Page, { errors: string[]; backendRequests: string[] }>();

test.beforeEach(({ page }) => {
  const errors: string[] = [];
  const backendRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/api/")) backendRequests.push(request.url());
  });
  diagnostics.set(page, { errors, backendRequests });
});

test.afterEach(({ page }) => {
  expect(diagnostics.get(page)?.errors).toEqual([]);
  expect(diagnostics.get(page)?.backendRequests).toEqual([]);
});

test("invitation to offer journey, themes, reload, and final withdrawal", async ({
  page,
}, testInfo) => {
  await page.goto("/demo/marketer?view=invitations");
  await expect(page.getByRole("heading", { name: "Direct Invitations" })).toBeVisible();
  const card = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Campus Sustainability Campaign", exact: true }),
  });
  await expect(card.locator(".ji-sent-time")).toContainText("Invited");
  await expect(card.locator(".ji-sent-time")).toHaveAttribute("data-status", "Pending");
  await page.screenshot({ path: testInfo.outputPath("invitations-light.png"), fullPage: true });
  await card.getByRole("button", { name: "Accept Request" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("accept-confirmation.png") });
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Responded (5)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await card.getByRole("button", { name: "Submit Offer" }).click();
  await expect(page.getByRole("heading", { name: "Submit Your Offer" })).toBeFocused();
  await page.getByLabel("Proposed Price (THB) *").fill("9000");
  await page.getByLabel("Estimated Delivery *").fill("2026-10-25");
  await page
    .getByLabel("Message to Creator (Optional)")
    .fill("Faculty LINE groups and campus outreach.");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("offer-light.png"), fullPage: true });
  await page.getByRole("button", { name: "Submit Offer", exact: true }).click();
  await expect(page.getByText(/Offer submitted successfully!/)).toBeVisible();
  const toast = page.locator(".ji-toast");
  await expect(page.getByRole("heading", { name: "Direct Invitations" })).toBeFocused();
  await expect(toast).toContainText("฿9,000");
  await expect(card.locator(".ji-sent-time")).toHaveAttribute("data-status", "Accepted");
  await toast.hover();
  await page.screenshot({
    path: testInfo.outputPath("submission-toast-light.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /dark/i }).click();
  await page.screenshot({ path: testInfo.outputPath("submission-toast-dark.png"), fullPage: true });
  const toastBounds = await toast.boundingBox();
  expect(toastBounds!.x).toBeGreaterThanOrEqual(0);
  expect(toastBounds!.x + toastBounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect(toast).toBeHidden({ timeout: 8000 });
  await page.getByRole("button", { name: /light/i }).click();
  await page.reload();
  await card.getByRole("button", { name: "View Offer" }).click();
  await expect(page.getByLabel("Proposed Price (THB) *")).toHaveValue("9000.00");
  await page.getByRole("button", { name: /dark/i }).click();
  await expect(page.locator(".marketer-theme")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: testInfo.outputPath("offer-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "Withdraw Offer", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Withdraw Offer", exact: true })
    .click();
  await expect(card.getByText("Offer withdrawn", { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "View Offer" }).click();
  await expect(page.getByText("Offer withdrawn", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit Offer", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Withdraw Offer", exact: true })).toHaveCount(0);
  const footer = page.locator(".ji-actions");
  await expect(footer.getByRole("button")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
  await footer.getByRole("button", { name: "Back to Invitations", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Responded (5)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("direct link and browser back preserve the correct screen", async ({ page }) => {
  await page.goto("/demo/marketer?view=invitations&tab=responded");
  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: "Campus Community Research" }) });
  await card.getByRole("button", { name: "Submit Offer" }).click();
  await expect(page.getByRole("heading", { name: "Submit Your Offer" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Campus Community Research" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Direct Invitations" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Submit Your Offer" })).toBeVisible();
  await page.goto("/demo/marketer?view=offer&requestId=missing");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be found");
  await page.getByRole("button", { name: "Back to invitations", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Direct Invitations" })).toBeVisible();
});

test("clearing an explicit Responded link selects Pending consistently across navigation and reload", async ({
  page,
}) => {
  await page.goto("/demo/marketer?view=invitations&tab=responded");
  await expect(page.getByRole("tab", { name: "Responded (4)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("button", { name: "Back to overview", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Invitations", exact: true })
    .filter({ visible: true })
    .click();
  expect(new URL(page.url()).searchParams.has("tab")).toBe(false);
  await expect(page.getByRole("tab", { name: "Pending (2)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("tab", { name: "Responded (4)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.goForward();
  await page.goForward();
  await expect(page.getByRole("tab", { name: "Pending (2)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("tab", { name: "Pending (2)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("storage recovery preserves and persists responses made during blocked startup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const key = "cuways-job-invitations-demo-v1";
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    let readBlocked = true;
    let writeBlocked = true;
    Storage.prototype.getItem = function (name) {
      if (this === sessionStorage && name === key && readBlocked) throw new Error("Reads blocked");
      return getItem.call(this, name);
    };
    Storage.prototype.setItem = function (name, value) {
      if (this === sessionStorage && name === key && writeBlocked)
        throw new Error("Writes blocked");
      return setItem.call(this, name, value);
    };
    window.addEventListener("test-demo-storage-access", (event) => {
      const access = (event as CustomEvent<{ readBlocked: boolean; writeBlocked: boolean }>).detail;
      readBlocked = access.readBlocked;
      writeBlocked = access.writeBlocked;
      window.dispatchEvent(new StorageEvent("storage", { key }));
    });
  });
  await page.goto("/demo/marketer?view=invitations");
  const card = page.locator('[data-slot="card"]').filter({
    has: page.getByRole("heading", { name: "Campus Sustainability Campaign", exact: true }),
  });
  await card.getByRole("button", { name: "Accept Request" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Responded (5)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("test-demo-storage-access", {
        detail: { readBlocked: false, writeBlocked: true },
      }),
    );
  });
  await expect(page.getByRole("tab", { name: "Responded (5)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(card.getByRole("button", { name: "Submit Offer" })).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("cuways-job-invitations-demo-v1")),
  ).toBeNull();
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("test-demo-storage-access", {
        detail: { readBlocked: false, writeBlocked: false },
      }),
    );
  });
  expect(
    await page.evaluate(() => {
      const state = JSON.parse(sessionStorage.getItem("cuways-job-invitations-demo-v1")!);
      return state.invitations.find((entry: { id: string }) => entry.id === "request-041").status;
    }),
  ).toBe("Accepted");
  await page.reload();
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("test-demo-storage-access", {
        detail: { readBlocked: false, writeBlocked: false },
      }),
    );
  });
  await expect(page.getByRole("tab", { name: "Responded (5)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(card.getByRole("button", { name: "Submit Offer" })).toBeVisible();
});
