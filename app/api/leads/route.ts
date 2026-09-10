import { NextRequest, NextResponse, after } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { leadSchema } from "@/lib/validation";
import { communityUrl, database } from "@/lib/server";
import { deliverPending } from "@/lib/delivery";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (Number(req.headers.get("content-length") || 0) > 12000)
    return NextResponse.json({ error: "Cadastro inválido." }, { status: 413 });
  let body;
  try {
    const text = await req.text();
    if (text.length > 12000)
      return NextResponse.json(
        { error: "Cadastro inválido." },
        { status: 413 },
      );
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Cadastro inválido." }, { status: 400 });
  }
  const result = leadSchema.safeParse(body);
  if (!result.success)
    return NextResponse.json(
      { error: result.error.issues[0]?.message || "Confira suas respostas." },
      { status: 400 },
    );
  try {
    const whatsappUrl = communityUrl();
    const db = database();
    const lead = result.data;
    const id = randomUUID();
    const hash = (v: string) => createHash("sha256").update(v).digest("hex");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const bucket = hash(ip || "unknown");
    const { data: allowed, error: rateError } = await db.rpc(
      "sala404_allow_request",
      { bucket_key: bucket },
    );
    if (rateError) throw new Error("RATE_LIMIT_FAILED");
    if (!allowed)
      return NextResponse.json(
        {
          error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        },
        { status: 429 },
      );
    const meta = lead.marketing_consent
      ? {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: id,
          action_source: "website",
          event_source_url: lead.attribution.source_url,
          user_data: {
            ph: [hash(lead.phone)],
            fn: [hash(lead.name.split(/\s+/)[0].toLowerCase())],
            ln: [hash(lead.name.split(/\s+/).slice(1).join(" ").toLowerCase())],
            ...(ip ? { client_ip_address: ip } : {}),
            client_user_agent: req.headers.get("user-agent") || "",
            ...(lead.fbp ? { fbp: lead.fbp } : {}),
            ...(lead.fbc
              ? { fbc: lead.fbc }
              : lead.attribution.fbclid
                ? { fbc: `fb.1.${Date.now()}.${lead.attribution.fbclid}` }
                : {}),
          },
        }
      : null;
    const { data, error } = await db
      .from("sala404_leads")
      .upsert(
        {
          id,
          name: lead.name,
          phone: lead.phone,
          profession: lead.answers[0],
          internet_sales: lead.answers[1],
          best_month: lead.answers[2],
          reason: lead.answers[3],
          ...lead.attribution,
          consent: true,
          consent_version: "2026-09-10",
          marketing_consent: lead.marketing_consent,
          meta_payload: meta,
          meta_sent: !meta,
        },
        { onConflict: "phone", ignoreDuplicates: true },
      )
      .select("id");
    if (error) throw new Error("SAVE_FAILED");
    const isNew = !!data?.length;
    if (isNew)
      after(async () => {
        try {
          await deliverPending(id);
        } catch {
          console.error("SALA404_DELIVERY_PENDING");
        }
      });
    return NextResponse.json(
      { whatsappUrl, isNew, eventId: isNew ? id : undefined },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("SALA404_REGISTRATION_UNAVAILABLE");
    return NextResponse.json(
      {
        error:
          "A entrada está temporariamente indisponível. Suas respostas continuam aqui; tente novamente em instantes.",
      },
      { status: 503 },
    );
  }
}
