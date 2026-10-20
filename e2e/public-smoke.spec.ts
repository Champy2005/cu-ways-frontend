import { test, expect } from "./fixtures";

test("public-auth: root redirect and invalid login remain usable", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.method());
  });
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("smoke@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Incorrect email or password. Please try again.",
  );
  // Per the Figma error state, Sign in stays greyed out until the user edits a field.
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeDisabled();
  await page.getByLabel("Password", { exact: true }).fill("short2");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(/\/login$/);
  expect(mutations, "Invalid credentials must not send an API mutation").toEqual([]);
});

test("public-auth: registration exposes field errors without creating an account", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.method());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Create one", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Tell us about yourself." })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  // Step 1 of the US-001 wizard: every required field, the role and both consents report errors.
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(8);
  await expect(page.getByLabel("First name *", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Last name *", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Email *", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Password *", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByText("First name is required.", { exact: true })).toBeVisible();
  // As designed, Next greys out while the step shows errors.
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  expect(mutations, "Invalid registration must not create backend data").toEqual([]);
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("session-guard: signed-out protected navigation returns to login", async ({ page }) => {
  for (const route of ["/dashboard", "/profile", "/marketer/services", "/admin/users"]) {
    await page.goto(route);
    await expect(page).toHaveURL(`/login?next=${encodeURIComponent(route)}`);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  }
});

test("registration uses consistent mobile gutters through the marketer steps", async ({
  page,
}, testInfo) => {
  for (const width of [320, 375, 430]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/register");
    const form = await page.getByRole("form", { name: "Create your account" }).boundingBox();
    const field = await page.getByLabel("First name *", { exact: true }).boundingBox();
    expect(
      form && Math.abs(form.x - 16) < 1 && Math.abs(form.width - (width - 32)) < 1,
    ).toBeTruthy();
    expect(
      field &&
        form &&
        Math.abs(field.x - form.x - 16) < 1 &&
        Math.abs(field.width - (form.width - 32)) < 1,
    ).toBeTruthy();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await page.screenshot({ path: testInfo.outputPath("registration-account.png"), fullPage: true });
  await page.getByLabel("First name *", { exact: true }).fill("Mobile");
  await page.getByLabel("Last name *", { exact: true }).fill("Preview");
  await page.getByLabel("Email *", { exact: true }).fill("preview@example.invalid");
  await page.getByLabel("Password *", { exact: true }).fill("preview-password");
  await page.getByLabel("Password confirmation *", { exact: true }).fill("preview-password");
  await page.getByRole("radio", { name: "Marketer", exact: true }).click();
  await page.getByRole("checkbox", { name: "Accept Terms of Service" }).check();
  await page.getByRole("checkbox", { name: "Accept Privacy Policy" }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Phone Number", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("registration-contact.png"), fullPage: true });
  await page.getByLabel("Phone Number", { exact: true }).fill("0812345678");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Bio", { exact: true })).toBeVisible();
  const field = await page.getByLabel("Bio", { exact: true }).boundingBox();
  expect(field && Math.abs(field.width - 311) < 1).toBeTruthy();
  await page.screenshot({
    path: testInfo.outputPath("registration-experience.png"),
    fullPage: true,
  });
});
