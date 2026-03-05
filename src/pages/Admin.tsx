import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Shield, CheckCircle, DollarSign, UserCheck, XCircle, Trash2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export default function Admin() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [stakes, setStakes] = useState<PendingStake[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchRequests();
    fetchPendingStakes();
    fetchSessions();
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
    const confirmed = window.confirm(`Delete session "${session.shooter_name} — ${session.platform}"? This will also remove all associated stakes.`);
    if (!confirmed) return;
    setLoadingId(session.id);
    try {
      // Delete associated stakes first
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

  const statusColor: Record<string, string> = {
    live: "bg-live/20 text-live border-live/30",
    funding: "bg-primary/20 text-primary border-primary/30",
    completed: "bg-success/20 text-success border-success/30",
    pending: "bg-accent/20 text-accent border-accent/30",
  };

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage sellers, escrow & sessions</p>
          </div>
        </div>

        <Tabs defaultValue="escrow" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="escrow" className="font-display">
              Pending Stakes ({stakes.length})
            </TabsTrigger>
            <TabsTrigger value="sellers" className="font-display">
              Pending Sellers ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" className="font-display">
              Sessions ({sessions.length})
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="sessions" className="space-y-3 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">All Sessions</h2>
            {sessions.length === 0 ? (
              <div className="gradient-card rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">No sessions yet.</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="gradient-card rounded-lg p-4 flex items-center justify-between gap-3">
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
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ends: {new Date(s.end_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={statusColor[s.status] || "bg-secondary text-muted-foreground"}>
                      {(s.status || "pending").toUpperCase()}
                    </Badge>
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
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
