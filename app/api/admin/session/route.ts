import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  adminCookie,
  authorized,
  equal,
  sameOrigin,
  session,
} from "@/lib/admin";
import { database } from "@/lib/server";
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { authenticated: authorized(req) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  try {
    const raw = await req.text();
    if (raw.length > 1000) return new NextResponse(null, { status: 413 });
    const { password } = JSON.parse(raw);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const bucket = "admin:" + createHash("sha256").update(ip).digest("hex");
    const { data, error } = await database().rpc("sala404_allow_request", {
      bucket_key: bucket,
    });
    if (error) throw Error();
    if (!data)
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde 10 minutos." },
        { status: 429 },
      );
    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET)
      throw Error();
    if (
      typeof password !== "string" ||
      !equal(password, process.env.ADMIN_PASSWORD)
    )
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(adminCookie, session(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/admin",
      maxAge: 7 * 86400,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Acesso indisponível." },
      { status: 503 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: 0,
  });
  return res;
}
