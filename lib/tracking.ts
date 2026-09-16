export type TrackingEvent =
  | "view_page"
  | "click_enter"
  | "quiz_started"
  | "quiz_step_1"
  | "quiz_step_2"
  | "quiz_step_3"
  | "quiz_step_4"
  | "lead_submitted"
  | "whatsapp_click";
declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[][];
      loaded?: boolean;
      version?: string;
      callMethod?: (...args: unknown[]) => void;
    };
    dataLayer?: unknown[];
  }
}
export function marketingAllowed() {
  try {
    return localStorage.getItem("sala404-marketing") === "yes";
  } catch {
    return false;
  }
}
export function track(event: TrackingEvent, eventId?: string) {
  if (!marketingAllowed()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, event_id: eventId });
  if (event === "view_page") window.fbq?.("track", "PageView");
  else if (event === "lead_submitted")
    window.fbq?.("track", "Lead", {}, { eventID: eventId });
}
export function attribution() {
  const q = new URLSearchParams(location.search);
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
  ];
  const value: Record<string, string> = {
    source_url: location.href.split('#')[0],
    referrer: document.referrer.split(/[?#]/)[0],
  };
  for (const key of keys) value[key] = q.get(key) || "";
  return value;
}
export function cookie(name: string) {
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(name + "="))
      ?.slice(name.length + 1) || ""
  );
}
