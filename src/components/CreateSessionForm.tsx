import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Crosshair } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const platforms = [
  "Golden Dragon",
  "Diamond Dragon",
  "Fire Phoenix",
  "Vblink",
  "Riversweeps",
  "Magic City",
];

export default function CreateSessionForm() {
  const { user, username } = useAuth();
  const [shooterName, setShooterName] = useState(username || "");
  const [platform, setPlatform] = useState("");
  const [agentRoom, setAgentRoom] = useState("");
  const [totalBuyIn, setTotalBuyIn] = useState("");
  const [stakePercent, setStakePercent] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sharePrice, setSharePrice] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const buyInNum = parseFloat(totalBuyIn) || 0;
  const percentNum = parseFloat(stakePercent) || 0;
  const sharePriceNum = parseFloat(sharePrice) || 0;
  const maxPercent = 75;
  const stakeAmount = buyInNum * (Math.min(percentNum, maxPercent) / 100);
  const isOverLimit = percentNum > maxPercent;
  const sharesAvailable = sharePriceNum > 0 ? Math.floor(stakeAmount / sharePriceNum) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) {
      toast.error("Maximum stake is 75%. You must keep 25% skin-in-the-game!");
      return;
    }
    if (!shooterName || !platform || !agentRoom || !totalBuyIn || !stakePercent || !sharePrice || !endTime) {
      toast.error("Please fill in all fields");
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
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Create Session</h2>
          <p className="text-xs text-muted-foreground">List a new staking session for backers</p>
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
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {platforms.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Agent / Room Name</Label>
          <Input
            value={agentRoom}
            onChange={(e) => setAgentRoom(e.target.value)}
            placeholder="e.g. Room #42"
            className="bg-secondary border-border text-foreground"
          />
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
      </div>

      <Button
        type="submit"
        disabled={isOverLimit || submitting}
        className="w-full gradient-primary text-primary-foreground font-display font-bold text-base py-5"
      >
        {submitting ? "Creating..." : "🎯 LAUNCH SESSION"}
      </Button>
    </form>
  );
}
