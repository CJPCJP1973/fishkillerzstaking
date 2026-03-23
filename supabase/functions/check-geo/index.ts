import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// US states where the platform is prohibited
const BLOCKED_STATES = [
  "Washington",
  "Utah",
  "Idaho",
  "Louisiana",
  "New Jersey",
];

const BLOCKED_REGION_CODES = ["WA", "UT", "ID", "LA", "NJ"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get caller IP from headers (Deno Deploy / Supabase sets these)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "";

    // Call free ip-api.com (http only on free tier)
    const geoRes = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,regionName,region,countryCode`
    );
    const geo = await geoRes.json();

    if (geo.status !== "success" || geo.countryCode !== "US") {
      // Non-US or lookup failure → allow
      return new Response(
        JSON.stringify({ blocked: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blocked =
      BLOCKED_STATES.includes(geo.regionName) ||
      BLOCKED_REGION_CODES.includes(geo.region);

    return new Response(
      JSON.stringify({
        blocked,
        region: blocked ? geo.regionName : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Geo check error:", err);
    // On error, don't block — fail open
    return new Response(
      JSON.stringify({ blocked: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
