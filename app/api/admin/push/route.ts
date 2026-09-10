import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorized, sameOrigin } from "@/lib/admin";
import { database } from "@/lib/server";
import { safePushEndpoint, sendPush } from "@/lib/push";
const schema = z.object({
  endpoint: z.string().max(2048).refine(safePushEndpoint),
  keys: z.object({
    p256dh: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .length(87),
    auth: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .length(22),
  }),
});
export async function POST(req: NextRequest) {
  if (!authorized(req)) return new NextResponse(null, { status: 401 });
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  try {
    const raw = await req.text();
    if (raw.length > 5000) return new NextResponse(null, { status: 413 });
    const input = JSON.parse(raw);
    const parsed = schema.safeParse(input.subscription);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Inscrição inválida." },
        { status: 400 },
      );
    const sub = parsed.data;
    const db = database();
    if (input.action === "test") {
      const { data, error } = await db
        .from("sala404_push_subscriptions")
        .select("endpoint")
        .eq("endpoint", sub.endpoint)
        .maybeSingle();
      if (error || !data) return new NextResponse(null, { status: 404 });
      await sendPush(sub, {
        title: "SALA 404 — Teste",
        body: "Seu aparelho está pronto para receber avisos de cadastro.",
        tag: "sala404-test",
        url: "/painel",
      });
    } else if (input.action === "remove") {
      const { error } = await db
        .from("sala404_push_subscriptions")
        .delete()
        .eq("endpoint", sub.endpoint);
      if (error) throw Error();
    } else if (input.action === "subscribe") {
      const { error } = await db
        .from("sala404_push_subscriptions")
        .upsert(sub, { onConflict: "endpoint" });
      if (error) throw Error();
    } else return new NextResponse(null, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível configurar ou enviar a notificação. Tente novamente.",
      },
      { status: 503 },
    );
  }
}
