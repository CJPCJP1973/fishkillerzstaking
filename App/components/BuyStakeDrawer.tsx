import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Crosshair, ShieldCheck, Wallet, AlertTriangle, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getRakeRate } from "@/lib/tierConfig";

interface BuyStakeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    shooterName: string;
    platform: string;
    stakeAvailable: number;
    stakeSold: number;
    pendingAmount: number;
    totalBuyIn: number;
  };
  onPurchased?: () => void;
}

export default function BuyStakeDrawer({ open, onOpenChange, session, onPurchased }: BuyStakeDrawerProps) {
  const { user, isVip } = useAuth();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [agentTerms, setAgentTerms] = useState<{ cashout_window: string | null; daily_limit: string | null } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const remaining = session.stakeAvailable - session.stakeSold - session.pendingAmount;
  const sharePrice = Math.min(remaining, 50);
  const rakeRate = getRakeRate(isVip);

  const [shooterFraudFlags, setShooterFraudFlags] = useState(0);

  useEffect(() => {
    if (open && user) {
      supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setBalance(Number((data as any).balance));
        });

      // Fetch shooter fraud flags
      supabase
        .from("sessions")
        .select("shooter_id")
        .eq("id", session.id)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase
              .from("profiles")
              .select("fraud_flags")
              .eq("user_id", (data as any).shooter_id)
              .single()
              .then(({ data: profile }) => {
                if (profile) setShooterFraudFlags((profile as any).fraud_flags ?? 0);
              });
          }
        });

      // Fetch agent disclosure terms
      supabase
        .from("sessions")
        .select("agent_cashout_window, agent_daily_limit")
        .eq("id", session.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setAgentTerms({
              cashout_window: (data as any).agent_cashout_window,
              daily_limit: (data as any).agent_daily_limit,
            });
          }
        });

      setTermsAccepted(false);
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be signed in to buy a stake");
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid stake amount");
      return;
    }
    if (numAmount > remaining) {
      toast.error(`Maximum available: $${remaining.toLocaleString()}`);
      return;
    }
    if (!termsAccepted) {
      toast.error("You must accept the terms before purchasing");
      return;
    }
    if (numAmount > balance) {
      toast.error(`Insufficient FishDollarz balance. You have $${balance.toLocaleString()}`);
      return;
    }

    setSubmitting(true);
    try {
      // Deduct from balance atomically
      const { error: balanceError } = await supabase.rpc("adjust_balance", {
        target_uid: user.id,
        delta: -numAmount,
      });
      if (balanceError) throw balanceError;

      const { error } = await supabase.from("stakes").insert({
        session_id: session.id,
        backer_id: user.id,
        amount: numAmount,
        payment_method: "FishDollarz",
        deposit_confirmed: true,
        payment_mode: "fishdollarz",
        rake_rate: rakeRate,
        backer_confirmed: true,
      } as any);

      if (error) {
        await supabase.rpc("adjust_balance", { target_uid: user.id, delta: numAmount });
        throw error;
      }

      // Log transaction and update session
      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: numAmount,
        type: "stake",
        status: "completed",
        payment_method: "FishDollarz",
        notes: `Stake on ${session.shooterName} (${session.platform})`,
      } as any);

      await supabase
        .from("sessions")
        .update({ stake_sold: (session.stakeSold || 0) + numAmount })
        .eq("id", session.id);

      toast.success(`Stake purchased! ${(rakeRate * 100).toFixed(0)}% rake applies to winnings.`);
      setAmount("");
      onOpenChange(false);
      onPurchased?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit stake");
    }
    setSubmitting(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background border-border w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Secure Your Stake
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Transaction Details */}
          <div className="gradient-card rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Crosshair className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Shooter:</span>
              <span className="text-foreground font-medium">{session.shooterName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Game:</span>
              <span className="text-foreground font-medium">{session.platform}</span>
            </div>
            <Separator className="bg-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Buy-In</span>
              <span className="text-foreground font-display font-bold">${session.totalBuyIn.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Stake</span>
              <span className="text-success font-display font-bold">${remaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Rake</span>
              <span className="text-accent font-display font-bold">{(rakeRate * 100).toFixed(0)}%{isVip ? " (VIP)" : ""}</span>
            </div>
          </div>

          {/* Fraud Flag Warning */}
          {shooterFraudFlags >= 2 && (
            <div className={`rounded-lg border p-3 flex items-start gap-2 ${
              shooterFraudFlags >= 3
                ? "border-destructive/40 bg-destructive/10"
                : "border-accent/40 bg-accent/10"
            }`}>
              <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                shooterFraudFlags >= 3 ? "text-destructive" : "text-accent"
              }`} />
              <div className={`text-xs ${shooterFraudFlags >= 3 ? "text-destructive" : "text-accent"}`}>
                <p className="font-display font-bold">
                  {shooterFraudFlags >= 3 ? "⚠️ High Risk Shooter" : "⚠️ Caution"}
                </p>
                <p className="mt-0.5">
                  This shooter has {shooterFraudFlags} fraud flag{shooterFraudFlags !== 1 ? "s" : ""}.
                  {shooterFraudFlags >= 3
                    ? " Staking is strongly discouraged — this account may be banned."
                    : " Proceed with caution and verify session details."}
                </p>
              </div>
            </div>
          )}

          {/* Stake Amount */}
          <div>
            <Label className="text-sm text-muted-foreground">Your Stake Amount ($)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`e.g. ${sharePrice}`}
              className="bg-secondary border-border text-foreground text-lg font-display"
              min={1}
              max={remaining}
            />
          </div>

          {/* Balance Display */}
          <div className="gradient-card rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Your Balance
              </span>
              <span className="text-accent font-display font-bold text-lg">${balance.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              FishDollarz deducted instantly. A {(rakeRate * 100).toFixed(0)}% platform rake applies to winnings{isVip ? " (VIP rate)" : ""}.
            </p>
          </div>

          {/* Agent Disclosure Terms */}
          {(agentTerms?.cashout_window || agentTerms?.daily_limit) && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-display font-bold text-sm text-foreground">Agent Disclosure Terms</span>
              </div>
              {agentTerms.cashout_window && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cashout Window</span>
                  <span className="text-foreground font-medium">{agentTerms.cashout_window}</span>
                </div>
              )}
              {agentTerms.daily_limit && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Cashout Limit</span>
                  <span className="text-foreground font-medium">{agentTerms.daily_limit}</span>
                </div>
              )}
              <Separator className="bg-border" />
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="accept-terms"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="accept-terms" className="text-xs text-foreground leading-tight cursor-pointer">
                  I accept the agent disclosure terms and understand a {(rakeRate * 100).toFixed(0)}% platform rake applies to my winnings.
                </label>
              </div>
            </div>
          )}

          {/* If no agent terms, still require generic acceptance */}
          {!agentTerms?.cashout_window && !agentTerms?.daily_limit && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="accept-terms-generic"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="accept-terms-generic" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                I accept the staking terms and understand a {(rakeRate * 100).toFixed(0)}% platform rake applies to my winnings.
              </label>
            </div>
          )}

          {/* Submit */}
          {shooterFraudFlags >= 3 ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-center space-y-1">
              <AlertTriangle className="h-5 w-5 text-destructive mx-auto" />
              <p className="font-display font-bold text-sm text-destructive">Staking Blocked</p>
              <p className="text-xs text-destructive/80">This shooter has been flagged for fraud and is banned. You cannot stake on this session.</p>
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !amount || !termsAccepted}
              className="w-full gradient-primary text-primary-foreground font-display font-bold text-base py-5"
            >
              {submitting ? "Submitting..." : "PAY WITH FISHDOLLARZ"}
            </Button>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            FishDollarz will be deducted and your stake confirmed instantly.
          </p>
          <p className="text-[9px] text-muted-foreground/60 text-center italic">
            FishDollarz are virtual items with no real-world value outside the FishKillerz platform.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
