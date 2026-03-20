import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Lock, DollarSign, CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SellerPaywallModal({ open, onOpenChange }: Props) {
  const { user, username } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitPayment = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Create a seller request for admin verification
      const { error: reqError } = await supabase
        .from("seller_requests")
        .insert({ user_id: user.id } as any);
      if (reqError) throw reqError;

      // Notify admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "Seller Payment Submitted 💰",
            message: `${username || "A seller"} submitted $1 payment to unlock unlimited sessions.`,
            type: "seller_payment",
          } as any);
        }
      }

      toast.success("Payment submitted! An admin will verify and unlock your account within 24 hours.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-accent" /> Upgrade to Unlimited
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your free trial session is complete! Unlock unlimited sessions with a one-time fee.
          </p>

          <div className="gradient-card rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-foreground">
                One-Time Fee: <span className="text-primary">$1</span>{" "}
                <span className="text-xs text-muted-foreground">(first 50 — normally $10)</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Send payment to:</p>
            <div className="text-sm text-foreground">
              <span className="text-muted-foreground">CashApp:</span>{" "}
              <span className="text-primary font-bold text-base">$fishkillerzstaking</span>
            </div>
          </div>

          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              Unlimited session creation
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              Lifetime seller access
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              Admin verifies within 24 hours
            </li>
          </ul>

          <Button
            onClick={handleSubmitPayment}
            disabled={submitting}
            className="w-full gradient-primary text-primary-foreground font-display font-bold"
          >
            {submitting ? "Submitting..." : "I've Paid $1 — Unlock Unlimited"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
