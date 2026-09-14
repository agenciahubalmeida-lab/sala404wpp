import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import webpush from "web-push";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.TEST_CHROME_PATH,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const base = process.env.TEST_BASE_URL || "http://localhost:3040";
const key = webpush.generateVAPIDKeys().publicKey;
let saved = 0;
await page.route("**/api/admin/session", (r) =>
  r.fulfill({ json: { authenticated: true } }),
);
await page.route("**/api/admin/leads", (r) =>
  r.fulfill({ json: { leads: [], publicKey: key } }),
);
await page.route("**/api/admin/push", (r) => {
  assert.equal(r.request().postDataJSON().action, "subscribe");
  saved++;
  return r.fulfill({ json: { ok: true } });
});
try {
  await page.goto(base + "/painel");
  await page.getByRole("heading", { name: "Avisos no iPhone" }).waitFor();
  await page.waitForFunction(
    () => document.querySelector(".panel-actions .button")?.disabled === false,
  );
  const worker = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration("/painel");
    return {
      scope: r?.scope,
      script: r?.active?.scriptURL,
      state: r?.active?.state,
    };
  });
  assert.equal(worker.scope, base + "/painel");
  assert.equal(worker.script, base + "/sw.js");
  assert.equal(worker.state, "activated");
  // Confirm the previous path really violated the allowed scope.
  const old = await page.evaluate(async () => {
    try {
      await navigator.serviceWorker.register("/painel/sw.js", {
        scope: "/painel",
      });
      return "unexpected success";
    } catch (e) {
      return e.name;
    }
  });
  assert.equal(old, "SecurityError");
  await page.evaluate(() => {
    Notification.requestPermission = () => Promise.resolve("granted");
    PushManager.prototype.subscribe = () =>
      Promise.resolve({
        toJSON: () => ({
          endpoint: "https://web.push.apple.com/test-only",
          keys: { p256dh: "B".repeat(87), auth: "A".repeat(22) },
        }),
      });
  });
  await page
    .getByRole("button", { name: "ATIVAR NOTIFICAÇÕES", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enviar teste", exact: true })
    .waitFor();
  assert.equal(saved, 1);
  assert.equal(
    await page
      .getByRole("button", { name: "Atualizar", exact: true })
      .isEnabled(),
    true,
  );
  assert.match(
    await page.locator(".panel-message").innerText(),
    /Notificações ativadas/,
  );
  console.log(
    "PASS: old scope rejected, new worker active at /painel, mocked activation saves and reveals test button; no device enrolled.",
  );
} finally {
  await browser.close();
}
