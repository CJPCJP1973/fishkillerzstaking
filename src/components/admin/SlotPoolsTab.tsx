import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Dice5, Trash2, Loader2, Ban, CheckCircle2, DollarSign } from "lucide-react";
import PlatformBadge from "@/components/PlatformBadge";

interface PoolRow {
  id: string;
  owner_id: string;
  name: string;
  platform: string;
  buy_in: number;
  seats: number;
  seats_sold: number;
  seat_price: number;
  end_time: string;
  status: string;
  created_at: string;
  owner_name?: string | null;
  owner_username?: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-primary/15 text-primary border-primary/30",
  funding: "bg-primary/15 text-primary border-primary/30",
  live: "bg-live/15 text-live border-live/30",
  full: "bg-success/15 text-success border-success/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export default function SlotPoolsTab() {
  const [pools, setPools] = useState<PoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("slot_pools")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows = (data || []) as any as PoolRow[];
    const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
    if (ownerIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", ownerIds);
      for (const p of rows) {
        const prof = profiles?.find((x: any) => x.user_id === p.owner_id);
        p.owner_name = prof?.display_name ?? null;
        p.owner_username = prof?.username ?? null;
      }
    }
    setPools(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchPools();
    const channel = supabase
      .channel("admin-slot-pools")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slot_pools" },
        () => fetchPools()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totals = useMemo(() => {
    let escrow = 0;
    let active = 0;
    for (const p of pools) {
      escrow += Number(p.seats_sold || 0) * Number(p.seat_price || 0);
      if (["open", "funding", "live", "full"].includes(p.status)) active++;
    }
    return { escrow, active, count: pools.length };
  }, [pools]);

  const handleCancel = async (p: PoolRow) => {
    if (!window.confirm(`Cancel pool "${p.name}"? Backers should be refunded manually.`)) return;
    setBusyId(p.id);
    const { error } = await supabase
      .from("slot_pools")
      .update({ status: "cancelled" } as any)
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else toast.success("Pool cancelled");
    setBusyId(null);
    fetchPools();
  };

  const handleReopen = async (p: PoolRow) => {
    setBusyId(p.id);
    const { error } = await supabase
      .from("slot_pools")
      .update({ status: "open" } as any)
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else toast.success("Pool reopened");
    setBusyId(null);
    fetchPools();
  };

  const handleDelete = async (p: PoolRow) => {
    if (!window.confirm(`Permanently delete pool "${p.name}"? This cannot be undone.`)) return;
    setBusyId(p.id);
    const { error } = await supabase.from("slot_pools").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else toast.success("Pool deleted");
    setBusyId(null);
    fetchPools();
  };

  return (
    <div className="space-y-3 mt-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Pools</p>
          <p className="font-display text-lg font-bold text-foreground">{totals.count}</p>
        </div>
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
          <p className="font-display text-lg font-bold text-primary">{totals.active}</p>
        </div>
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pool Escrow</p>
          <p className="font-display text-lg font-bold text-accent">
            ${totals.escrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Dice5 className="h-5 w-5 text-primary" /> Slot Pools
        </h2>
        <Button size="sm" variant="outline" onClick={fetchPools} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="gradient-card rounded-lg p-6 text-center text-muted-foreground text-sm">
          Loading slot pools…
        </div>
      ) : pools.length === 0 ? (
        <div className="gradient-card rounded-lg p-6 text-center">
          <p className="text-muted-foreground text-sm">No slot pools created yet.</p>
        </div>
      ) : (
        <div className="gradient-card rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Escrow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ends</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.map((p) => {
                const escrow = Number(p.seats_sold || 0) * Number(p.seat_price || 0);
                const isCancelled = p.status === "cancelled" || p.status === "closed";
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground text-sm">{p.name}</span>
                        <PlatformBadge platform={p.platform} />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="text-foreground">{p.owner_name || "Unknown"}</div>
                      {p.owner_username && (
                        <div className="text-primary">@{p.owner_username}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-foreground">
                      {p.seats_sold} / {p.seats}
                      <div className="text-muted-foreground">
                        @ ${Number(p.seat_price).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-flex items-center gap-1 text-accent font-display font-bold">
                        <DollarSign className="h-3 w-3" />
                        {escrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="text-muted-foreground">
                        buy-in ${Number(p.buy_in).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[p.status] || "bg-secondary text-muted-foreground"}>
                        {(p.status || "").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {new Date(p.end_time).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isCancelled ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === p.id}
                            onClick={() => handleReopen(p)}
                            className="text-primary border-primary/30 text-xs"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Reopen
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === p.id}
                            onClick={() => handleCancel(p)}
                            className="text-accent border-accent/30 text-xs"
                          >
                            <Ban className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === p.id}
                          onClick={() => handleDelete(p)}
                          className="text-destructive border-destructive/30 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
