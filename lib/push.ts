import webpush from "web-push";
import { database } from "./server";
export function safePushEndpoint(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      (u.hostname === "web.push.apple.com" ||
        u.hostname.endsWith(".push.apple.com") ||
        u.hostname === "fcm.googleapis.com" ||
        u.hostname === "updates.push.services.mozilla.com")
    );
  } catch {
    return false;
  }
}
export async function sendPush(
  subscription: webpush.PushSubscription,
  payload: object,
) {
  if (!safePushEndpoint(subscription.endpoint))
    throw Error("INVALID_PUSH_ENDPOINT");
  const publicKey = process.env.VAPID_PUBLIC_KEY,
    privateKey = process.env.VAPID_PRIVATE_KEY,
    subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw Error("PUSH_NOT_CONFIGURED");
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    vapidDetails: { subject, publicKey, privateKey },
    TTL: 3600,
    timeout: 10000,
  });
}
export async function notifyPush(job: { id: string }) {
  const db = database();
  const { data, error } = await db
    .from("sala404_push_subscriptions")
    .select("endpoint,keys");
  if (error) throw Error("PUSH_SUBSCRIPTIONS_FAILED");
  if (!data?.length) throw Error("NO_PUSH_DEVICES");
  let sent = 0;
  for (const sub of data) {
    const previous = await db
      .from("sala404_push_receipts")
      .select("lead_id")
      .eq("lead_id", job.id)
      .eq("endpoint", sub.endpoint)
      .maybeSingle();
    if (previous.error) throw Error("PUSH_RECEIPT_FAILED");
    if (previous.data) {
      sent++;
      continue;
    }
    try {
      await sendPush(sub, {
        title: "SALA 404 — Novo cadastro",
        body: "Uma pessoa se cadastrou. Toque para ver os detalhes.",
        tag: job.id,
        url: "/painel",
      });
      const receipt = await db
        .from("sala404_push_receipts")
        .insert({ lead_id: job.id, endpoint: sub.endpoint });
      if (receipt.error) throw Error("PUSH_RECEIPT_FAILED");
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        const removed = await db
          .from("sala404_push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
        if (removed.error) throw Error("PUSH_CLEANUP_FAILED");
      } else throw Error("PUSH_DELIVERY_FAILED");
    }
  }
  if (!sent) throw Error("NO_ACTIVE_PUSH_DEVICES");
}
