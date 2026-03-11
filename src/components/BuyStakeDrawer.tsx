import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Crosshair, ShieldCheck, Wallet, Info, AlertTriangle, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

type PaymentMode = "fishdollarz" | "p2p";

export default function BuyStakeDrawer({ open, onOpenChange, session, onPurchased }: BuyStakeDrawerProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [confirmationRef, setConfirmationRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("fishdollarz");
  const [balance, setBalance] = useState<number>(0);
  const [reliabilityScore, setReliabilityScore] = useState<number>(75);
  const [forceFishdollarz, setForceFishdollarz] = useState(false);
  const [agentTerms, setAgentTerms] = useState<{ cashout_window: string | null; daily_limit: string | null } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const remaining = session.stakeAvailable - session.stakeSold - session.pendingAmount;
  const sharePrice = Math.min(remaining, 50);

  const [shooterTier, setShooterTier] = useState(1);
  const [shooterFraudFlags, setShooterFraudFlags] = useState(0);

  // Rake is determined by the shooter's tier
  const tierRakeMap: Record<number, number> = { 1: 8, 2: 6, 3: 4, 4: 2 };
  const sessionRake = tierRakeMap[shooterTier] ?? 8;
  // FishDollarz gets a 2% discount on rake (min 2%)
  const FISHDOLLARZ_FEE = Math.max(2, sessionRake - 2);
  const P2P_FEE = sessionRake;

  useEffect(() => {
    if (open && user) {
      supabase
        .from("profiles")
        .select("balance, reliability_score")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setBalance(Number((data as any).balance));
            const score = Number((data as any).reliability_score ?? 75);
            setReliabilityScore(score);
            if (score < 50) {
              setForceFishdollarz(true);
              setPaymentMode("fishdollarz");
            } else {
              setForceFishdollarz(false);
            }
          }
        });

      // Fetch shooter tier
      supabase
        .from("sessions")
        .select("shooter_id")
        .eq("id", session.id)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase
              .from("profiles")
              .select("seller_tier, fraud_flags")
              .eq("user_id", (data as any).shooter_id)
              .single()
              .then(({ data: profile }) => {
                if (profile) {
                  setShooterTier((profile as any).seller_tier ?? 1);
                  setShooterFraudFlags((profile as any).fraud_flags ?? 0);
                }
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
      toast.error("You must accept the agent disclosure terms before purchasing");
      return;
    }

    if (paymentMode === "fishdollarz") {
      if (numAmount > balance) {
        toast.error(`Insufficient FishDollarz balance. You have $${balance.toLocaleString()}`);
        return;
      }
    } else {
      if (!confirmationRef.trim()) {
        toast.error("Please enter your payment confirmation or username");
        return;
      }
    }

    setSubmitting(true);
    try {
      const rakeRate = paymentMode === "fishdollarz" ? FISHDOLLARZ_FEE / 100 : P2P_FEE / 100;

      if (paymentMode === "fishdollarz") {
        // Deduct from balance atomically
        const { error: balanceError } = await supabase.rpc("adjust_balance", {
          target_uid: user.id,
          delta: -numAmount,
        });
        if (balanceError) throw balanceError;
      }

      const { error } = await supabase.from("stakes").insert({
        session_id: session.id,
        backer_id: user.id,
        amount: numAmount,
        payment_method: paymentMode === "fishdollarz" ? "FishDollarz" : confirmationRef.trim(),
        deposit_confirmed: paymentMode === "fishdollarz",
        payment_mode: paymentMode,
        rake_rate: rakeRate,
        backer_confirmed: paymentMode === "fishdollarz", // auto for fishdollarz
      } as any);

      if (error) {
        // Rollback balance if stake insert fails
        if (paymentMode === "fishdollarz") {
          await supabase.rpc("adjust_balance", { target_uid: user.id, delta: numAmount });
        }
        throw error;
      }

      // Update stake_sold on session for FishDollarz (auto-confirmed)
      if (paymentMode === "fishdollarz") {
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
      }

      toast.success(
        paymentMode === "fishdollarz"
          ? `Stake purchased with FishDollarz! (${FISHDOLLARZ_FEE}% fee applies on settlement) ✅`
          : `Stake submitted via P2P! (${P2P_FEE}% fee applies) Awaiting admin verification.`
      );
      setAmount("");
      setConfirmationRef("");
      setPaymentMode(forceFishdollarz ? "fishdollarz" : "fishdollarz");
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

          {/* Reliability Score Warning */}
          {forceFishdollarz && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-xs text-destructive">
                <p className="font-display font-bold">Low Reliability Score ({reliabilityScore}/100)</p>
                <p>You must use FishDollarz until your score recovers above 50.</p>
              </div>
            </div>
          )}

          {/* Payment Mode Toggle */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm text-muted-foreground">Payment Mode</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] text-xs bg-card border-border">
                    <p><strong>FishDollarz (6% fee):</strong> Automatic & instant. Deducted from your balance immediately.</p>
                    <p className="mt-1"><strong>P2P Direct Pay (8% fee):</strong> Manual confirmation required. Pay the seller directly.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode("fishdollarz")}
                className={`rounded-lg border p-3 text-center text-sm font-display font-bold transition-all ${
                  paymentMode === "fishdollarz"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-secondary text-muted-foreground hover:border-accent/50"
                }`}
              >
                <Wallet className="h-4 w-4 mx-auto mb-1" />
                FishDollarz
                <span className="block text-[10px] font-normal mt-0.5 text-muted-foreground">6% fee • Automatic</span>
              </button>
              <button
                type="button"
                onClick={() => !forceFishdollarz && setPaymentMode("p2p")}
                disabled={forceFishdollarz}
                className={`rounded-lg border p-3 text-center text-sm font-display font-bold transition-all ${
                  forceFishdollarz
                    ? "border-border bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
                    : paymentMode === "p2p"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                }`}
              >
                <DollarSign className="h-4 w-4 mx-auto mb-1" />
                P2P Direct Pay
                <span className="block text-[10px] font-normal mt-0.5 text-muted-foreground">8% fee • Manual</span>
              </button>
            </div>
          </div>

          {paymentMode === "fishdollarz" ? (
            <div className="gradient-card rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-display font-bold text-foreground">Your Balance</span>
                <span className="text-accent font-display font-bold text-lg">${balance.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                FishDollarz will be deducted instantly and the stake will be auto-confirmed. A 6% platform fee applies when the session is settled.
              </p>
            </div>
          ) : (
            <>
              {/* Payment Instructions */}
              <div className="gradient-card rounded-lg p-4 space-y-2">
                <p className="text-sm font-display font-bold text-foreground">P2P Payment Instructions</p>
                <p className="text-xs text-muted-foreground">Send your stake to one of these:</p>
                <ul className="text-sm text-foreground space-y-1.5">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">CashApp</span>
                    <span className="text-primary font-medium">$fishkillerzstaking</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Chime</span>
                    <span className="text-primary font-medium">$Christopher-Preston-57</span>
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="text-muted-foreground">BTC Lightning</span>
                    <span className="text-primary font-medium text-[10px] break-all leading-tight">lnbc1p56n7qwdqdgdshx6pqg9c8qpp56a7vzmdycc623vrv9epn4neyhukmd40g3lanh6g3nrcxeygwandssp5rcvscch4c3prl9tnqtpvwhh0wdkdnrra2tw84wkuqvtalz2lkk7s9qrsgqcqpcxqy8ayqrzjqfrjnu747au57n0sn07m0j3r5na7dsufjlxayy7xjj3vegwz0ja3wzygxyqqxrcqqyqqqqqqqqqqqqqq9grzjqfzhphca8jlc5zznw52mnqxsnymltjgg3lxe4ul82g42vw0jpkgkwzl4v5qqgucqquqqqqqqqqqqqqqq9grcp0zy9rwe6vfmgqjt8089c4nya3226wq0782nk7nvd5mt96v63nfumays3jy3krz6lxp4vzzumyvfpxfydf49h9hgx0caz8uw82emqq64snp</span>
                  </li>
                </ul>
              </div>

              {/* Confirmation Field */}
              <div>
                <Label className="text-sm text-muted-foreground">
                  Payment Confirmation # or Username
                </Label>
                <Input
                  value={confirmationRef}
                  onChange={(e) => setConfirmationRef(e.target.value)}
                  placeholder="Paste confirmation # or your CashApp tag"
                  className="bg-secondary border-border text-foreground"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Required so the admin can verify your payment. An 8% platform fee applies on settlement.
                </p>
              </div>
            </>
          )}

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
                  I accept the agent disclosure terms and understand the seller agrees to pay my pro-rata share within 60 minutes of any partial agent cashout.
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
                I accept the staking terms and understand the applicable platform fee.
              </label>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !amount ||
              !termsAccepted ||
              (paymentMode === "p2p" && !confirmationRef.trim())
            }
            className="w-full gradient-primary text-primary-foreground font-display font-bold text-base py-5"
          >
            {submitting
              ? "Submitting..."
              : paymentMode === "fishdollarz"
              ? `PAY WITH FISHDOLLARZ (${FISHDOLLARZ_FEE}% FEE)`
              : `CONFIRM P2P PAYMENT (${P2P_FEE}% FEE)`}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            {paymentMode === "fishdollarz"
              ? "FishDollarz will be deducted and your stake confirmed instantly."
              : "Your stake will show as Pending (yellow) until the admin verifies your payment."}
          </p>
          <p className="text-[9px] text-muted-foreground/60 text-center italic">
            FishDollarz are virtual items with no real-world value outside the FishKillerz platform.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
