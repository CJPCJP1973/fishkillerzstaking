import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Shield, CheckCircle, DollarSign, UserCheck, XCircle, Trash2, Crosshair, Banknote, Send, Eye } from "lucide-react";
import ScreenshotComparison from "@/components/admin/ScreenshotComparison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SellerRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles?: { display_name: string; email: string; username: string } | null;
}

interface PendingStake {
  id: string;
  amount: number;
  payment_method: string | null;
  created_at: string;
  session_id: string;
  backer_id: string;
  backer_profile?: { display_name: string; username: string } | null;
  session_info?: { shooter_name: string; platform: string } | null;
}

interface SessionRow {
  id: string;
  shooter_name: string;
  platform: string;
  total_buy_in: number;
  stake_available: number;
  stake_sold: number;
  status: string;
  end_time: string;
  created_at: string;
  winnings: number | null;
}

interface PayoutRow {
  id: string;
  session_id: string;
  stake_id: string;
  backer_id: string;
  backer_name: string | null;
  backer_cashtag: string | null;
  amount_owed: number;
  status: string;
  session_info?: { shooter_name: string; platform: string } | null;
}

export default function Admin() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [stakes, setStakes] = useState<PendingStake[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [settleSessionId, setSettleSessionId] = useState<string | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState("");

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("seller_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (!data) return;

    const userIds = data.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, username")
      .in("user_id", userIds);

    setRequests(data.map((r: any) => ({
      ...r,
      profiles: profiles?.find((p) => p.user_id === r.user_id) || null,
    })));
  };

  const fetchPendingStakes = async () => {
    const { data } = await supabase
      .from("stakes")
      .select("*")
      .eq("deposit_confirmed", false)
      .order("created_at", { ascending: true });
    if (!data) return;

    const backerIds = [...new Set(data.map((s: any) => s.backer_id))];
    const sessionIds = [...new Set(data.map((s: any) => s.session_id))];

    const [{ data: profiles }, { data: sessionsData }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, username").in("user_id", backerIds),
      supabase.from("sessions").select("id, shooter_name, platform").in("id", sessionIds),
    ]);

    setStakes(data.map((s: any) => ({
      ...s,
      backer_profile: profiles?.find((p) => p.user_id === s.backer_id) || null,
      session_info: sessionsData?.find((sess) => sess.id === s.session_id) || null,
    })));
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSessions(data as any);
  };

  const fetchPayouts = async () => {
    const { data } = await supabase
      .from("payouts")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (!data) return;

    const sessionIds = [...new Set(data.map((p: any) => p.session_id))];
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("id, shooter_name, platform")
      .in("id", sessionIds);

    setPayouts(data.map((p: any) => ({
      ...p,
      session_info: sessionsData?.find((s) => s.id === p.session_id) || null,
    })));
  };

  useEffect(() => {
    fetchRequests();
    fetchPendingStakes();
    fetchSessions();
    fetchPayouts();
  }, []);

  const handleSellerAction = async (request: SellerRequest, action: "approved" | "rejected") => {
    if (loadingId) return;
    setLoadingId(request.id);
    try {
      await supabase.from("seller_requests").update({ status: action, reviewed_at: new Date().toISOString() } as any).eq("id", request.id);
      if (action === "approved") {
        await supabase.from("profiles").update({ seller_status: "active" } as any).eq("user_id", request.user_id);
        const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: request.user_id, role: "seller" } as any);
        if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
      } else {
        await supabase.from("profiles").update({ seller_status: "none" } as any).eq("user_id", request.user_id);
      }
      toast.success(`Seller request ${action}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  const handleStakeAction = async (stake: PendingStake, action: "confirm" | "reject") => {
    if (loadingId) return;
    setLoadingId(stake.id);
    try {
      if (action === "confirm") {
        await supabase.from("stakes").update({ deposit_confirmed: true } as any).eq("id", stake.id);
        const { data: sessionData } = await supabase.from("sessions").select("stake_sold").eq("id", stake.session_id).single();
        const newSold = (Number(sessionData?.stake_sold) || 0) + Number(stake.amount);
        await supabase.from("sessions").update({ stake_sold: newSold } as any).eq("id", stake.session_id);
        toast.success(`Stake of $${stake.amount} confirmed!`);
      } else {
        await supabase.from("stakes").delete().eq("id", stake.id);
        toast.success("Stake rejected and removed");
      }
      fetchPendingStakes();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
    setLoadingId(null);
  };

  const handleDeleteSession = async (session: SessionRow) => {
    if (loadingId) return;
    const confirmed = window.confirm(`Delete session "${session.shooter_name} — ${session.platform}"? This will also remove all associated stakes and payouts.`);
    if (!confirmed) return;
    setLoadingId(session.id);
    try {
      await supabase.from("payouts").delete().eq("session_id", session.id);
      await supabase.from("stakes").delete().eq("session_id", session.id);
      const { error } = await supabase.from("sessions").delete().eq("id", session.id);
      if (error) throw error;
      toast.success("Session deleted");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete session");
    }
    setLoadingId(null);
  };

  const handleSettleSession = async (session: SessionRow) => {
    const cashOut = parseFloat(cashOutAmount);
    if (!cashOut || cashOut < 0) {
      toast.error("Enter a valid cash-out amount");
      return;
    }
    if (loadingId) return;
    setLoadingId(session.id);
    try {
      // Get confirmed stakes for this session
      const { data: confirmedStakes } = await supabase
        .from("stakes")
        .select("id, backer_id, amount")
        .eq("session_id", session.id)
        .eq("deposit_confirmed", true);

      if (!confirmedStakes || confirmedStakes.length === 0) {
        toast.error("No confirmed stakes to settle");
        setLoadingId(null);
        return;
      }

      const totalStaked = confirmedStakes.reduce((sum, s) => sum + Number(s.amount), 0);

      // Fetch backer profiles and payment info
      const backerIds = confirmedStakes.map((s) => s.backer_id);
      const [{ data: profiles }, { data: paymentProfiles }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, username").in("user_id", backerIds),
        supabase.from("payment_profiles").select("user_id, cashapp_tag").in("user_id", backerIds),
      ]);

      // Calculate each backer's share of the cash-out and create payouts
      const payoutInserts = confirmedStakes.map((stake) => {
        const share = Number(stake.amount) / totalStaked;
        const amountOwed = Math.round(cashOut * share * 100) / 100;
        const profile = profiles?.find((p) => p.user_id === stake.backer_id);
        const payment = paymentProfiles?.find((p) => p.user_id === stake.backer_id);
        return {
          session_id: session.id,
          stake_id: stake.id,
          backer_id: stake.backer_id,
          backer_name: profile?.display_name || "Unknown",
          backer_cashtag: payment?.cashapp_tag || null,
          amount_owed: amountOwed,
          status: "pending",
        };
      });

      const { error: payoutError } = await supabase.from("payouts").insert(payoutInserts as any);
      if (payoutError) throw payoutError;

      // Update session status
      await supabase.from("sessions").update({
        status: "completed",
        winnings: cashOut,
      } as any).eq("id", session.id);

      toast.success(`Session settled! ${payoutInserts.length} payouts created.`);
      setSettleSessionId(null);
      setCashOutAmount("");
      fetchSessions();
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to settle session");
    }
    setLoadingId(null);
  };

  const handleMarkPaid = async (payout: PayoutRow) => {
    if (loadingId) return;
    setLoadingId(payout.id);
    try {
      await supabase.from("payouts").update({ status: "paid" } as any).eq("id", payout.id);

      // Also update the stake's winnings fields
      await supabase.from("stakes").update({
        winnings_amount: payout.amount_owed,
        winnings_released: true,
      } as any).eq("id", payout.stake_id);

      toast.success(`Payout of $${payout.amount_owed} marked as paid`);
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark payout");
    }
    setLoadingId(null);
  };

  const statusColor: Record<string, string> = {
    live: "bg-live/20 text-live border-live/30",
    funding: "bg-primary/20 text-primary border-primary/30",
    completed: "bg-success/20 text-success border-success/30",
    pending: "bg-accent/20 text-accent border-accent/30",
    cancelled: "bg-destructive/20 text-destructive border-destructive/30",
    disputed: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage sellers, escrow, sessions & payouts</p>
          </div>
        </div>

        <Tabs defaultValue="escrow" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="escrow" className="font-display">
              Stakes ({stakes.length})
            </TabsTrigger>
            <TabsTrigger value="payouts" className="font-display">
              Payouts ({payouts.length})
            </TabsTrigger>
            <TabsTrigger value="sellers" className="font-display">
              Sellers ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="font-display">
              Sessions ({sessions.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Stakes */}
          <TabsContent value="escrow" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending Stake Deposits</h2>
            {stakes.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No pending stakes to review.</p>
              </div>
            ) : (
              stakes.map((stake) => (
                <div key={stake.id} className="gradient-card rounded-lg p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-accent/20 shrink-0">
                      <DollarSign className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {stake.backer_profile?.display_name || "Unknown"}
                        {stake.backer_profile?.username && (
                          <span className="text-primary ml-1">@{stake.backer_profile.username}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        ${Number(stake.amount).toLocaleString()} → {stake.session_info?.shooter_name} ({stake.session_info?.platform})
                      </p>
                      <p className="text-xs text-accent font-medium truncate">
                        Ref: {stake.payment_method || "No ref provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === stake.id}
                      onClick={() => handleStakeAction(stake, "reject")}
                      className="text-destructive border-destructive/30 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={loadingId === stake.id}
                      onClick={() => handleStakeAction(stake, "confirm")}
                      className="gradient-primary text-primary-foreground font-display font-bold text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Confirm
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending Payouts</h2>
            {payouts.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No pending payouts. Settle a session to generate them.</p>
              </div>
            ) : (
              payouts.map((payout) => (
                <div key={payout.id} className="gradient-card rounded-lg p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-success/20 shrink-0">
                      <Banknote className="h-4 w-4 text-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {payout.backer_name || "Unknown"}
                      </p>
                      <p className="text-xs text-primary font-medium truncate">
                        {payout.backer_cashtag || "No CashApp on file"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Owes: <span className="text-accent font-display font-bold">${Number(payout.amount_owed).toLocaleString()}</span>
                        {" "}• {payout.session_info?.shooter_name} ({payout.session_info?.platform})
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={loadingId === payout.id}
                    onClick={() => handleMarkPaid(payout)}
                    className="gradient-primary text-primary-foreground font-display font-bold text-xs shrink-0"
                  >
                    <Send className="h-3 w-3 mr-1" /> Mark Paid
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          {/* Sellers */}
          <TabsContent value="sellers" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Pending Seller Requests</h2>
            {requests.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No pending requests.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="gradient-card rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-accent/20">
                      <UserCheck className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {req.profiles?.display_name || "Unknown"}
                        {req.profiles?.username && <span className="text-primary ml-1">@{req.profiles.username}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.profiles?.email} • {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={loadingId === req.id} onClick={() => handleSellerAction(req, "rejected")} className="text-destructive border-destructive/30 text-xs">
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button size="sm" disabled={loadingId === req.id} onClick={() => handleSellerAction(req, "approved")} className="gradient-primary text-primary-foreground font-display font-bold text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Sessions */}
          <TabsContent value="sessions" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">All Sessions</h2>
            {sessions.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No sessions yet.</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="gradient-card rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-primary/20 shrink-0">
                        <Crosshair className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.shooter_name} — {s.platform}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${Number(s.total_buy_in).toLocaleString()} buy-in • ${Number(s.stake_sold || 0).toLocaleString()} sold
                          {s.winnings != null && ` • $${Number(s.winnings).toLocaleString()} cash-out`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={statusColor[s.status] || "bg-secondary text-muted-foreground"}>
                        {(s.status || "pending").toUpperCase()}
                      </Badge>
                      {s.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingId === s.id}
                          onClick={() => {
                            setSettleSessionId(settleSessionId === s.id ? null : s.id);
                            setCashOutAmount("");
                          }}
                          className="text-success border-success/30 text-xs"
                        >
                          <Banknote className="h-3 w-3 mr-1" /> Settle
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === s.id}
                        onClick={() => handleDeleteSession(s)}
                        className="text-destructive border-destructive/30 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>

                  {/* Settle Form */}
                  {settleSessionId === s.id && (
                    <div className="bg-secondary rounded-md p-3 space-y-2">
                      <Label className="text-sm text-muted-foreground">Final Cash-Out Amount ($)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={cashOutAmount}
                          onChange={(e) => setCashOutAmount(e.target.value)}
                          placeholder="e.g. 1500"
                          className="bg-background border-border text-foreground"
                          min={0}
                        />
                        <Button
                          size="sm"
                          disabled={loadingId === s.id || !cashOutAmount}
                          onClick={() => handleSettleSession(s)}
                          className="gradient-primary text-primary-foreground font-display font-bold text-xs shrink-0"
                        >
                          {loadingId === s.id ? "Settling..." : "Confirm Settle"}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        This will mark the session as completed, calculate each backer's share, and create pending payouts.
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
