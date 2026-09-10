import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://localhost:3030";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.TEST_CHROME_PATH,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const endpoint = "https://web.push.apple.com/sala404-local-integration-only";
try {
  const unauth = await page.request.get(base + "/api/admin/leads");
  assert.equal(unauth.status(), 401);
  assert.equal(
    (await page.request.post(base + "/api/admin/push", { data: {} })).status(),
    401,
  );
  await page.goto(base + "/painel");
  await page.getByLabel("Senha do painel").fill(process.env.ADMIN_PASSWORD);
  page.on("response", async (r) => {
    if (r.url().includes("/api/admin/"))
      console.log(new URL(r.url()).pathname, r.status());
  });
  await page.getByRole("button", { name: "ENTRAR →", exact: true }).click();
  await page
    .getByRole("heading", { name: "Últimos cadastros" })
    .waitFor({ timeout: 15000 })
    .catch(async (e) => {
      console.log(await page.locator(".panel-message").allTextContents());
      throw e;
    });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await mkdir("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/panel-iphone.png",
    fullPage: true,
  });
  const manifest = await (
    await page.request.get(base + "/painel/manifest.webmanifest")
  ).json();
  assert.equal(manifest.start_url, "/painel");
  assert.equal(manifest.display, "standalone");
  const icon = await page.request.get(base + "/painel/icon/180");
  assert.equal(icon.status(), 200);
  assert.match(icon.headers()["content-type"], /image\/png/);
  const sub = {
    endpoint,
    keys: { p256dh: "B".repeat(87), auth: "A".repeat(22) },
  };
  const post = (action, subscription = sub, origin = base) =>
    page.request.post(base + "/api/admin/push", {
      headers: { origin },
      data: { action, subscription },
    });
  assert.equal(
    (await post("subscribe", sub, "https://evil.test")).status(),
    403,
  );
  assert.equal(
    (
      await post("subscribe", { ...sub, endpoint: "https://127.0.0.1/private" })
    ).status(),
    400,
  );
  assert.equal((await post("subscribe")).status(), 200);
  const saved = await db
    .from("sala404_push_subscriptions")
    .select("endpoint")
    .eq("endpoint", endpoint)
    .single();
  assert.equal(saved.error, null);
  assert.equal((await post("remove")).status(), 200);
  await page
    .getByRole("button", { name: "Sair do painel", exact: true })
    .click();
  await page.getByLabel("Senha do painel").waitFor();
  assert.equal(
    (await page.request.get(base + "/api/admin/leads")).status(),
    401,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: login/logout, protected data, mobile panel, manifest/PNG icon, CSRF/SSRF rejection and real subscription save/remove; no push sent.",
  );
} finally {
  await db.from("sala404_push_subscriptions").delete().eq("endpoint", endpoint);
  await browser.close();
}
