import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { start_screenshot_url, end_screenshot_url, session_id } = await req.json();

    // Verify caller is admin OR the session's shooter
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    let isShooter = false;
    if (session_id) {
      const { data: session } = await adminClient
        .from("sessions")
        .select("shooter_id")
        .eq("id", session_id)
        .single();
      isShooter = session?.shooter_id === user.id;
    }

    if (!isAdmin && !isShooter) {
      return new Response(JSON.stringify({ error: "Forbidden: must be admin or session owner" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const messages: any[] = [
      {
        role: "system",
        content: `You are an OCR specialist analyzing gaming platform screenshots. Extract the player's balance/credits amount shown on screen. Return ONLY a JSON object with these fields:
- "amount": the numeric balance shown (number, no currency symbols)
- "confidence": your confidence in the reading from 0 to 100
- "raw_text": the exact text you read from the screenshot
If you cannot read the amount, return {"amount": null, "confidence": 0, "raw_text": "unreadable"}`
      }
    ];

    const results: any = {};

    if (start_screenshot_url) {
      const startResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            ...messages,
            {
              role: "user",
              content: [
                { type: "text", text: "Read the player's balance/credits from this START-OF-SESSION gaming screenshot. Return only the JSON." },
                { type: "image_url", image_url: { url: start_screenshot_url } }
              ]
            }
          ],
        }),
      });

      if (startResp.ok) {
        const startData = await startResp.json();
        const content = startData.choices?.[0]?.message?.content || "";
        try {
          const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
          results.start = JSON.parse(cleaned);
        } catch {
          results.start = { amount: null, confidence: 0, raw_text: content };
        }
      } else {
        const errorText = await startResp.text();
        console.error("AI gateway error (start):", startResp.status, errorText);
        if (startResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (startResp.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (end_screenshot_url) {
      const endResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            ...messages,
            {
              role: "user",
              content: [
                { type: "text", text: "Read the player's balance/credits from this END-OF-SESSION gaming screenshot. Return only the JSON." },
                { type: "image_url", image_url: { url: end_screenshot_url } }
              ]
            }
          ],
        }),
      });

      if (endResp.ok) {
        const endData = await endResp.json();
        const content = endData.choices?.[0]?.message?.content || "";
        try {
          const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
          results.end = JSON.parse(cleaned);
        } catch {
          results.end = { amount: null, confidence: 0, raw_text: content };
        }
      } else {
        const errorText = await endResp.text();
        console.error("AI gateway error (end):", endResp.status, errorText);
        if (endResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (endResp.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const startConf = results.start?.confidence || 0;
    const endConf = results.end?.confidence || 0;
    const avgConfidence = start_screenshot_url && end_screenshot_url
      ? Math.round((startConf + endConf) / 2)
      : startConf || endConf;

    return new Response(JSON.stringify({
      start_amount: results.start?.amount ?? null,
      end_amount: results.end?.amount ?? null,
      confidence: avgConfidence,
      details: results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-screenshot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
