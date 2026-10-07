import { test, expect } from "./fixtures";

test("public-auth: landing navigation and invalid login remain usable", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.method());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find your next way forward." })).toBeVisible();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("smoke@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Password must be between 8 and 128 characters.",
  );
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
  await page.getByRole("link", { name: "Get started", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(5);
  await expect(page.getByLabel("First name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Last name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Email", { exact: false })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Phone number")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Password")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Enter your first name.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeEnabled();
  expect(mutations, "Invalid registration must not create backend data").toEqual([]);
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("session-guard: signed-out protected navigation returns to login", async ({ page }) => {
  for (const route of ["/dashboard", "/profile", "/marketer/services", "/admin/users"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  }
});
