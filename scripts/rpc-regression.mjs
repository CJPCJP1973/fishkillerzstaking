#!/usr/bin/env node
/**
 * RPC regression suite — verifies every public RPC behaves correctly
 * for anon, authenticated, and admin callers.
 *
 * Usage:
 *   node scripts/rpc-regression.mjs
 *
 * Env vars (all optional):
 *   SUPABASE_URL                 (defaults to project VITE_SUPABASE_URL)
 *   SUPABASE_ANON_KEY            (defaults to project VITE_SUPABASE_PUBLISHABLE_KEY)
 *   TEST_USER_EMAIL / TEST_USER_PASSWORD     — runs authenticated checks
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD   — runs admin checks
 */
import { createClient } from "@supabase/supabase-js";

const URL =
  process.env.SUPABASE_URL ||
  "https://qzlmyufkwbjqdwwadham.supabase.co";
const ANON =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bG15dWZrd2JqcWR3d2FkaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDA4MzIsImV4cCI6MjA4OTgxNjgzMn0.eeXYOCeyeP5Rw7dZ-7N05oBCGK6Wjk5SxF64TxxdmsU";

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

async function makeClient(email, password) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  if (email && password) {
    const { error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`signin failed for ${email}: ${error.message}`);
  }
  return c;
}

// Expectation helpers: "ok" = no error, "deny" = error (any), "empty" = no rows + no error
async function expect(client, name, label, fn, expected) {
  try {
    const { data, error } = await fn(client);
    if (expected === "ok") {
      record(`${name} [${label}] should succeed`, !error, error?.message);
    } else if (expected === "deny") {
      record(`${name} [${label}] should be denied`, !!error, error ? "" : `unexpected data: ${JSON.stringify(data)?.slice(0, 80)}`);
    } else if (expected === "empty") {
      record(
        `${name} [${label}] should return no rows`,
        !error && Array.isArray(data) && data.length === 0,
        error?.message ?? `rows=${Array.isArray(data) ? data.length : "n/a"}`
      );
    }
  } catch (e) {
    record(`${name} [${label}]`, false, String(e?.message ?? e));
  }
}

async function runFor(label, client) {
  console.log(`\n— ${label} —`);

  // Anon-callable RPCs (should always succeed, return data or empty array)
  await expect(client, "get_public_sessions", label, (c) => c.rpc("get_public_sessions"), "ok");
  await expect(client, "get_seller_leaderboard", label, (c) => c.rpc("get_seller_leaderboard"), "ok");
  await expect(client, "get_confirmed_agents", label, (c) => c.rpc("get_confirmed_agents"), "ok");
  await expect(
    client,
    "get_public_profile",
    label,
    (c) => c.rpc("get_public_profile", { _username: "__nonexistent_user__" }),
    "ok"
  );
  await expect(
    client,
    "consume_unsubscribe_token (invalid)",
    label,
    (c) => c.rpc("consume_unsubscribe_token", { _token: "x".repeat(32) }),
    "ok" // returns success=false, not an error
  );

  // Authenticated-only — auth.uid() based, must error or return empty for anon
  if (label === "anon") {
    await expect(client, "get_own_profile", label, (c) => c.rpc("get_own_profile"), "empty");
    await expect(client, "start_seller_trial", label, (c) => c.rpc("start_seller_trial"), "deny");
  } else {
    await expect(client, "get_own_profile", label, (c) => c.rpc("get_own_profile"), "ok");
    // start_seller_trial mutates — only run on a dedicated test account
    if (process.env.TEST_RUN_MUTATIONS === "1") {
      await expect(client, "start_seller_trial", label, (c) => c.rpc("start_seller_trial"), "ok");
    }
  }

  // has_role — RLS helper, callable by everyone (returns boolean)
  await expect(
    client,
    "has_role(self, 'backer')",
    label,
    async (c) => {
      const { data: u } = await c.auth.getUser();
      return c.rpc("has_role", {
        _user_id: u?.user?.id ?? "00000000-0000-0000-0000-000000000000",
        _role: "backer",
      });
    },
    "ok"
  );

  // Admin-guarded RPCs — should be denied unless caller is admin
  const adminExpect = label === "admin" ? "ok" : "deny";
  await expect(
    client,
    "admin_get_user_emails",
    label,
    (c) => c.rpc("admin_get_user_emails", { _user_ids: [] }),
    adminExpect
  );
  await expect(
    client,
    "adjust_balance(self, 0)",
    label,
    async (c) => {
      const { data: u } = await c.auth.getUser();
      return c.rpc("adjust_balance", {
        target_uid: u?.user?.id ?? "00000000-0000-0000-0000-000000000000",
        delta: 0,
      });
    },
    adminExpect
  );

  // pgmq wrappers — must be denied for anon AND authenticated AND admin
  // (granted only to service_role)
  await expect(
    client,
    "enqueue_email",
    label,
    (c) => c.rpc("enqueue_email", { queue_name: "transactional_emails", payload: {} }),
    "deny"
  );
  await expect(
    client,
    "read_email_batch",
    label,
    (c) => c.rpc("read_email_batch", { queue_name: "transactional_emails", batch_size: 1, vt: 1 }),
    "deny"
  );
  await expect(
    client,
    "delete_email",
    label,
    (c) => c.rpc("delete_email", { queue_name: "transactional_emails", message_id: 1 }),
    "deny"
  );
  await expect(
    client,
    "move_to_dlq",
    label,
    (c) =>
      c.rpc("move_to_dlq", {
        source_queue: "transactional_emails",
        dlq_name: "transactional_emails_dlq",
        message_id: 1,
        payload: {},
      }),
    "deny"
  );
}

async function main() {
  await runFor("anon", await makeClient());

  if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
    await runFor("authenticated", await makeClient(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD));
  } else {
    console.log("\n⏭  skipping authenticated tests — set TEST_USER_EMAIL / TEST_USER_PASSWORD");
  }

  if (process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD) {
    await runFor("admin", await makeClient(process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD));
  } else {
    console.log("\n⏭  skipping admin tests — set TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.error("\nFailures:");
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
