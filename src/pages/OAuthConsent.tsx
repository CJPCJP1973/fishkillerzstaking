import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crosshair, ShieldCheck, Loader2 } from "lucide-react";

// Typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
};
const authOAuth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load authorization request");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await authOAuth.approveAuthorization(authorizationId)
        : await authOAuth.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setError(e?.message ?? "Authorization decision failed");
      setBusy(false);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md gradient-card rounded-lg p-6 space-y-3">
          <h1 className="font-display text-xl font-bold text-foreground">
            Could not load this authorization request
          </h1>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? "an app";
  const redirectUri =
    details.client?.redirect_uris?.[0] ?? details.redirect_uri ?? null;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md gradient-card rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Crosshair className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">
            FISH<span className="text-primary glow-text-cyan">KILLERZ</span>
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold text-foreground">
            Connect {clientName} to your FishKillerz account
          </h1>
          <p className="text-sm text-muted-foreground">
            {clientName} will be able to call this app's enabled tools while you are
            signed in. This does not bypass FishKillerz permissions or backend policies.
          </p>
        </div>

        <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-display font-bold">Requested access</span>
          </div>
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
            <li>Share your basic profile</li>
            <li>Share your email address</li>
            <li>Call FishKillerz MCP tools as you</li>
          </ul>
          {redirectUri && (
            <p className="text-[11px] text-muted-foreground pt-1 break-all">
              Redirects to: <span className="text-foreground">{redirectUri}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1"
          >
            Cancel connection
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 gradient-primary text-primary-foreground font-display font-bold"
          >
            {busy ? "Working…" : "Approve"}
          </Button>
        </div>
      </div>
    </main>
  );
}
