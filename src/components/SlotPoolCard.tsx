import { useEffect, useState } from "react";
import { Dice5, DollarSign, Users, Clock, Trash2, ShieldCheck, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PlatformBadge from "@/components/PlatformBadge";
import BuySeatDrawer from "@/components/BuySeatDrawer";
import { supabase } from "@/integrations/supabase/client";

export interface SlotPoolData {
  id: string;
  owner_id: string;
  name: string;
  platform: string;
  buy_in: number;
  seats: number;
  seat_price: number;
  seats_sold: number;
  end_time: string;
  status: string;
  admin_confirmed_deposit?: boolean;
  admin_released_winnings?: boolean;
  winnings?: number | null;
  deposit_proof_url?: string | null;
  payout_proof_url?: string | null;
}

const statusStyles: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  funding: "bg-primary/20 text-primary border-primary/30",
  live: "bg-live/20 text-live border-live/30",
  full: "bg-success/20 text-success border-success/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  closed: "bg-secondary text-muted-foreground border-border",
};

export default function SlotPoolCard({
  pool,
  isOwner,
  onDelete,
}: {
  pool: SlotPoolData;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingSeats, setPendingSeats] = useState(0);
  const [proofUrl, setProofUrl] = useState("");
  const [savingProof, setSavingProof] = useState(false);

  const seatsLeft = Math.max(0, pool.seats - pool.seats_sold - pendingSeats);
  const filled = pool.seats > 0 ? Math.min(100, ((pool.seats_sold + pendingSeats) / pool.seats) * 100) : 0;
  const escrow = pool.seats_sold * Number(pool.seat_price);
  const openForSeats = ["open", "funding"].includes(pool.status) && seatsLeft > 0;
  const proofType = pool.admin_confirmed_deposit ? "payout" : "deposit";

  const fetchPending = async () => {
    const { data } = await supabase
      .from("slot_pool_seats" as any)
      .select("seats, deposit_confirmed")
      .eq("pool_id", pool.id);
    const pending = ((data as any[]) || [])
      .filter((s) => !s.deposit_confirmed)
      .reduce((sum, s) => sum + Number(s.seats || 0), 0);
    setPendingSeats(pending);
  };

  useEffect(() => {
    fetchPending();
  }, [pool.id, pool.seats_sold]);

  const saveProof = async () => {
    if (!/^https?:\/\/\S+$/i.test(proofUrl.trim())) {
      toast.error("Enter a valid https link to your proof");
      return;
    }
    setSavingProof(true);
    const field = proofType === "deposit" ? "deposit_proof_url" : "payout_proof_url";
    const { error } = await supabase
      .from("slot_pools")
      .update({ [field]: proofUrl.trim() } as any)
      .eq("id", pool.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${proofType === "deposit" ? "Deposit" : "Payout"} proof submitted for review`);
      setProofUrl("");
    }
    setSavingProof(false);
  };

  return (
    <>
      <div className="gradient-card rounded-lg p-4 hover:border-primary/30 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Dice5 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-base leading-tight">{pool.name}</h3>
              <PlatformBadge platform={pool.platform} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pool.admin_confirmed_deposit && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-success bg-success/10 rounded px-1.5 py-0.5">
                <ShieldCheck className="h-3 w-3" /> ESCROW
              </span>
            )}
            <Badge
              variant="outline"
              className={statusStyles[pool.status] || "bg-secondary text-muted-foreground border-border"}
            >
              {(pool.status || "").toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Seats Left</span>
            <p className="text-foreground font-medium">
              {seatsLeft} / {pool.seats}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Buy-In</span>
            <p className="text-accent font-display font-bold text-lg">${Number(pool.buy_in).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Seat Price</span>
            <p className="text-primary font-display font-bold text-lg flex items-center">
              <DollarSign className="h-4 w-4" />
              {Number(pool.seat_price).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Fill progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {pool.seats_sold} confirmed
              {pendingSeats > 0 && <span className="text-warning">· {pendingSeats} pending</span>}
            </span>
            <span className="text-accent font-medium">
              ${escrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in escrow
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${filled}%` }} />
          </div>
        </div>

        {/* Owner proof submission */}
        {isOwner && !pool.admin_released_winnings && (
          <div className="mb-3 rounded-md border border-border/60 bg-secondary/40 p-2 space-y-2">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              {proofType === "deposit"
                ? "Submit deposit proof link so an admin can confirm and go live."
                : "Submit payout/stream proof link so an admin can release winnings."}
            </p>
            <div className="flex gap-2">
              <Input
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://…"
                className="h-8 text-xs"
              />
              <Button size="sm" className="h-8 text-xs" disabled={savingProof} onClick={saveProof}>
                Submit
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Ends {new Date(pool.end_time).toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            {openForSeats && !isOwner && (
              <Button size="sm" className="gradient-primary font-display font-bold text-xs" onClick={() => setDrawerOpen(true)}>
                Buy Seat
              </Button>
            )}
            {isOwner && onDelete && !pool.admin_confirmed_deposit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(pool.id)}
                className="text-destructive border-destructive/30 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <BuySeatDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        pool={pool}
        pendingSeats={pendingSeats}
        onPurchased={fetchPending}
      />
    </>
  );
}
