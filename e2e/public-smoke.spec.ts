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
