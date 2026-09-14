import { NextRequest, NextResponse } from "next/server";
import { authorized } from "@/lib/admin";
import { database } from "@/lib/server";
export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse(null, { status: 401 });
  try {
    const { data, error } = await database()
      .from("sala404_leads")
      .select(
        "id,name,phone,profession,internet_sales,best_month,reason,created_at,notification_sent",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw Error();
    return NextResponse.json(
      { leads: data, publicKey: process.env.VAPID_PUBLIC_KEY || "" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar os cadastros." },
      { status: 503 },
    );
  }
}
