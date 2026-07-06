import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_session_details",
  title: "Get session details",
  description:
    "Return full public details for a specific active/funding staking session by id: shooter, platform, agent/room, buy-in, stake available, share price, status, end time, and stream URL.",
  inputSchema: {
    session_id: z.string().uuid().describe("The session id (uuid) to fetch."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ session_id }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, shooter_name, platform, agent_room, total_buy_in, stake_available, share_price, status, end_time, stream_url, created_at",
      )
      .eq("id", session_id)
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Session not found." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { session: data },
    };
  },
});
