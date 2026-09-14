import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.TEST_CHROME_PATH,
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const lead = {
    phone: "5511999999999",
    profession: "Tenho uma empresa",
    internet_sales: "Sim, serviços",
    best_month: "Até R$5.000",
    reason: "Quero criar meu primeiro SaaS",
    created_at: "2026-09-14T16:41:33Z",
  };
  let fail = true;
  await page.route("**/api/admin/session", (r) =>
    r.fulfill({ json: { authenticated: true } }),
  );
  await page.route("**/api/admin/leads*", (r) => {
    const cursor = new URL(r.request().url()).searchParams.get("cursor");
    if (cursor && fail) {
      fail = false;
      return r.fulfill({ status: 503, json: { error: "test" } });
    }
    if (cursor) assert.equal(cursor, "page2");
    return r.fulfill({
      json: {
        leads: cursor
          ? [{ ...lead, id: "51", name: "Pessoa 51" }]
          : Array.from({ length: 50 }, (_, i) => ({
              ...lead,
              id: String(i + 1),
              name: `Pessoa ${i + 1}`,
            })),
        nextCursor: cursor ? null : "page2",
        publicKey: "",
      },
    });
  });
  await page.goto(
    (process.env.TEST_BASE_URL || "http://localhost:3051") + "/painel",
  );
  const more = page.getByRole("button", { name: "Carregar mais", exact: true });
  await more.waitFor();
  assert.equal(await page.locator(".lead-card").count(), 50);
  await more.click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent === "Carregar mais" && !b.disabled,
    ),
  );
  assert.equal(await page.locator(".lead-card").count(), 50);
  await more.click();
  await page.getByText("51 cadastros exibidos.", { exact: false }).waitFor();
  assert.equal(await page.locator(".lead-card").count(), 51);
  assert.equal(await more.count(), 0);
  await page.getByRole("heading", { name: "Pessoa 51", exact: true }).click();
  assert.equal(
    await page.locator(".lead-card").last().locator("dd").count(),
    6,
  );
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await more.waitFor();
  assert.equal(await page.locator(".lead-card").count(), 50);
  console.log(
    "PASS: pagination appends, error preserves records and permits retry, final page, full answers, refresh resets.",
  );
} finally {
  await browser.close();
}
