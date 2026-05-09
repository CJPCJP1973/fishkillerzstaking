import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Crosshair,
  Banknote,
  Eye,
  CheckCircle2,
  ScrollText,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import ProofUpload from "@/components/ProofUpload";
import ScreenshotComparison from "@/components/admin/ScreenshotComparison";
import SessionJournal from "@/components/SessionJournal";

interface SessionRow {
  id: string;
  shooter_id: string;
  shooter_name: string;
  platform: string;
  agent_room: string;
  total_buy_in: number;
  stake_available: number;
  stake_sold: number | null;
  status: string;
  end_time: string;
  created_at: string;
  winnings: number | null;
  platform_fee: number | null;
  start_screenshot_url: string | null;
  end_screenshot_url: string | null;
  ocr_start_amount: number | null;
  ocr_end_amount: number | null;
  ocr_confidence: number | null;
  manual_rake_status: string | null;
  deposit_proof_url: string | null;
  payout_proof_url: string | null;
  admin_confirmed_deposit: boolean | null;
}

interface StakeSummary {
  count: number;
  total: number;
}

const STATUS_STYLES: Record<string, string> = {
  funding: "bg-warning/15 text-warning border-warning/30",
  live: "bg-live/15 text-live border-live/30",
};

export default function CommittedSessionsTab() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [stakeStats, setStakeStats] = useState<Record<string, StakeSummary>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openProof, setOpenProof] = useState<string | null>(null);
  const [openSettle, setOpenSettle] = useState<string | null>(null);
  const [openJournal, setOpenJournal] = useState<string | null>(null);
  const [cashOut, setCashOut] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: sess } = await supabase
      .from("sessions")
      .select("*")
      .in("status", ["funding", "live"] as any)
      .order("created_at", { ascending: false });

    const rows = (sess || []) as any as SessionRow[];

    // Aggregate confirmed stakes per session
    const ids = rows.map((r) => r.id);
    let stats: Record<string, StakeSummary> = {};
    if (ids.length) {
      const { data: stakes } = await supabase
        .from("stakes")
        .select("session_id, amount, deposit_confirmed")
        .in("session_id", ids)
        .eq("deposit_confirmed", true);
      for (const s of (stakes || []) as any[]) {
        const cur = stats[s.session_id] || { count: 0, total: 0 };
        cur.count += 1;
        cur.total += Number(s.amount || 0);
        stats[s.session_id] = cur;
      }
    }

    // Filter to sessions with at least one confirmed stake
    const committed = rows.filter((r) => (stats[r.id]?.count || 0) > 0);
    setSessions(committed);
    setStakeStats(stats);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totals = useMemo(() => {
    let escrow = 0;
    let live = 0;
    let funding = 0;
    for (const s of sessions) {
      escrow += stakeStats[s.id]?.total || 0;
      if (s.status === "live") live++;
      if (s.status === "funding") funding++;
    }
    return { escrow, live, funding };
  }, [sessions, stakeStats]);

  // Step 1: confirm deposit + go live
  const handleConfirmDeposit = async (s: SessionRow) => {
    if (!s.deposit_proof_url) {
      await supabase.from("notifications").insert({
        user_id: s.shooter_id,
        title: "⚠️ Deposit Proof Required",
        message: `Upload deposit proof for "${s.shooter_name} — ${s.platform}" before the session can go live.`,
        type: "warning",
      } as any);
      toast.error("Deposit proof missing — seller notified");
      return;
    }
    setBusyId(s.id);
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ admin_confirmed_deposit: true, status: "live" } as any)
        .eq("id", s.id);
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: s.shooter_id,
        title: "✅ Deposit Confirmed — You're Live",
        message: `Admin confirmed your deposit for "${s.shooter_name} — ${s.platform}". Session is now LIVE.`,
        type: "success",
      } as any);
      toast.success("Deposit confirmed — session is LIVE");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm deposit");
    }
    setBusyId(null);
  };

  // Step 3: release winnings (settle)
  const handleRelease = async (s: SessionRow) => {
    const amount = parseFloat(cashOut);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid cash-out amount");
      return;
    }
    if (!s.payout_proof_url) {
      toast.error("Payout proof required before releasing winnings");
      return;
    }
    setBusyId(s.id);
    try {
      const { data: confirmedStakes } = await supabase
        .from("stakes")
        .select("id, backer_id, amount, payment_mode")
        .eq("session_id", s.id)
        .eq("deposit_confirmed", true);
      if (!confirmedStakes?.length) {
        toast.error("No confirmed stakes to settle");
        setBusyId(null);
        return;
      }

      const totalStaked = confirmedStakes.reduce((sum, st: any) => sum + Number(st.amount), 0);
      const details = (confirmedStakes as any[]).map((st) => ({
        ...st,
        amountOwed: Math.round(((Number(st.amount) / totalStaked) * amount) * 100) / 100,
      }));

      const backerIds = details.map((d) => d.backer_id);
      const [{ data: profiles }, { data: pay }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name").in("user_id", backerIds),
        supabase.from("payment_profiles").select("user_id, cashapp_tag").in("user_id", backerIds),
      ]);

      const inserts = details.map((d) => ({
        session_id: s.id,
        stake_id: d.id,
        backer_id: d.backer_id,
        backer_name: profiles?.find((p) => p.user_id === d.backer_id)?.display_name || "Unknown",
        backer_cashtag: pay?.find((p) => p.user_id === d.backer_id)?.cashapp_tag || null,
        amount_owed: d.amountOwed,
        status: "pending",
      }));
      const { error: payoutErr } = await supabase.from("payouts").insert(inserts as any);
      if (payoutErr) throw payoutErr;

      // FishDollarz auto-credit
      for (const d of details) {
        if (d.payment_mode === "fishdollarz") {
          await supabase.rpc("adjust_balance", { target_uid: d.backer_id, delta: d.amountOwed });
          await supabase.from("payouts").update({ status: "paid" } as any)
            .eq("stake_id", d.id).eq("session_id", s.id);
          await supabase.from("stakes").update({
            winnings_amount: d.amountOwed,
            winnings_released: true,
          } as any).eq("id", d.id);
          await supabase.from("notifications").insert({
            user_id: d.backer_id,
            title: "Winnings Credited ✅",
            message: `$${d.amountOwed.toLocaleString()} added to your FishDollarz balance.`,
            type: "success",
          } as any);
        }
      }

      await supabase.from("sessions").update({
        status: "completed",
        winnings: amount,
        platform_fee: 0,
        admin_released_winnings: true,
      } as any).eq("id", s.id);

      toast.success(`Released — ${inserts.length} payouts created`);
      setOpenSettle(null);
      setCashOut("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to release winnings");
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-3 mt-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</p>
          <p className="font-display text-lg font-bold text-live">{totals.live}</p>
        </div>
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Funding</p>
          <p className="font-display text-lg font-bold text-warning">{totals.funding}</p>
        </div>
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In Escrow</p>
          <p className="font-display text-lg font-bold text-primary">${totals.escrow.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Committed Sessions
        </h2>
        <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="gradient-card rounded-lg p-6 text-center text-muted-foreground text-sm">
          Loading committed sessions…
        </div>
      ) : sessions.length === 0 ? (
        <div className="gradient-card rounded-lg p-6 text-center">
          <p className="text-muted-foreground text-sm">
            No committed sessions awaiting action. Funded or live sessions with confirmed stakes appear here.
          </p>
        </div>
      ) : (
        sessions.map((s) => {
          const stakes = stakeStats[s.id] || { count: 0, total: 0 };
          const depositReady = !!s.deposit_proof_url;
          const depositConfirmed = s.status === "live" || s.admin_confirmed_deposit === true;
          const proofReady = !!s.payout_proof_url;

          return (
            <div key={s.id} className="gradient-card rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-md bg-primary/20 shrink-0">
                    <Crosshair className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.shooter_name} — {s.platform}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${Number(s.total_buy_in).toLocaleString()} buy-in •{" "}
                      <span className="text-primary font-semibold">
                        {stakes.count} stake{stakes.count === 1 ? "" : "s"} / ${stakes.total.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={STATUS_STYLES[s.status] || ""}>
                  {(s.status || "").toUpperCase()}
                </Badge>
              </div>

              {/* Step 1: Confirm Deposit */}
              <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-display font-bold text-foreground flex items-center gap-1.5">
                    {depositConfirmed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 inline-block" />
                    )}
                    1. Confirm Deposit
                  </p>
                  {!depositReady && (
                    <span className="text-[10px] text-warning flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> proof missing
                    </span>
                  )}
                </div>
                <ProofUpload
                  sessionId={s.id}
                  type="deposit"
                  currentUrl={s.deposit_proof_url}
                  onUploaded={fetchData}
                />
                {!depositConfirmed && (
                  <Button
                    size="sm"
                    disabled={busyId === s.id || !depositReady}
                    onClick={() => handleConfirmDeposit(s)}
                    className="w-full bg-success/20 text-success border border-success/30 hover:bg-success/30 font-display font-bold text-xs h-9"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Confirm Deposit & Start Live
                  </Button>
                )}
              </div>

              {/* Step 2: Verify Stream Proof */}
              <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-display font-bold text-foreground flex items-center gap-1.5">
                    {proofReady ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 inline-block" />
                    )}
                    2. Verify Stream Proof
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpenProof(openProof === s.id ? null : s.id)}
                    className="text-primary text-[11px] h-6 px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {openProof === s.id ? "Hide" : "OCR / Screenshot Compare"}
                  </Button>
                </div>
                <ProofUpload
                  sessionId={s.id}
                  type="payout"
                  currentUrl={s.payout_proof_url}
                  onUploaded={fetchData}
                />
                {openProof === s.id && (
                  <ScreenshotComparison
                    sessionId={s.id}
                    startScreenshotUrl={s.start_screenshot_url}
                    endScreenshotUrl={s.end_screenshot_url}
                    ocrStartAmount={s.ocr_start_amount}
                    ocrEndAmount={s.ocr_end_amount}
                    ocrConfidence={s.ocr_confidence}
                    shooterId={s.shooter_id}
                    shooterName={s.shooter_name}
                    onUpdate={fetchData}
                    onBanned={fetchData}
                  />
                )}
              </div>

              {/* Step 3: Release Winnings */}
              <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-2">
                <p className="text-xs font-display font-bold text-foreground flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 inline-block" />
                  3. Release Winnings
                </p>
                {openSettle === s.id ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Final Cash-Out Amount ($)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={cashOut}
                        onChange={(e) => setCashOut(e.target.value)}
                        placeholder="e.g. 1500"
                        className="bg-background border-border text-foreground"
                      />
                      <Button
                        size="sm"
                        disabled={busyId === s.id || !cashOut || !proofReady}
                        onClick={() => handleRelease(s)}
                        className="gradient-primary text-primary-foreground font-display font-bold text-xs shrink-0"
                      >
                        {busyId === s.id ? "Releasing…" : "Release"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Pro-rata payouts created. FishDollarz stakes auto-credit; P2P stakes appear in Payouts queue.
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setOpenSettle(null); setCashOut(""); }}
                      className="text-[11px] h-6 px-2"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    disabled={busyId === s.id || !proofReady || !depositConfirmed}
                    title={
                      !depositConfirmed ? "Confirm deposit first" :
                      !proofReady ? "Upload payout proof first" :
                      "Release winnings"
                    }
                    onClick={() => { setOpenSettle(s.id); setCashOut(""); }}
                    className="w-full bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 font-display font-bold text-xs h-9"
                  >
                    <Banknote className="h-3.5 w-3.5 mr-1.5" />
                    Release Winnings
                  </Button>
                )}
              </div>

              {/* Audit Log */}
              <Collapsible
                open={openJournal === s.id}
                onOpenChange={(o) => setOpenJournal(o ? s.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      <ScrollText className="h-3.5 w-3.5" /> Audit Log
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openJournal === s.id ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <SessionJournal sessionId={s.id} />
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })
      )}
    </div>
  );
}
