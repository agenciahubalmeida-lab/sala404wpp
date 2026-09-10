// Opt-in test against the configured Supabase. Never enables external deliveries.
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
if (process.env.RUN_SUPABASE_TESTS !== "yes")
  throw new Error("Set RUN_SUPABASE_TESTS=yes explicitly.");
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const port = 3020;
const base = `http://localhost:${port}`;
const phone = "5511900000000";
const ip = "192.0.2.44";
const bucket = createHash("sha256").update(ip).digest("hex");
const existing = await db.from("sala404_leads").select("id").eq("phone", phone);
assert.equal(existing.error, null);
assert.equal(
  existing.data.length,
  0,
  "Test phone already present; do not overwrite.",
);
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--port", String(port)],
  {
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      META_CAPI_ACCESS_TOKEN: "",
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_CHAT_ID: "",
      NOTIFICATION_WEBHOOK_URL: "",
      NOTIFICATION_WEBHOOK_SECRET: "",
    },
  },
);
let createdId;
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      ready = (await fetch(base)).ok;
    } catch {}
    if (ready) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready, "Test server unavailable");
  const payload = {
    answers: [
      "Tenho uma empresa",
      "Sim, serviços",
      "Até R$5.000",
      "Só quero acompanhar os bastidores",
    ],
    name: "Teste Integração SALA",
    phone: "(11) 90000-0000",
    consent: true,
    marketing_consent: false,
    attribution: {
      source_url: `${base}/?utm_source=integration`,
      utm_source: "integration",
    },
    website: "",
  };
  const send = () =>
    fetch(`${base}/api/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: base,
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(payload),
    });
  const first = await send();
  assert.equal(first.status, 200);
  const result = await first.json();
  createdId = result.eventId;
  assert.ok(createdId);
  assert.equal(result.isNew, true);
  assert.match(
    result.whatsappUrl,
    /chat\.whatsapp\.com\/KkC7yZ1CBrtH4X46HGMPdO/,
  );
  const duplicate = await send();
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).isNew, false);
  let row;
  for (let i = 0; i < 40; i++) {
    const response = await db
      .from("sala404_leads")
      .select(
        "id,name,phone,utm_source,meta_payload,meta_sent,notification_sent,delivery_error",
      )
      .eq("id", createdId)
      .single();
    assert.equal(response.error, null);
    row = response.data;
    if (row.delivery_error) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.equal(row.phone, phone);
  assert.equal(row.utm_source, "integration");
  assert.equal(row.meta_payload, null);
  assert.equal(row.meta_sent, true);
  assert.equal(row.notification_sent, false);
  assert.equal(row.delivery_error, "NOTIFICATION_DELIVERY_FAILED");
  console.log(
    "PASS: real API saved lead, preserved UTM, released invite, deduplicated phone and queued disabled notification. No Meta or phone delivery.",
  );
} finally {
  child.kill();
  if (createdId) {
    const removed = await db.from("sala404_leads").delete().eq("id", createdId);
    assert.equal(removed.error, null);
  }
  const removedRate = await db
    .from("sala404_rate_limits")
    .delete()
    .eq("bucket", bucket);
  assert.equal(removedRate.error, null);
  console.log("Test records removed.");
}
