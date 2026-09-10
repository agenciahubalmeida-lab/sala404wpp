import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
export const adminCookie = "sala404_admin";
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function sign(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw Error("ADMIN_NOT_CONFIGURED");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function session() {
  const expiry = String(Date.now() + 7 * 86400000);
  return expiry + "." + sign(expiry);
}
export function authorized(req: NextRequest) {
  try {
    const [expiry, sig] = (req.cookies.get(adminCookie)?.value || "").split(
      ".",
    );
    return (
      /^\d+$/.test(expiry) &&
      Number(expiry) > Date.now() &&
      equal(sig || "", sign(expiry))
    );
  } catch {
    return false;
  }
}
export function sameOrigin(req: NextRequest) {
  return req.headers.get("origin") === req.nextUrl.origin;
}
