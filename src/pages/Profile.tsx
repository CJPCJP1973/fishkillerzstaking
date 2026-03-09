import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { User, Trophy, DollarSign, TrendingUp, Plus } from "lucide-react";
import TierBadge from "@/components/TierBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import BecomeSeller from "@/components/BecomeSeller";
import IDVerification from "@/components/IDVerification";
import PaymentSettings from "@/components/PaymentSettings";
import WalletTab from "@/components/WalletTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProofUpload from "@/components/ProofUpload";

export default function Profile() {
  const { user, isAdmin, isSeller, sellerStatus, username, loading, verificationStatus, verificationNote, sellerTier } = useAuth();
  const navigate = useNavigate();
  const [mySessions, setMySessions] = useState<any[]>([]);
  const [stats, setStats] = useState({ wins: 0, totalStaked: 0, roi: 0 });

  const fetchMySessions = async (uid: string) => {
    const { data } = await supabase
      .from("sessions")
      .select("id, shooter_name, platform, agent_room, status, deposit_proof_url, payout_proof_url, total_buy_in")
      .eq("shooter_id", uid)
      .order("created_at", { ascending: false });
    setMySessions(data || []);
  };

  const fetchStats = async (uid: string) => {
    // Wins: completed sessions where user was a backer with positive winnings
    const { data: winStakes } = await supabase
      .from("stakes")
      .select("amount, winnings_amount, winnings_released")
      .eq("backer_id", uid)
      .eq("winnings_released", true);

    // All stakes by user
    const { data: allStakes } = await supabase
      .from("stakes")
      .select("amount, deposit_confirmed")
      .eq("backer_id", uid)
      .eq("deposit_confirmed", true);

    const wins = winStakes?.filter((s) => Number(s.winnings_amount) > Number(s.amount)).length || 0;
    const totalStaked = allStakes?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
    const totalReturned = winStakes?.reduce((sum, s) => sum + Number(s.winnings_amount || 0), 0) || 0;
    const roi = totalStaked > 0 ? Math.round(((totalReturned - totalStaked) / totalStaked) * 100) : 0;

    setStats({ wins, totalStaked, roi });
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (user) {
      fetchMySessions(user.id);
      fetchStats(user.id);
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="gradient-card rounded-lg p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-0.5">
            {user.user_metadata?.display_name || user.email?.split("@")[0]}
          </h1>
          {username && <p className="text-primary text-sm font-medium mb-1">@{username}</p>}
          <p className="text-muted-foreground text-xs mb-3">{user.email}</p>

          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="flex justify-center gap-2">
              {isAdmin && <Badge className="bg-accent/20 text-accent border-accent/30">Admin</Badge>}
              {isSeller && <TierBadge tier={sellerTier} />}
              <BecomeSeller />
            </div>
            <IDVerification verificationStatus={verificationStatus} verificationNote={verificationNote} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary rounded-md p-3">
              <Trophy className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-display font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="bg-secondary rounded-md p-3">
              <DollarSign className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-display font-bold text-foreground">$0</p>
              <p className="text-xs text-muted-foreground">Staked</p>
            </div>
            <div className="bg-secondary rounded-md p-3">
              <TrendingUp className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-display font-bold text-foreground">0%</p>
              <p className="text-xs text-muted-foreground">ROI</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="wallet" className="flex-1 font-display">Wallet</TabsTrigger>
            {isSeller && <TabsTrigger value="sessions" className="flex-1 font-display">My Sessions</TabsTrigger>}
            <TabsTrigger value="stakes" className="flex-1 font-display">My Stakes</TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 font-display">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="mt-4">
            <WalletTab />
          </TabsContent>

          {isSeller && (
            <TabsContent value="sessions" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-foreground">Your Sessions</h2>
                <Link to="/create">
                  <Button size="sm" className="gradient-primary text-primary-foreground font-display font-bold text-xs">
                    <Plus className="h-4 w-4 mr-1" /> Create Session
                  </Button>
                </Link>
              </div>

              {mySessions.length === 0 ? (
                <div className="gradient-card rounded-lg p-6 text-center">
                  <p className="text-muted-foreground text-sm">No sessions yet. Create your first one!</p>
                </div>
              ) : (
                mySessions.map((s) => {
                  const needsDeposit = (s.status === "pending" || s.status === "funding") && !s.deposit_proof_url;
                  const needsPayout = s.status === "live" && !s.payout_proof_url;

                  return (
                    <div key={s.id} className="gradient-card rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-bold text-foreground">{s.shooter_name}</p>
                          <p className="text-xs text-muted-foreground">{s.platform} · {s.agent_room}</p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{s.status}</Badge>
                      </div>

                      {needsDeposit && (
                        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="text-sm font-display">Deposit Proof Missing</AlertTitle>
                          <AlertDescription className="text-xs">
                            Upload your deposit screenshot before this session can go live. Must show Transaction ID, Payment Status &amp; Timestamp.
                          </AlertDescription>
                        </Alert>
                      )}

                      {needsPayout && (
                        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="text-sm font-display">Payout Proof Missing</AlertTitle>
                          <AlertDescription className="text-xs">
                            Upload your payout screenshot to settle this session. Must show final withdrawn amount &amp; payout confirmation.
                          </AlertDescription>
                        </Alert>
                      )}

                      {(needsDeposit || needsPayout) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {needsDeposit && (
                            <ProofUpload
                              sessionId={s.id}
                              type="deposit"
                              currentUrl={s.deposit_proof_url}
                              onUploaded={() => fetchMySessions(user.id)}
                            />
                          )}
                          {needsPayout && (
                            <ProofUpload
                              sessionId={s.id}
                              type="payout"
                              currentUrl={s.payout_proof_url}
                              onUploaded={() => fetchMySessions(user.id)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </TabsContent>
          )}

          <TabsContent value="stakes" className="space-y-4 mt-4">
            <h2 className="font-display text-lg font-bold text-foreground">Staked Sessions</h2>
            <div className="gradient-card rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm">No stakes yet. Browse sessions to get started!</p>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <PaymentSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
