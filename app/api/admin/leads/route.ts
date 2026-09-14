import { NextRequest, NextResponse } from "next/server";
import { authorized } from "@/lib/admin";
import { database } from "@/lib/server";
export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse(null, { status: 401 });
  try {
    const cursor = req.nextUrl.searchParams.get("cursor");
    let after: { created_at: string; id: string } | null = null;
    if (cursor) {
      try {
        after = JSON.parse(cursor);
        if (
          !after ||
          !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(
            after.created_at,
          ) ||
          !/^[0-9a-f-]{36}$/i.test(after.id)
        )
          throw Error();
      } catch {
        return NextResponse.json(
          { error: "Página inválida." },
          { status: 400 },
        );
      }
    }
    let query = database()
      .from("sala404_leads")
      .select(
        "id,name,phone,profession,internet_sales,best_month,reason,created_at,notification_sent",
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(51);
    if (after)
      query = query.or(
        `created_at.lt.${after.created_at},and(created_at.eq.${after.created_at},id.lt.${after.id})`,
      );
    const { data, error } = await query;
    if (error) throw Error();
    const leads = (data || []).slice(0, 50);
    const last = leads.at(-1);
    const nextCursor =
      data && data.length > 50 && last
        ? JSON.stringify({ created_at: last.created_at, id: last.id })
        : null;
    return NextResponse.json(
      { leads, nextCursor, publicKey: process.env.VAPID_PUBLIC_KEY || "" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar os cadastros." },
      { status: 503 },
    );
  }
}
