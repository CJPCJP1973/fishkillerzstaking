import { defineMcp } from "@lovable.dev/mcp-js";
import listActiveSessionsTool from "./tools/list-active-sessions";
import listSlotPoolsTool from "./tools/list-slot-pools";
import getLeaderboardTool from "./tools/get-leaderboard";

export default defineMcp({
  name: "fishkillerz-mcp",
  title: "FishKillerz MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for the FishKillerz staking platform. Use `list_active_sessions` to see open shooter sessions, `list_slot_pools` for community slot pools, and `get_leaderboard` for top shooters.",
  tools: [listActiveSessionsTool, listSlotPoolsTool, getLeaderboardTool],
});
