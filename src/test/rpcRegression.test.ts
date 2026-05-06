/**
 * Vitest wrapper that runs anon-level RPC regression checks against the
 * live Supabase project. Authenticated/admin coverage lives in
 * `scripts/rpc-regression.mjs` because it requires test credentials.
 *
 * Skips automatically when network is unavailable or when explicitly
 * disabled with SKIP_RPC_REGRESSION=1.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = "https://qzlmyufkwbjqdwwadham.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bG15dWZrd2JqcWR3d2FkaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDA4MzIsImV4cCI6MjA4OTgxNjgzMn0.eeXYOCeyeP5Rw7dZ-7N05oBCGK6Wjk5SxF64TxxdmsU";

const SKIP = process.env.SKIP_RPC_REGRESSION === "1";
const d = SKIP ? describe.skip : describe;

d("RPC regression (anon)", () => {
  let client: SupabaseClient;
  let reachable = true;

  beforeAll(async () => {
    client = createClient(URL, ANON, { auth: { persistSession: false } });
    try {
      await fetch(`${URL}/rest/v1/`, { method: "HEAD" });
    } catch {
      reachable = false;
    }
  });

  const skipIfOffline = () => {
    if (!reachable) {
      // eslint-disable-next-line no-console
      console.warn("Supabase unreachable — skipping live RPC checks");
      return true;
    }
    return false;
  };

  it("get_public_sessions returns array", async () => {
    if (skipIfOffline()) return;
    const { data, error } = await client.rpc("get_public_sessions");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_seller_leaderboard returns array", async () => {
    if (skipIfOffline()) return;
    const { data, error } = await client.rpc("get_seller_leaderboard");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_confirmed_agents returns array", async () => {
    if (skipIfOffline()) return;
    const { data, error } = await client.rpc("get_confirmed_agents");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("get_public_profile handles unknown username", async () => {
    if (skipIfOffline()) return;
    const { data, error } = await client.rpc("get_public_profile", {
      _username: "__nonexistent_user__",
    });
    expect(error).toBeNull();
    expect(Array.isArray(data) && data.length === 0).toBe(true);
  });

  it("consume_unsubscribe_token returns success=false for invalid token", async () => {
    if (skipIfOffline()) return;
    const { data, error } = await client.rpc("consume_unsubscribe_token", {
      _token: "x".repeat(32),
    });
    expect(error).toBeNull();
    expect(Array.isArray(data) && data[0]?.success === false).toBe(true);
  });

  it("get_own_profile denies anon (authenticated-only)", async () => {
    if (skipIfOffline()) return;
    const { error } = await client.rpc("get_own_profile");
    expect(error).toBeTruthy();
  });

  it.each([
    ["enqueue_email", { queue_name: "transactional_emails", payload: {} }],
    ["read_email_batch", { queue_name: "transactional_emails", batch_size: 1, vt: 1 }],
    ["delete_email", { queue_name: "transactional_emails", message_id: 1 }],
  ])("service-role RPC %s denies anon", async (fn, args) => {
    if (skipIfOffline()) return;
    const { error } = await client.rpc(fn as any, args as any);
    expect(error).toBeTruthy();
  });

  it("admin_get_user_emails denies anon", async () => {
    if (skipIfOffline()) return;
    const { error } = await client.rpc("admin_get_user_emails", { _user_ids: [] });
    expect(error).toBeTruthy();
  });

  it("adjust_balance denies anon", async () => {
    if (skipIfOffline()) return;
    const { error } = await client.rpc("adjust_balance", {
      target_uid: "00000000-0000-0000-0000-000000000000",
      delta: 0,
    });
    expect(error).toBeTruthy();
  });
});
