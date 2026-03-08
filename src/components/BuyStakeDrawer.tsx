import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Crosshair, ShieldCheck, Wallet } from "lucide-react";

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

type PaymentMethod = "external" | "fishdollarz";

export default function BuyStakeDrawer({ open, onOpenChange, session, onPurchased }: BuyStakeDrawerProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [confirmationRef, setConfirmationRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("external");
  const [balance, setBalance] = useState<number>(0);

  const remaining = session.stakeAvailable - session.stakeSold - session.pendingAmount;
  const sharePrice = Math.min(remaining, 50);

  useEffect(() => {
    if (open && user) {
      supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setBalance(Number(data.balance));
        });
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

    if (paymentMethod === "fishdollarz") {
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
      if (paymentMethod === "fishdollarz") {
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
        payment_method: paymentMethod === "fishdollarz" ? "FishDollarz" : confirmationRef.trim(),
        deposit_confirmed: paymentMethod === "fishdollarz", // auto-confirm FishDollarz
      });

      if (error) {
        // Rollback balance if stake insert fails
        if (paymentMethod === "fishdollarz") {
          await supabase.rpc("adjust_balance", { target_uid: user.id, delta: numAmount });
        }
        throw error;
      }

      // Update stake_sold on session for FishDollarz (auto-confirmed)
      if (paymentMethod === "fishdollarz") {
        await supabase
          .from("sessions")
          .update({ stake_sold: (session.stakeSold || 0) + numAmount })
          .eq("id", session.id);
      }

      toast.success(
        paymentMethod === "fishdollarz"
          ? "Stake purchased with FishDollarz! ✅"
          : "Stake submitted! Awaiting admin verification."
      );
      setAmount("");
      setConfirmationRef("");
      setPaymentMethod("external");
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
            {sharePrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Suggested Share</span>
                <span className="text-primary font-display font-bold">${sharePrice.toLocaleString()}</span>
              </div>
            )}
          </div>

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

          {/* Payment Method Toggle */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("external")}
                className={`rounded-lg border p-3 text-center text-sm font-display font-bold transition-all ${
                  paymentMethod === "external"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                }`}
              >
                <DollarSign className="h-4 w-4 mx-auto mb-1" />
                CashApp / Chime / BTC
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("fishdollarz")}
                className={`rounded-lg border p-3 text-center text-sm font-display font-bold transition-all ${
                  paymentMethod === "fishdollarz"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-secondary text-muted-foreground hover:border-accent/50"
                }`}
              >
                <Wallet className="h-4 w-4 mx-auto mb-1" />
                FishDollarz
              </button>
            </div>
          </div>

          {paymentMethod === "fishdollarz" ? (
            <div className="gradient-card rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-display font-bold text-foreground">Your Balance</span>
                <span className="text-accent font-display font-bold text-lg">${balance.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                FishDollarz will be deducted instantly and the stake will be auto-confirmed.
              </p>
            </div>
          ) : (
            <>
              {/* Payment Instructions */}
              <div className="gradient-card rounded-lg p-4 space-y-2">
                <p className="text-sm font-display font-bold text-foreground">Payment Instructions</p>
                <p className="text-xs text-muted-foreground">Send your stake to one of these:</p>
                <ul className="text-sm text-foreground space-y-1.5">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">CashApp</span>
                    <span className="text-primary font-medium">$fishkllerzstaking</span>
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
                  Required so the admin can verify your payment
                </p>
              </div>
            </>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !amount ||
              (paymentMethod === "external" && !confirmationRef.trim())
            }
            className="w-full gradient-primary text-primary-foreground font-display font-bold text-base py-5"
          >
            {submitting
              ? "Submitting..."
              : paymentMethod === "fishdollarz"
              ? "PAY WITH FISHDOLLARZ"
              : "CONFIRM PAYMENT"}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            {paymentMethod === "fishdollarz"
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
