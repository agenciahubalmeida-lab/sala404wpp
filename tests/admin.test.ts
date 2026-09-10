import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { session, authorized, sameOrigin } from "../lib/admin";
import { safePushEndpoint } from "../lib/push";
test("signed admin sessions reject forgery and missing secrets", () => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-only-".repeat(4);
  const token = session();
  const req = (value: string) =>
    new NextRequest("https://example.com/api/admin/leads", {
      headers: { cookie: "sala404_admin=" + value },
    });
  assert.equal(authorized(req(token)), true);
  assert.equal(authorized(req(token + "x")), false);
  assert.equal(authorized(req("0.invalid")), false);
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal(authorized(req(token)), false);
});
test("push endpoints reject local networks, credentials and host suffix attacks", () => {
  for (const url of [
    "http://web.push.apple.com/a",
    "https://localhost/a",
    "https://127.0.0.1/a",
    "https://web.push.apple.com.evil.test/a",
    "https://user@web.push.apple.com/a",
    "https://web.push.apple.com:8080/a",
  ])
    assert.equal(safePushEndpoint(url), false, url);
  for (const url of [
    "https://web.push.apple.com/a",
    "https://fcm.googleapis.com/fcm/send/a",
    "https://updates.push.services.mozilla.com/wpush/v2/a",
  ])
    assert.equal(safePushEndpoint(url), true);
});
test("admin writes require exact same origin", () => {
  assert.equal(
    sameOrigin(
      new NextRequest("https://example.com/api/admin/push", {
        headers: { origin: "https://evil.test" },
      }),
    ),
    false,
  );
  assert.equal(
    sameOrigin(
      new NextRequest("https://example.com/api/admin/push", {
        headers: { origin: "https://example.com" },
      }),
    ),
    true,
  );
});
