import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface DisputedSession {
  id: string;
  shooter_name: string;
  platform: string;
  total_buy_in: number;
  status: string;
  deposit_proof_url: string | null;
  payout_proof_url: string | null;
  created_at: string;
}

export default function DisputeReview() {
  const [sessions, setSessions] = useState<DisputedSession[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, { deposit?: string; payout?: string }>>({});
  const [loading, setLoading] = useState(true);

  const fetchDisputed = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("id, shooter_name, platform, total_buy_in, status, deposit_proof_url, payout_proof_url, created_at")
      .eq("status", "disputed")
      .order("created_at", { ascending: false });
    if (data) {
      setSessions(data as any);
      const urls: Record<string, { deposit?: string; payout?: string }> = {};
      for (const s of data as any[]) {
        urls[s.id] = {};
        if (s.deposit_proof_url) {
          const { data: d } = await supabase.storage
            .from("session-screenshots")
            .createSignedUrl(s.deposit_proof_url, 300);
          if (d?.signedUrl) urls[s.id].deposit = d.signedUrl;
        }
        if (s.payout_proof_url) {
          const { data: d } = await supabase.storage
            .from("session-screenshots")
            .createSignedUrl(s.payout_proof_url, 300);
          if (d?.signedUrl) urls[s.id].payout = d.signedUrl;
        }
      }
      setSignedUrls(urls);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputed();
  }, []);

  const handleResolve = async (sessionId: string, newStatus: string) => {
    const { error } = await supabase
      .from("sessions")
      .update({ status: newStatus } as any)
      .eq("id", sessionId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Session resolved → ${newStatus}`);
      fetchDisputed();
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading disputes…</p>;

  if (sessions.length === 0) {
    return (
      <div className="gradient-card rounded-lg p-6 text-center">
        <p className="text-muted-foreground text-sm">No disputed sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((s) => (
        <div key={s.id} className="gradient-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-foreground text-sm">
                {s.shooter_name} — {s.platform}
              </p>
              <p className="text-xs text-muted-foreground">
                ${Number(s.total_buy_in).toLocaleString()} buy-in •{" "}
                {new Date(s.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge className="bg-destructive/20 text-destructive border-destructive/30">
              <AlertTriangle className="h-3 w-3 mr-1" /> DISPUTED
            </Badge>
          </div>

          {/* Side-by-side proof comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                Deposit Proof
              </p>
              {signedUrls[s.id]?.deposit ? (
                <img
                  src={signedUrls[s.id].deposit}
                  alt="Deposit proof"
                  className="rounded border border-border w-full aspect-video object-cover cursor-pointer"
                  onClick={() => window.open(signedUrls[s.id].deposit, "_blank")}
                />
              ) : (
                <div className="rounded border border-dashed border-destructive/50 aspect-video flex items-center justify-center bg-destructive/5">
                  <p className="text-[10px] text-destructive font-bold">⚠ MISSING</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                Payout Proof
              </p>
              {signedUrls[s.id]?.payout ? (
                <img
                  src={signedUrls[s.id].payout}
                  alt="Payout proof"
                  className="rounded border border-border w-full aspect-video object-cover cursor-pointer"
                  onClick={() => window.open(signedUrls[s.id].payout, "_blank")}
                />
              ) : (
                <div className="rounded border border-dashed border-destructive/50 aspect-video flex items-center justify-center bg-destructive/5">
                  <p className="text-[10px] text-destructive font-bold">⚠ MISSING</p>
                </div>
              )}
            </div>
          </div>

          {(!s.deposit_proof_url || !s.payout_proof_url) && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-2">
              <p className="text-xs text-destructive font-display font-bold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {!s.deposit_proof_url && !s.payout_proof_url
                  ? "Both deposit and payout proofs are missing"
                  : !s.deposit_proof_url
                  ? "Deposit proof is missing"
                  : "Payout proof is missing"}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleResolve(s.id, "completed")}
              className="gradient-primary text-primary-foreground font-display font-bold text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" /> Resolve (Complete)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolve(s.id, "cancelled")}
              className="text-destructive border-destructive/30 text-xs"
            >
              <XCircle className="h-3 w-3 mr-1" /> Cancel Session
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
