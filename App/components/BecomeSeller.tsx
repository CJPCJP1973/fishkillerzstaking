import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Rocket, Clock, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BecomeSeller() {
  const { user, sellerStatus } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (sellerStatus === "active") {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30">
        <CheckCircle className="h-3 w-3 mr-1" /> Active Seller
      </Badge>
    );
  }

  if (sellerStatus === "pending") {
    return (
      <Badge className="bg-accent/20 text-accent border-accent/30">
        <Clock className="h-3 w-3 mr-1" /> Pending Verification
      </Badge>
    );
  }

  const handleActivate = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("start_seller_trial" as any);
      if (error) throw error;
      toast.success("Seller access activated! You can now create sessions 🎯");
      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to activate seller access");
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
            <span className="font-display font-bold text-foreground">100% Free to Sell</span>
            <p className="text-xs text-muted-foreground">
              No sign-up fees, no listing fees. A 5% platform rake is applied to backer winnings only.
              VIP sellers (invite-only) enjoy a reduced 2% rake.
            </p>
          </div>

          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              Create unlimited sessions instantly
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              No fees to list — ever
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary shrink-0" />
              Sell up to 75% of your buy-in
            </li>
          </ul>

          <Button
            onClick={handleActivate}
            disabled={submitting}
            className="w-full gradient-primary text-primary-foreground font-display font-bold"
          >
            {submitting ? "Activating..." : "🎯 Activate Seller Access"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
