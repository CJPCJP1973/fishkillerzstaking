import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Rocket, Clock, CheckCircle, DollarSign } from "lucide-react";

export default function BecomeSeller() {
  const { user, sellerStatus } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (sellerStatus === "active") {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30">
        <CheckCircle className="h-3 w-3 mr-1" /> Verified Seller
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

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error: reqError } = await supabase
        .from("seller_requests")
        .insert({ user_id: user.id } as any);
      if (reqError) throw reqError;

      const { error: profError } = await supabase
        .from("profiles")
        .update({ seller_status: "pending" } as any)
        .eq("user_id", user.id);
      if (profError) throw profError;

      toast.success("Request submitted! We'll verify your payment shortly.");
      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
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
          <DialogTitle className="font-display text-xl text-foreground">Unlock Seller Tools</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pay the one-time registration fee to unlock the ability to create and list sessions on FishKillerz.
          </p>
          <div className="gradient-card rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-foreground">Registration Fee: $10</span>
            </div>
            <p className="text-xs text-muted-foreground">Send payment to:</p>
            <div className="text-sm text-foreground">
              <span className="text-muted-foreground">CashApp:</span>{" "}
              <span className="text-primary font-bold text-base">$fishkllerzstaking</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            After sending $10 to <span className="text-primary font-medium">$fishkllerzstaking</span> on CashApp, click below. An admin will verify and activate your account within 24 hours.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full gradient-primary text-primary-foreground font-display font-bold"
          >
            {submitting ? "Submitting..." : "I've Paid $10 — Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
