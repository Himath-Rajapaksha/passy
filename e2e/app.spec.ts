import { expect, test } from "@playwright/test";

const OUTPUT_PATTERN = /^[A-Za-z0-9!@#$%^&*()\-_=+?.]+$/;

test("phrase to password flow", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel(/phrase you'll remember/i)
    .fill("my dog loves bacon");
  await expect(page.getByTestId("password-output")).toHaveText(OUTPUT_PATTERN);
  await expect(
    page.getByText(/memorable is not the same as strong/i),
  ).toBeVisible();
  await expect(page.getByText(/^lowercase/i)).toBeVisible();
});

test("same inputs reproduce the same password after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel(/phrase you'll remember/i).fill("cat");
  await page.getByLabel(/site or app/i).fill("news");
  const output = page.getByTestId("password-output");
  await expect(output).toHaveText(OUTPUT_PATTERN);
  const first = await output.textContent();

  await page.reload();
  await page.getByLabel(/phrase you'll remember/i).fill("cat");
  await page.getByLabel(/site or app/i).fill("news");
  await expect(output).toHaveText(first ?? "");
});

test("copies the generated password", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page
    .getByLabel(/phrase you'll remember/i)
    .fill("blue fox drinks coffee");
  const output = page.getByTestId("password-output");
  await expect(output).toHaveText(OUTPUT_PATTERN);
  const password = (await output.textContent()) ?? "";

  await page.getByRole("button", { name: /copy password/i }).click();
  await expect(page.getByText(/password copied/i)).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe(password);
});

test("advanced options change the output", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/phrase you'll remember/i).fill("password");
  const output = page.getByTestId("password-output");
  await expect(output).toHaveText(OUTPUT_PATTERN);
  const noSite = (await output.textContent()) ?? "";

  await page.getByLabel(/site or app/i).fill("forum");
  await expect(output).not.toHaveText(noSite);
  const withSite = (await output.textContent()) ?? "";

  await page.getByRole("button", { name: /advanced options/i }).click();
  await page.getByLabel(/extra secret/i).fill("Blue Fox");
  await expect(output).not.toHaveText(withSite);

  await page.getByLabel(/separator/i).selectOption("_");
  await expect(output).toContainText("_");

  await page.getByLabel(/session-random/i).check();
  await expect(page.getByText(/not reproducible/i)).toBeVisible();
});

test("random mode generates and copies a password", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("tab", { name: /random/i }).click();
  const output = page.getByTestId("random-output");
  await expect(output).toHaveText(
    /^[A-Za-z0-9!@#$%^&*()\-_=+?.]{20}$/,
  );
  const password = (await output.textContent()) ?? "";

  await page.getByRole("button", { name: /copy password/i }).click();
  await expect(page.getByText(/password copied/i)).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe(password);
});

test("prevents disabling the last character class", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /random/i }).click();
  await expect(page.getByTestId("random-output")).toBeVisible();
  await page.getByLabel(/lowercase/i).uncheck();
  await page.getByLabel(/uppercase/i).uncheck();
  await page.getByLabel(/digits/i).uncheck();
  await expect(page.getByLabel(/symbols/i)).toBeDisabled();
});

test("mobile layout has no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page
    .getByLabel(/phrase you'll remember/i)
    .fill("blue fox drinks coffee");
  await expect(page.getByTestId("password-output")).toHaveText(OUTPUT_PATTERN);

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("keeps the phrase out of network requests", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));

  await page.goto("/");
  const phrase = "blue fox drinks coffee";
  await page.getByLabel(/phrase you'll remember/i).fill(phrase);
  await expect(page.getByTestId("password-output")).toHaveText(OUTPUT_PATTERN);
  await page.waitForTimeout(500);

  const foreign = urls.filter((url) => {
    if (url.startsWith("data:") || url.startsWith("blob:")) return false;
    const target = new URL(url);
    return target.hostname !== "127.0.0.1" || target.port !== "4173";
  });
  expect(foreign).toEqual([]);
  expect(
    urls.filter((url) => decodeURIComponent(url).includes(phrase)),
  ).toEqual([]);
});

test("keyboard flow moves between modes", async ({ page }) => {
  await page.goto("/");
  const phraseTab = page.getByRole("tab", { name: /phrase/i });
  await phraseTab.focus();
  await page.keyboard.press("ArrowRight");
  const randomTab = page.getByRole("tab", { name: /random/i });
  await expect(randomTab).toBeFocused();
  await expect(randomTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("random-output")).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(phraseTab).toBeFocused();
  await expect(phraseTab).toHaveAttribute("aria-selected", "true");
  await page.getByLabel(/phrase you'll remember/i).fill("password");
  await expect(page.getByTestId("password-output")).toHaveText(OUTPUT_PATTERN);
});
