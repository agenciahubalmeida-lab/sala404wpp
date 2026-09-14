import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.TEST_CHROME_PATH,
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const lead = {
    id: "test",
    name: "Pessoa de teste",
    phone: "5511999999999",
    profession: "Tenho uma empresa",
    internet_sales: "Sim, serviços",
    best_month: "Até R$5.000",
    reason: "Quero criar meu primeiro SaaS",
    created_at: "2026-09-14T16:41:33Z",
  };
  await page.route("**/api/admin/session", (r) =>
    r.fulfill({ json: { authenticated: true } }),
  );
  await page.route("**/api/admin/leads", (r) =>
    r.fulfill({
      json: {
        leads: [
          lead,
          { ...lead, id: "second", name: "Outra pessoa", best_month: null },
        ],
        publicKey: "",
      },
    }),
  );
  await page.goto(
    (process.env.TEST_BASE_URL || "http://localhost:3050") + "/painel",
  );
  const first = page.locator(".lead-details").first();
  await first.locator("summary").waitFor();
  assert.equal(await first.evaluate((el) => el.open), false);
  await page.getByRole("heading", { name: lead.name, exact: true }).click();
  assert.deepEqual(await first.locator("dd").allTextContents(), [
    lead.profession,
    lead.internet_sales,
    lead.best_month,
    lead.reason,
    lead.name,
    "+55 (11) 99999-9999",
  ]);
  assert.equal(await first.locator("dt").count(), 6);
  assert.match(
    await first.locator("dt").nth(1).innerText(),
    /VENDEU ALGUMA COISA/,
  );
  assert.match(await first.locator("dt").nth(2).innerText(), /MELHOR MÊS/);
  assert.equal(
    await page
      .locator(".lead-details")
      .nth(1)
      .evaluate((el) => el.open),
    false,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await first.locator("summary").click();
  await first.locator("summary").focus();
  await page.keyboard.press("Enter");
  assert.equal(await first.evaluate((el) => el.open), true);
  await page.locator(".lead-details").nth(1).locator("summary").click();
  assert.equal(
    await page.locator(".lead-details").nth(1).locator("dd").nth(2).innerText(),
    "Não informado",
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  console.log(
    "PASS: six answers, field mapping, name click, keyboard, independent cards, missing answer, mobile and desktop width",
  );
} finally {
  await browser.close();
}
