import { createClient } from "@supabase/supabase-js";
export function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("DATABASE_NOT_CONFIGURED");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function communityUrl() {
  const value = process.env.WHATSAPP_GROUP_URL || "https://chat.whatsapp.com/KkC7yZ1CBrtH4X46HGMPdO";
  if (!value) throw new Error("COMMUNITY_NOT_CONFIGURED");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "chat.whatsapp.com")
    throw new Error("INVALID_COMMUNITY_URL");
  return url.href;
}
