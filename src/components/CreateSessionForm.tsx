import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Crosshair, FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PaymentSettings from "@/components/PaymentSettings";
import TierBadge from "@/components/TierBadge";
import { getTierConfig } from "@/lib/tierConfig";
import SellerPaywallModal from "@/components/SellerPaywallModal";

interface ConfirmedAgent {
  id: string;
  agent_name: string;
}

export default function CreateSessionForm() {
  const { user, username, sellerTier, sellerPaid } = useAuth();
  const tierConfig = getTierConfig(sellerTier);
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [shooterName, setShooterName] = useState(username || "");
  const [platform, setPlatform] = useState("");
  const [agentRoom, setAgentRoom] = useState("");
  const [totalBuyIn, setTotalBuyIn] = useState("");
  const [stakePercent, setStakePercent] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sharePrice, setSharePrice] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [cashoutWindow, setCashoutWindow] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [payoutAgreement, setPayoutAgreement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agents, setAgents] = useState<ConfirmedAgent[]>([]);
  const [showAgentRequest, setShowAgentRequest] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [requestingAgent, setRequestingAgent] = useState(false);
  const [showPlatformRequest, setShowPlatformRequest] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [requestingPlatform, setRequestingPlatform] = useState(false);

  const knownPlatforms = ["Golden Dragon", "Diamond Dragon", "Fire Phoenix", "Vblink", "Riversweeps", "Magic City"];

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from("confirmed_agents_public")
        .select("id, agent_name")
        .order("agent_name", { ascending: true });
      if (data) setAgents(data as any);
    };
    const fetchSessionCount = async () => {
      if (!user) return;
      const { count } = await supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("shooter_id", user.id);
      setSessionCount(count ?? 0);
    };
    fetchAgents();
    fetchSessionCount();
  }, [user]);

  const buyInNum = parseFloat(totalBuyIn) || 0;
  const percentNum = parseFloat(stakePercent) || 0;
  const sharePriceNum = parseFloat(sharePrice) || 0;
  const maxPercent = tierConfig.maxStakePercent;
  const stakeAmount = buyInNum * (Math.min(percentNum, maxPercent) / 100);
  const isOverLimit = percentNum > maxPercent;
  const sharesAvailable = sharePriceNum > 0 ? Math.floor(stakeAmount / sharePriceNum) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check paywall: if trial used (1+ sessions) and not paid, show modal
    if (!sellerPaid && sessionCount !== null && sessionCount >= 1) {
      setShowPaywall(true);
      return;
    }

    if (isOverLimit) {
      toast.error(`Maximum stake is ${maxPercent}% for your tier (${tierConfig.name}). You must keep ${100 - maxPercent}% skin-in-the-game!`);
      return;
    }
    if (!shooterName || !platform || !agentRoom || !totalBuyIn || !stakePercent || !sharePrice || !endTime || !cashoutWindow || !dailyLimit) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!payoutAgreement) {
      toast.error("You must agree to the payout terms before creating a session");
      return;
    }
    if (!user) {
      toast.error("You must be signed in");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("sessions").insert({
        shooter_id: user.id,
        shooter_name: shooterName,
        platform,
        agent_room: agentRoom,
        total_buy_in: buyInNum,
        stake_available: stakeAmount,
        share_price: sharePriceNum,
        end_time: new Date(endTime).toISOString(),
        stream_url: streamUrl || null,
        status: "funding",
        agent_cashout_window: cashoutWindow,
        agent_daily_limit: dailyLimit,
        seller_payout_agreement: true,
      } as any);

      if (error) throw error;

      toast.success("Session created! Waiting for backers...");
      setShooterName(username || "");
      setPlatform("");
      setAgentRoom("");
      setTotalBuyIn("");
      setStakePercent("");
      setSharePrice("");
      setEndTime("");
      setStreamUrl("");
      setCashoutWindow("");
      setDailyLimit("");
      setPayoutAgreement(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create session");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="gradient-card rounded-lg p-6 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-md bg-primary/20">
          <Crosshair className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-foreground">Create Session</h2>
            <TierBadge tier={sellerTier} />
            {!sellerPaid && (
              <span className="text-[10px] bg-accent/20 text-accent border border-accent/30 px-1.5 py-0.5 rounded font-medium">
                {sessionCount === 0 ? "FREE TRIAL" : "TRIAL USED"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Max stake: {tierConfig.maxStakePercent}% · Rake: {tierConfig.rakePercent}%
            {!sellerPaid && sessionCount === 0 && " · 1 free session"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground">Shooter Name</Label>
          <Input
            value={shooterName}
            onChange={(e) => setShooterName(e.target.value)}
            placeholder="Your gamer tag"
            className="bg-secondary border-border text-foreground"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Game Platform</Label>
          <Select value={platform} onValueChange={(val) => {
            if (val === "__request_new_platform__") {
              setShowPlatformRequest(true);
              return;
            }
            setPlatform(val);
          }}>
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="Select a platform" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {knownPlatforms.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <SelectItem value="__request_new_platform__" className="text-primary">
                  <span className="flex items-center gap-1.5"><Plus className="h-3 w-3" /> Request New Platform</span>
                </SelectItem>
              </div>
            </SelectContent>
          </Select>

          {showPlatformRequest && (
            <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Request a new platform for admin approval</p>
              <Input
                value={newPlatformName}
                onChange={(e) => setNewPlatformName(e.target.value)}
                placeholder="Platform name"
                className="bg-secondary border-border text-foreground text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!newPlatformName.trim() || requestingPlatform}
                  className="gradient-primary text-primary-foreground text-xs"
                  onClick={async () => {
                    if (!user || !newPlatformName.trim()) return;
                    setRequestingPlatform(true);
                    try {
                      const { data: admins } = await supabase
                        .from("user_roles")
                        .select("user_id")
                        .eq("role", "admin");
                      if (admins) {
                        for (const admin of admins) {
                          await supabase.from("notifications").insert({
                            user_id: admin.user_id,
                            title: "New Platform Request 🎮",
                            message: `${username || "A user"} requested platform: "${newPlatformName.trim()}"`,
                            type: "platform_request",
                          } as any);
                        }
                      }
                      toast.success("Platform request submitted! An admin will review it.");
                      setNewPlatformName("");
                      setShowPlatformRequest(false);
                    } catch {
                      toast.error("Failed to submit request");
                    }
                    setRequestingPlatform(false);
                  }}
                >
                  {requestingPlatform ? "Sending..." : "Submit Request"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={() => { setShowPlatformRequest(false); setNewPlatformName(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Agent</Label>
          <Select value={agentRoom} onValueChange={(val) => {
            if (val === "__request_new__") {
              setShowAgentRequest(true);
              return;
            }
            setAgentRoom(val);
          }}>
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="Select confirmed agent" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {agents.length > 0 ? agents.map((a) => (
                <SelectItem key={a.id} value={a.agent_name}>{a.agent_name}</SelectItem>
              )) : (
                <div className="px-3 py-2 text-xs text-muted-foreground">No agents available yet.</div>
              )}
              <div className="border-t border-border mt-1 pt-1">
                <SelectItem value="__request_new__" className="text-primary">
                  <span className="flex items-center gap-1.5"><Plus className="h-3 w-3" /> Request New Agent</span>
                </SelectItem>
              </div>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">Only admin-approved agents are available.</p>

          {showAgentRequest && (
            <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Request a new agent for admin approval</p>
              <Input
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="Agent name"
                className="bg-secondary border-border text-foreground text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!newAgentName.trim() || requestingAgent}
                  className="gradient-primary text-primary-foreground text-xs"
                  onClick={async () => {
                    if (!user || !newAgentName.trim()) return;
                    setRequestingAgent(true);
                    try {
                      const { error } = await supabase.from("session_journal").insert({
                        session_id: "00000000-0000-0000-0000-000000000000",
                        user_id: user.id,
                        author_name: username || "User",
                        message: `Agent request: "${newAgentName.trim()}" — submitted by ${username || user.email}`,
                        entry_type: "note",
                      } as any);
                      // Also create a notification for admins
                      const { data: admins } = await supabase
                        .from("user_roles")
                        .select("user_id")
                        .eq("role", "admin");
                      if (admins) {
                        for (const admin of admins) {
                          await supabase.from("notifications").insert({
                            user_id: admin.user_id,
                            title: "New Agent Request",
                            message: `${username || "A user"} requested agent: "${newAgentName.trim()}"`,
                            type: "agent_request",
                          } as any);
                        }
                      }
                      toast.success("Agent request submitted! An admin will review it.");
                      setNewAgentName("");
                      setShowAgentRequest(false);
                    } catch {
                      toast.error("Failed to submit request");
                    }
                    setRequestingAgent(false);
                  }}
                >
                  {requestingAgent ? "Sending..." : "Submit Request"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={() => { setShowAgentRequest(false); setNewAgentName(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm text-muted-foreground">Total Buy-In ($)</Label>
            <Input
              type="number"
              value={totalBuyIn}
              onChange={(e) => setTotalBuyIn(e.target.value)}
              placeholder="500"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Stake Available (%)</Label>
            <Input
              type="number"
              value={stakePercent}
              onChange={(e) => setStakePercent(e.target.value)}
              placeholder="50"
              max={75}
              className={`bg-secondary border-border text-foreground ${isOverLimit ? "border-destructive" : ""}`}
            />
          </div>
        </div>

        {/* Share Price */}
        <div>
          <Label className="text-sm text-muted-foreground">Share Price ($)</Label>
          <Input
            type="number"
            value={sharePrice}
            onChange={(e) => setSharePrice(e.target.value)}
            placeholder="e.g. 25"
            className="bg-secondary border-border text-foreground"
            min={1}
          />
        </div>

        <div className={`rounded-md p-3 text-xs ${isOverLimit ? "bg-destructive/10 border border-destructive/30" : "bg-primary/5 border border-primary/20"}`}>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Stake (75% Rule)</span>
            <span className={isOverLimit ? "text-destructive font-bold" : "text-primary font-semibold"}>
              {isOverLimit ? "⚠ OVER LIMIT" : "✓ Within Limit"}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-foreground font-medium">
              Stake Amount: <span className="text-accent font-display font-bold">${stakeAmount.toLocaleString()}</span>
            </span>
            <span className="text-muted-foreground">
              Your Skin: {buyInNum > 0 ? (100 - Math.min(percentNum, 100)).toFixed(0) : "—"}%
            </span>
          </div>
          {sharesAvailable > 0 && (
            <div className="flex justify-between mt-1">
              <span className="text-foreground font-medium">
                Shares: <span className="text-primary font-display font-bold">{sharesAvailable}</span>
              </span>
              <span className="text-muted-foreground">
                @ ${sharePriceNum} each
              </span>
            </div>
          )}
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Session End Time</Label>
          <Input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-secondary border-border text-foreground"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Stream URL (optional)</Label>
          <Input
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="https://kick.com/yourstream"
            className="bg-secondary border-border text-foreground"
          />
        </div>

        {/* Agent Disclosure */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-display font-bold text-sm text-foreground">Agent Disclosure (Required)</span>
          </div>
          <p className="text-[10px] text-muted-foreground">These terms will be shown to backers before they accept a stake. They form a binding agreement for dispute resolution.</p>
          <div>
            <Label className="text-sm text-muted-foreground">Agent Cashout Window</Label>
            <Input
              value={cashoutWindow}
              onChange={(e) => setCashoutWindow(e.target.value)}
              placeholder="e.g. 12pm - 10pm EST"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Daily Cashout Limit</Label>
            <Input
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              placeholder="e.g. $1,000 or Unlimited"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id="payout-agreement"
              checked={payoutAgreement}
              onCheckedChange={(v) => setPayoutAgreement(v === true)}
              className="mt-0.5"
            />
            <label htmlFor="payout-agreement" className="text-xs text-foreground leading-tight cursor-pointer">
              I agree to pay the Backer their pro-rata share within 60 minutes of any partial agent cashout.
            </label>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isOverLimit || submitting}
        className="w-full gradient-primary text-primary-foreground font-display font-bold text-base py-5"
      >
        {submitting ? "Creating..." : "🎯 LAUNCH SESSION"}
      </Button>

      {/* Payment Settings - persists across sessions */}
      <PaymentSettings />

      <SellerPaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </form>
  );
}
