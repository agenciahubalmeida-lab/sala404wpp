import { database } from "./server";
import { notifyPush } from "./push";
type Job = {
  id: string;
  name: string;
  phone: string;
  profession: string;
  reason: string;
  created_at: string;
  meta_payload: Record<string, unknown> | null;
  meta_sent: boolean;
  notification_sent: boolean;
  attempts: number;
};
async function post(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("DELIVERY_HTTP_" + response.status);
  return response;
}
export async function deliverPending(id?: string) {
  const db = database();
  const { data, error } = await db.rpc("claim_sala404_deliveries", {
    target_id: id || null,
  });
  if (error) throw new Error("DELIVERY_CLAIM_FAILED");
  let delivered = 0;
  for (const job of (data || []) as Job[]) {
    let meta = job.meta_sent,
      notification = job.notification_sent;
    const errors: string[] = [];
    if (!meta) {
      if (!job.meta_payload) meta = true;
      else if (
        !process.env.META_CAPI_ACCESS_TOKEN ||
        !process.env.NEXT_PUBLIC_META_PIXEL_ID
      )
        errors.push("META_NOT_CONFIGURED");
      else
        try {
          const response = await post(
            `https://graph.facebook.com/${process.env.META_API_VERSION || "v23.0"}/${process.env.NEXT_PUBLIC_META_PIXEL_ID}/events`,
            {
              data: [job.meta_payload],
              ...(process.env.META_TEST_EVENT_CODE
                ? { test_event_code: process.env.META_TEST_EVENT_CODE }
                : {}),
            },
            { Authorization: `Bearer ${process.env.META_CAPI_ACCESS_TOKEN}` },
          );
          const result = await response.json();
          if (result.events_received !== 1)
            throw new Error("META_EVENT_NOT_ACCEPTED");
          meta = true;
        } catch {
          errors.push("META_DELIVERY_FAILED");
        }
    }
    if (!notification) {
      const text = `Novo cadastro na SALA 404\n\n${job.name}\nWhatsApp: +${job.phone}\nPerfil: ${job.profession}\nInteresse: ${job.reason}\n\nCadastro salvo. Convite do grupo liberado (entrada ainda não confirmada).`;
      try {
        if (process.env.NOTIFICATION_CHANNEL === "push") {
          await notifyPush(job);
        } else if (
          process.env.TELEGRAM_BOT_TOKEN &&
          process.env.TELEGRAM_CHAT_ID
        ) {
          const response = await post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            { chat_id: process.env.TELEGRAM_CHAT_ID, text },
          );
          const result = await response.json();
          if (!result.ok) throw new Error("TELEGRAM_REJECTED");
        } else if (process.env.NOTIFICATION_WEBHOOK_URL) {
          const endpoint = new URL(process.env.NOTIFICATION_WEBHOOK_URL);
          if (endpoint.protocol !== "https:") throw new Error("HTTPS_REQUIRED");
          await post(
            endpoint.href,
            {
              event: "lead_submitted",
              event_id: job.id,
              name: job.name,
              phone: job.phone,
              profession: job.profession,
              reason: job.reason,
              created_at: job.created_at,
              message: text,
            },
            {
              ...(process.env.NOTIFICATION_WEBHOOK_SECRET
                ? {
                    Authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_SECRET}`,
                  }
                : {}),
            },
          );
        } else throw new Error("NOTIFICATIONS_NOT_CONFIGURED");
        notification = true;
      } catch {
        errors.push("NOTIFICATION_DELIVERY_FAILED");
      }
    }
    const { error: updateError } = await db
      .from("sala404_leads")
      .update({
        meta_sent: meta,
        notification_sent: notification,
        delivery_error: errors.join(",") || null,
        delivery_after: new Date(
          Date.now() +
            Math.min(3600000, 60000 * 2 ** Math.min(job.attempts, 6)),
        ).toISOString(),
      })
      .eq("id", job.id);
    if (updateError) throw new Error("DELIVERY_STATUS_FAILED");
    if (meta && notification) delivered++;
  }
  return { processed: data?.length || 0, delivered };
}
