import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dice5, Wallet, ShieldCheck } from "lucide-react";
import type { SlotPoolData } from "@/components/SlotPoolCard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pool: SlotPoolData;
  pendingSeats?: number;
  onPurchased?: () => void;
}

export default function BuySeatDrawer({ open, onOpenChange, pool, pendingSeats = 0, onPurchased }: Props) {
  const { user } = useAuth();
  const [seats, setSeats] = useState("1");
  const [mode, setMode] = useState<"fishdollarz" | "p2p">("fishdollarz");
  const [balance, setBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const seatsLeft = Math.max(0, pool.seats - pool.seats_sold - pendingSeats);
  const qty = Math.max(0, parseInt(seats || "0", 10) || 0);
  const total = qty * Number(pool.seat_price);

  useEffect(() => {
    if (open && user) {
      supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => data && setBalance(Number((data as any).balance)));
    }
  }, [open, user]);

  const handleBuy = async () => {
    if (!user) {
      toast.error("Sign in to buy a seat");
      return;
    }
    if (qty < 1 || qty > seatsLeft) {
      toast.error(`Choose between 1 and ${seatsLeft} seat(s)`);
      return;
    }
    if (mode === "fishdollarz" && total > balance) {
      toast.error("Not enough FishDollarz — top up your wallet first");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("slot_pool_seats" as any).insert({
        pool_id: pool.id,
        backer_id: user.id,
        seats: qty,
        amount: total,
        payment_mode: mode,
      } as any);
      if (error) throw error;

      // Notify the pool owner that funding came in (pending admin confirmation)
      await supabase.from("notifications").insert({
        user_id: pool.owner_id,
        title: "New Seat Purchase 🎰",
        message: `${qty} seat(s) ($${total.toFixed(2)}) committed to "${pool.name}". Funds are held in escrow until an admin confirms the deposit.`,
        type: "info",
      } as any);

      toast.success("Seat reserved — awaiting admin deposit confirmation");
      onOpenChange(false);
      setSeats("1");
      onPurchased?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to buy seat");
    }
    setSubmitting(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <Dice5 className="h-5 w-5 text-primary" /> Buy Seats — {pool.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="gradient-card rounded-lg p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Seat Price</p>
              <p className="font-display font-bold text-primary">${Number(pool.seat_price).toFixed(2)}</p>
            </div>
            <div className="gradient-card rounded-lg p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Seats Left</p>
              <p className="font-display font-bold text-foreground">{seatsLeft}</p>
            </div>
            <div className="gradient-card rounded-lg p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Buy-In</p>
              <p className="font-display font-bold text-accent">${Number(pool.buy_in).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seat-qty">Number of seats</Label>
            <Input
              id="seat-qty"
              type="number"
              min={1}
              max={seatsLeft}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("fishdollarz")}
              className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                mode === "fishdollarz"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-1 font-bold">
                <Wallet className="h-3.5 w-3.5" /> FishDollarz
              </span>
              <span className="block mt-1">Balance ${balance.toFixed(2)}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("p2p")}
              className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                mode === "p2p"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-1 font-bold">
                <ShieldCheck className="h-3.5 w-3.5" /> P2P
              </span>
              <span className="block mt-1">Manual admin verification</span>
            </button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-xl font-bold text-accent">${total.toFixed(2)}</span>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Funds are held in escrow. An admin confirms your deposit before the pool goes live, and winnings are
            released only after the pool result is verified.
          </p>

          <Button className="w-full gradient-primary font-display font-bold" disabled={submitting} onClick={handleBuy}>
            {submitting ? "Reserving…" : `Buy ${qty || 0} Seat(s)`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
