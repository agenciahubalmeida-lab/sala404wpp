import test from "node:test";
import assert from "node:assert/strict";
import { withTimeout } from "../lib/push-browser";
test("stalled browser operations reject instead of leaving activation busy forever", async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 15, "activation timeout"),
    /activation timeout/,
  );
  assert.equal(
    await withTimeout(Promise.resolve("ready"), 50, "timeout"),
    "ready",
  );
  await assert.rejects(
    withTimeout(Promise.reject(Error("denied")), 50, "timeout"),
    /denied/,
  );
});
