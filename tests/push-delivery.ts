// Explicit integration test: real Supabase, mocked push transport, no phone messages.
import assert from "node:assert/strict";
import webpush from "web-push";
import { database } from "../lib/server";
import { notifyPush } from "../lib/push";
async function main() {
  if (process.env.RUN_SUPABASE_TESTS !== "yes")
    throw Error("Explicit opt-in required");
  const db = database();
  const endpoint = "https://web.push.apple.com/sala404-delivery-test-only";
  const existing = await db
    .from("sala404_push_subscriptions")
    .select("endpoint");
  assert.equal(existing.error, null);
  assert.equal(existing.data?.length, 0, "Run before enrolling real devices");
  const id = crypto.randomUUID();
  let calls = 0;
  const original = webpush.sendNotification;
  webpush.sendNotification = async () => {
    calls++;
    return { statusCode: 201, body: "", headers: {} };
  };
  try {
    const sub = await db
      .from("sala404_push_subscriptions")
      .insert({
        endpoint,
        keys: { p256dh: "B".repeat(87), auth: "A".repeat(22) },
      });
    assert.equal(sub.error, null);
    const lead = await db
      .from("sala404_leads")
      .insert({
        id,
        name: "Teste push",
        phone: "push-test-" + id,
        profession: "teste",
        internet_sales: "teste",
        best_month: "teste",
        reason: "teste",
        source_url: "https://example.test",
        consent: true,
        consent_version: "test",
        meta_sent: true,
        notification_sent: true,
      });
    assert.equal(lead.error, null);
    await notifyPush({ id });
    await notifyPush({ id });
    assert.equal(calls, 1, "receipt should prevent resending");
    await db.from("sala404_push_receipts").delete().eq("lead_id", id);
    webpush.sendNotification = async () => {
      throw Object.assign(new Error("expired"), { statusCode: 410 });
    };
    await assert.rejects(notifyPush({ id }), /NO_ACTIVE_PUSH_DEVICES/);
    const removed = await db
      .from("sala404_push_subscriptions")
      .select("endpoint")
      .eq("endpoint", endpoint);
    assert.equal(removed.data?.length, 0);
    console.log(
      "PASS: encrypted transport boundary mocked, real receipt prevents repeat sends, 410 removes expired device.",
    );
  } finally {
    webpush.sendNotification = original;
    await db.from("sala404_leads").delete().eq("id", id);
    await db
      .from("sala404_push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);
  }
}
main().catch(() => {
  console.error("Push delivery integration failed");
  process.exitCode = 1;
});
