import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listActiveSessionsTool from "./tools/list-active-sessions";
import getSessionDetailsTool from "./tools/get-session-details";
import listSlotPoolsTool from "./tools/list-slot-pools";
import getLeaderboardTool from "./tools/get-leaderboard";

// Direct Supabase issuer, derived from the project ref at build time so it stays
// import-safe and never points at the .lovable.cloud proxy.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "fishkillerz-mcp",
  title: "FishKillerz MCP",
  version: "0.2.0",
  instructions:
    "Read-only tools for the FishKillerz staking platform. Callers must be signed in via OAuth. Use `list_active_sessions` to see open shooter sessions, `get_session_details` for full info on one session, `list_slot_pools` for community slot pools, and `get_leaderboard` for top shooters.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listActiveSessionsTool, getSessionDetailsTool, listSlotPoolsTool, getLeaderboardTool],
});
