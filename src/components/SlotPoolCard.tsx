import { Dice5, DollarSign, Users, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PlatformBadge from "@/components/PlatformBadge";

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
  const seatsLeft = Math.max(0, pool.seats - pool.seats_sold);
  const filled = pool.seats > 0 ? Math.min(100, (pool.seats_sold / pool.seats) * 100) : 0;
  const escrow = pool.seats_sold * Number(pool.seat_price);

  return (
    <div className="gradient-card rounded-lg p-4 hover:border-primary/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Dice5 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-base leading-tight">
              {pool.name}
            </h3>
            <PlatformBadge platform={pool.platform} />
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <p className="text-accent font-display font-bold text-lg">
            ${Number(pool.buy_in).toLocaleString()}
          </p>
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
            <Users className="h-3 w-3" /> {pool.seats_sold} seats sold
          </span>
          <span className="text-accent font-medium">
            ${escrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in pool
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${filled}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> Ends {new Date(pool.end_time).toLocaleString()}
        </span>
        {isOwner && onDelete && (
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
  );
}
