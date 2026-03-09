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

interface ConfirmedAgent {
  id: string;
  agent_name: string;
}

export default function CreateSessionForm() {
  const { user, username, sellerTier } = useAuth();
  const tierConfig = getTierConfig(sellerTier);
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

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from("confirmed_agents")
        .select("id, agent_name")
        .order("agent_name", { ascending: true });
      if (data) setAgents(data as any);
    };
    fetchAgents();
  }, []);

  const buyInNum = parseFloat(totalBuyIn) || 0;
  const percentNum = parseFloat(stakePercent) || 0;
  const sharePriceNum = parseFloat(sharePrice) || 0;
  const maxPercent = tierConfig.maxStakePercent;
  const stakeAmount = buyInNum * (Math.min(percentNum, maxPercent) / 100);
  const isOverLimit = percentNum > maxPercent;
  const sharesAvailable = sharePriceNum > 0 ? Math.floor(stakeAmount / sharePriceNum) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          </div>
          <p className="text-xs text-muted-foreground">
            Max stake: {tierConfig.maxStakePercent}% · Rake: {tierConfig.rakePercent}%
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
          <Input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. Golden Dragon"
            className="bg-secondary border-border text-foreground"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Agent</Label>
          <Select value={agentRoom} onValueChange={setAgentRoom}>
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="Select confirmed agent" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {agents.length > 0 ? agents.map((a) => (
                <SelectItem key={a.id} value={a.agent_name}>{a.agent_name}</SelectItem>
              )) : (
                <div className="px-3 py-2 text-xs text-muted-foreground">No agents available. Admin must add agents first.</div>
              )}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">Only admin-approved agents are available.</p>
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
    </form>
  );
}
