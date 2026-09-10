import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.TEST_CHROME_PATH,
});
const page = await browser.newPage();
page.setDefaultTimeout(10000);
await mkdir("test-results", { recursive: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
await page.goto(`${base}/?utm_source=qa&utm_campaign=sala404`);
await page.getByRole("button", { name: "Só essenciais" }).click();
for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [390, 844],
  [393, 852],
  [430, 932],
]) {
  await page.setViewportSize({ width, height });
  await page.screenshot({ path: `test-results/hero-${width}.png` });
  await page.screenshot({ path: `test-results/${width}.png`, fullPage: true });
  const dimensions = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    heroBottom: document.querySelector(".hero").getBoundingClientRect().bottom,
    ctaBottom: document.querySelector(".hero>.button").getBoundingClientRect()
      .bottom,
    headline: parseFloat(
      getComputedStyle(document.querySelector("h1")).fontSize,
    ),
    brand: parseFloat(
      getComputedStyle(document.querySelector(".room")).fontSize,
    ),
    dark: document.querySelectorAll("section.dark").length,
  }));
  assert.equal(dimensions.overflow, false, `horizontal overflow at ${width}`);
  assert.equal(dimensions.dark, 1);
  assert.ok(
    dimensions.heroBottom <= height,
    `hero below fold at ${width}: ${dimensions.heroBottom}`,
  );
  assert.ok(dimensions.ctaBottom <= height, `CTA below fold at ${width}`);
  assert.ok(dimensions.headline <= (width > 760 ? 68 : 46));
  assert.ok(dimensions.brand <= (width > 760 ? 42 : 30));
  console.log(width, height, dimensions);
}
await page.setViewportSize({ width: 390, height: 844 });
await page.locator(".header-entry").click();
for (let i = 0; i < 4; i++) {
  await page.locator(".quiz-option").first().click();
  await page
    .locator(".quiz-top")
    .getByText(`${i + 2} DE 6`, { exact: true })
    .waitFor();
}
await page.getByLabel("Nome e sobrenome").fill("Pessoa Teste");
await page.getByRole("button", { name: /^CONTINUAR/ }).click();
await page.getByLabel("WhatsApp com DDD").fill("11999991234");
assert.equal(
  await page.getByLabel("WhatsApp com DDD").inputValue(),
  "(11) 99999-1234",
);
await page.locator(".consent input").check();
// Simulate the failure locally so this regression test never writes to a live database.
await page.route("**/api/leads", (route) =>
  route.fulfill({
    status: 503,
    json: { error: "A entrada está temporariamente indisponível." },
  }),
);
await page.getByRole("button", { name: /^QUERO ENTRAR NA SALA 404/ }).click();
await page.locator(".error").waitFor();
assert.match(
  await page.locator(".error").innerText(),
  /temporariamente indisponível/,
);
assert.equal(
  await page.getByLabel("WhatsApp com DDD").inputValue(),
  "(11) 99999-1234",
);
await page.unroute("**/api/leads");
// Local mock only: proves success UI without creating a real lead or message.
await page.route("**/api/leads", async (route) => {
  const payload = route.request().postDataJSON();
  assert.equal(payload.attribution.utm_source, "qa");
  assert.equal(payload.marketing_consent, false);
  assert.equal(payload.answers.length, 4);
  await route.fulfill({
    json: {
      whatsappUrl: "https://chat.whatsapp.com/LOCAL_TEST_ONLY",
      isNew: true,
      eventId: "local-test",
    },
  });
});
await page.getByRole("button", { name: /^QUERO ENTRAR NA SALA 404/ }).click();
await page.getByRole("heading", { name: "PORTA LIBERADA." }).waitFor();
assert.equal(
  await page
    .getByRole("link", { name: "ENTRAR NO WHATSAPP" })
    .getAttribute("href"),
  "https://chat.whatsapp.com/LOCAL_TEST_ONLY",
);
await page.screenshot({ path: "test-results/success-mobile.png" });
assert.deepEqual(errors, []);
const trackingPage = await browser.newPage();
await trackingPage.route("https://connect.facebook.net/**", (route) =>
  route.fulfill({
    contentType: "application/javascript",
    body: "/* local tracking test */",
  }),
);
await trackingPage.goto(base);
await trackingPage
  .getByRole("button", { name: "Aceitar", exact: true })
  .click();
await trackingPage.locator(".hero>.button").click();
await trackingPage.locator(".header-entry").click();
await trackingPage.locator(".quiz-option").first().click();
await trackingPage
  .locator(".quiz-top")
  .getByText("2 DE 6", { exact: true })
  .waitFor();
const events = await trackingPage.evaluate(() => ({
  events: window.dataLayer?.map((x) => x.event),
  pixel: window.fbq?.queue,
}));
for (const event of ["view_page", "click_enter", "quiz_started", "quiz_step_1"])
  assert.ok(events.events.includes(event), event);
assert.ok(
  events.pixel.some((args) => args[0] === "track" && args[1] === "PageView"),
);
await browser.close();
console.log(
  "PASS: five viewports and first fold, quiz, mask, attribution, mocked failure/success and local Pixel events; no real leads or messages.",
);
