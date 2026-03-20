import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Rocket, Clock, CheckCircle, Zap } from "lucide-react";

export default function BecomeSeller() {
  const { user, sellerStatus, sellerPaid } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (sellerStatus === "active") {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-primary/20 text-primary border-primary/30">
          <CheckCircle className="h-3 w-3 mr-1" /> Verified Seller
        </Badge>
        {!sellerPaid && (
          <Badge variant="outline" className="border-accent/40 text-accent text-[10px]">
            Free Trial
          </Badge>
        )}
      </div>
    );
  }

  if (sellerStatus === "pending") {
    return (
      <Badge className="bg-accent/20 text-accent border-accent/30">
        <Clock className="h-3 w-3 mr-1" /> Pending Verification
      </Badge>
    );
  }

  const handleStartTrial = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("start_seller_trial" as any);
      if (error) throw error;
      toast.success("Free trial activated! Create your first session now 🎯");
      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to start trial");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground font-display font-bold">
          <Rocket className="h-4 w-4 mr-2" /> Become a Seller
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">Start Selling Stakes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="gradient-card rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <span className="font-display font-bold text-foreground">Your First Session is FREE!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Try selling stakes with zero commitment. After your first session, a one-time fee of{" "}
              <span className="text-primary font-medium">$1</span>{" "}
              <span className="text-muted-foreground">(first 50 sign-ups — normally $10)</span>{" "}
              unlocks unlimited sessions.
            </p>
          </div>

          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              Create &amp; list your first session instantly
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              No payment required for your trial
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              Upgrade to unlimited sessions for just $1
            </li>
          </ul>

          <Button
            onClick={handleStartTrial}
            disabled={submitting}
            className="w-full gradient-primary text-primary-foreground font-display font-bold"
          >
            {submitting ? "Activating..." : "⚡ Start Free Trial"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
