import test from "node:test";
import assert from "node:assert/strict";
import { track, type TrackingEvent } from "../lib/tracking";

test("Meta receives PageView and deduplicated Lead only, respecting consent", () => {
  const calls: unknown[][] = [];
  let consent = "yes";
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { fbq: (...args: unknown[]) => calls.push(args) },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => consent },
  });
  try {
    for (const event of [
      "click_enter",
      "quiz_started",
      "quiz_step_1",
      "quiz_step_2",
      "quiz_step_3",
      "quiz_step_4",
      "whatsapp_click",
    ] as TrackingEvent[])
      track(event);
    assert.equal(calls.length, 0);
    track("view_page");
    track("lead_submitted", "saved-lead-id");
    assert.deepEqual(calls, [
      ["track", "PageView"],
      ["track", "Lead", {}, { eventID: "saved-lead-id" }],
    ]);
    consent = "no";
    track("lead_submitted", "declined");
    track("view_page");
    assert.equal(calls.length, 2);
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (oldStorage)
      Object.defineProperty(globalThis, "localStorage", oldStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
