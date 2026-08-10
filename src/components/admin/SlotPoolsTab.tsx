import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dice5,
  Trash2,
  Loader2,
  Ban,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  Banknote,
} from "lucide-react";
import PlatformBadge from "@/components/PlatformBadge";
import { logAdminAction } from "@/lib/adminAudit";
import PoolPayoutSummary from "@/components/admin/PoolPayoutSummary";
import { computePoolPayout } from "@/lib/poolPayout";

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
  admin_confirmed_deposit: boolean;
  admin_released_winnings: boolean;
  winnings: number | null;
  deposit_proof_url: string | null;
  payout_proof_url: string | null;
  owner_name?: string | null;
  owner_username?: string | null;
}

interface SeatRow {
  id: string;
  pool_id: string;
  backer_id: string;
  seats: number;
  amount: number;
  payment_mode: string;
  deposit_confirmed: boolean;
  winnings_released: boolean;
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
  const [seats, setSeats] = useState<SeatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openSettle, setOpenSettle] = useState<string | null>(null);
  const [cashOut, setCashOut] = useState("");
  const [backerProfiles, setBackerProfiles] = useState<
    Record<string, { name: string | null; username: string | null; is_vip: boolean }>
  >({});


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
    const { data: seatData } = await supabase
      .from("slot_pool_seats" as any)
      .select("id, pool_id, backer_id, seats, amount, payment_mode, deposit_confirmed, winnings_released");
    const seatRows = ((seatData as any) || []) as SeatRow[];

    const backerIds = [...new Set(seatRows.map((s) => s.backer_id))];
    if (backerIds.length) {
      const { data: bProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, is_vip")
        .in("user_id", backerIds);
      const map: Record<string, { name: string | null; username: string | null; is_vip: boolean }> = {};
      for (const b of (bProfiles as any[]) || []) {
        map[b.user_id] = { name: b.display_name, username: b.username, is_vip: !!b.is_vip };
      }
      setBackerProfiles(map);
    }

    setSeats(seatRows);
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

  const seatsFor = (poolId: string) => seats.filter((s) => s.pool_id === poolId);

  const buildBreakdown = (poolId: string, amount: number) =>
    computePoolPayout(
      seatsFor(poolId)
        .filter((s) => s.deposit_confirmed)
        .map((s) => ({
          id: s.id,
          backer_id: s.backer_id,
          seats: s.seats,
          amount: Number(s.amount),
          payment_mode: s.payment_mode,
          is_vip: backerProfiles[s.backer_id]?.is_vip,
          name: backerProfiles[s.backer_id]?.name,
          username: backerProfiles[s.backer_id]?.username,
        })),
      amount
    );


  const totals = useMemo(() => {
    let escrow = 0;
    let active = 0;
    let pending = 0;
    for (const p of pools) {
      escrow += seatsFor(p.id)
        .filter((s) => s.deposit_confirmed)
        .reduce((sum, s) => sum + Number(s.amount || 0), 0);
      if (["open", "funding", "live", "full"].includes(p.status)) active++;
    }
    pending = seats.filter((s) => !s.deposit_confirmed).length;
    return { escrow, active, count: pools.length, pending };
  }, [pools, seats]);

  const notify = (userId: string, title: string, message: string, type: string) =>
    supabase.from("notifications").insert({ user_id: userId, title, message, type } as any);

  // Step 1 — confirm an individual seat deposit
  const handleConfirmSeat = async (pool: PoolRow, seat: SeatRow) => {
    setBusyId(seat.id);
    try {
      if (seat.payment_mode === "fishdollarz") {
        const { error: balErr } = await supabase.rpc("adjust_balance", {
          target_uid: seat.backer_id,
          delta: -Number(seat.amount),
        });
        if (balErr) throw balErr;
      }
      const { error } = await supabase
        .from("slot_pool_seats" as any)
        .update({ deposit_confirmed: true } as any)
        .eq("id", seat.id);
      if (error) throw error;

      await notify(
        seat.backer_id,
        "Seat Confirmed ✅",
        `Your ${seat.seats} seat(s) in "${pool.name}" are confirmed and held in escrow.`,
        "success"
      );
      await notify(
        pool.owner_id,
        "Pool Funding Received 💰",
        `$${Number(seat.amount).toFixed(2)} confirmed for "${pool.name}". Escrow now holds funds for your pool.`,
        "info"
      );
      await logAdminAction(
        "pool_seat_deposit_confirmed",
        `Confirmed $${Number(seat.amount).toFixed(2)} seat deposit for pool "${pool.name}"`,
        { userId: seat.backer_id, details: { pool_id: pool.id, seat_id: seat.id, seats: seat.seats } }
      );
      toast.success("Seat deposit confirmed");
      fetchPools();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm seat");
    }
    setBusyId(null);
  };

  const handleRejectSeat = async (pool: PoolRow, seat: SeatRow) => {
    if (!window.confirm("Reject and remove this seat purchase?")) return;
    setBusyId(seat.id);
    const { error } = await supabase.from("slot_pool_seats" as any).delete().eq("id", seat.id);
    if (error) toast.error(error.message);
    else {
      await notify(
        seat.backer_id,
        "Seat Rejected ❌",
        `Your seat purchase in "${pool.name}" could not be verified and was removed.`,
        "error"
      );
      await logAdminAction("pool_seat_rejected", `Rejected seat purchase in pool "${pool.name}"`, {
        userId: seat.backer_id,
        details: { pool_id: pool.id, seat_id: seat.id },
      });
      toast.success("Seat rejected");
      fetchPools();
    }
    setBusyId(null);
  };

  // Step 2 — confirm pool deposit and go live (notifies the pool owner/shooter)
  const handleConfirmPoolDeposit = async (p: PoolRow) => {
    const confirmed = seatsFor(p.id).filter((s) => s.deposit_confirmed);
    if (!confirmed.length) {
      toast.error("No confirmed seats yet");
      return;
    }
    if (!p.deposit_proof_url) {
      await notify(
        p.owner_id,
        "⚠️ Deposit Proof Required",
        `Submit a deposit proof link for "${p.name}" before the pool can go live.`,
        "warning"
      );
      toast.error("Deposit proof missing — owner notified");
      return;
    }
    setBusyId(p.id);
    try {
      const { error } = await supabase
        .from("slot_pools")
        .update({ admin_confirmed_deposit: true, status: "live" } as any)
        .eq("id", p.id);
      if (error) throw error;
      await notify(
        p.owner_id,
        "✅ Pool Funded — You're Live",
        `Admin confirmed the deposit for "${p.name}". The pool is now LIVE — play it out and submit payout proof when done.`,
        "success"
      );
      for (const s of confirmed) {
        await notify(
          s.backer_id,
          "Pool Is Live 🎰",
          `"${p.name}" is now live. Winnings are released after admin verification.`,
          "info"
        );
      }
      await logAdminAction("pool_deposit_confirmed", `Confirmed deposit for pool "${p.name}" and set it LIVE`, {
        userId: p.owner_id,
        details: { pool_id: p.id, deposit_proof_url: p.deposit_proof_url },
      });
      toast.success("Deposit confirmed — pool is LIVE");
      fetchPools();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm deposit");
    }
    setBusyId(null);
  };

  // Step 3 — release winnings after verifying payout proof
  const handleRelease = async (p: PoolRow) => {
    const amount = parseFloat(cashOut);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid cash-out amount");
      return;
    }
    if (!p.payout_proof_url) {
      toast.error("Payout proof required before releasing winnings");
      return;
    }
    const confirmed = seatsFor(p.id).filter((s) => s.deposit_confirmed);
    if (!confirmed.length) {
      toast.error("No confirmed seats to settle");
      return;
    }
    setBusyId(p.id);
    try {
      const totalStaked = confirmed.reduce((sum, s) => sum + Number(s.amount), 0);
      for (const s of confirmed) {
        const owed = Math.round(((Number(s.amount) / totalStaked) * amount) * 100) / 100;
        if (s.payment_mode === "fishdollarz" && owed > 0) {
          await supabase.rpc("adjust_balance", { target_uid: s.backer_id, delta: owed });
        }
        await supabase
          .from("slot_pool_seats" as any)
          .update({ winnings_released: true, winnings_amount: owed } as any)
          .eq("id", s.id);
        await notify(
          s.backer_id,
          "Pool Winnings Released 🏆",
          `$${owed.toFixed(2)} from "${p.name}" has been released${
            s.payment_mode === "fishdollarz" ? " to your FishDollarz balance." : " — payout is on its way."
          }`,
          "success"
        );
      }

      const { error } = await supabase
        .from("slot_pools")
        .update({ status: "completed", winnings: amount, admin_released_winnings: true } as any)
        .eq("id", p.id);
      if (error) throw error;

      await notify(
        p.owner_id,
        "Pool Settled ✅",
        `"${p.name}" settled at $${amount.toLocaleString()} and winnings were released to backers.`,
        "success"
      );
      await logAdminAction(
        "pool_winnings_released",
        `Released $${amount.toLocaleString()} for pool "${p.name}" across ${confirmed.length} seat holder(s)`,
        {
          userId: p.owner_id,
          details: { pool_id: p.id, cash_out: amount, seats: confirmed.length, payout_proof_url: p.payout_proof_url },
        }
      );
      toast.success("Winnings released");
      setOpenSettle(null);
      setCashOut("");
      fetchPools();
    } catch (err: any) {
      toast.error(err.message || "Failed to release winnings");
    }
    setBusyId(null);
  };

  const handleCancel = async (p: PoolRow) => {
    if (!window.confirm(`Cancel pool "${p.name}"? Backers should be refunded manually.`)) return;
    setBusyId(p.id);
    const { error } = await supabase
      .from("slot_pools")
      .update({ status: "cancelled" } as any)
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      await logAdminAction("pool_cancelled", `Cancelled pool "${p.name}"`, {
        userId: p.owner_id,
        details: { pool_id: p.id },
      });
      toast.success("Pool cancelled");
    }
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

  const pendingSeatRows = seats.filter((s) => !s.deposit_confirmed);

  return (
    <div className="space-y-3 mt-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Pools</p>
          <p className="font-display text-lg font-bold text-foreground">{totals.count}</p>
        </div>
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
          <p className="font-display text-lg font-bold text-primary">{totals.active}</p>
        </div>
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending Seats</p>
          <p className="font-display text-lg font-bold text-warning">{totals.pending}</p>
        </div>
        <div className="gradient-card rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In Escrow</p>
          <p className="font-display text-lg font-bold text-accent">
            ${totals.escrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Pending seat deposits */}
      {pendingSeatRows.length > 0 && (
        <div className="gradient-card rounded-lg p-3 space-y-2">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
            <Banknote className="h-4 w-4 text-warning" /> Pending Seat Deposits
          </h3>
          {pendingSeatRows.map((s) => {
            const pool = pools.find((p) => p.id === s.pool_id);
            if (!pool) return null;
            return (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2">
                <div className="text-xs">
                  <span className="text-foreground font-medium">{pool.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {s.seats} seat(s) · ${Number(s.amount).toFixed(2)} · {s.payment_mode}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="text-xs h-7"
                    disabled={busyId === s.id}
                    onClick={() => handleConfirmSeat(pool, s)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 text-destructive border-destructive/30"
                    disabled={busyId === s.id}
                    onClick={() => handleRejectSeat(pool, s)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <TableHead>Proof</TableHead>
                <TableHead className="text-right">Escrow Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.map((p) => {
                const confirmedSeats = seatsFor(p.id).filter((s) => s.deposit_confirmed);
                const escrow = confirmedSeats.reduce((sum, s) => sum + Number(s.amount), 0);
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
                      {p.owner_username && <div className="text-primary">@{p.owner_username}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-foreground">
                      {p.seats_sold} / {p.seats}
                      <div className="text-muted-foreground">@ ${Number(p.seat_price).toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-flex items-center gap-1 text-accent font-display font-bold">
                        <DollarSign className="h-3 w-3" />
                        {escrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="text-muted-foreground">buy-in ${Number(p.buy_in).toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_STYLES[p.status] || "bg-secondary text-muted-foreground"}
                      >
                        {(p.status || "").toUpperCase()}
                      </Badge>
                      {p.admin_released_winnings && (
                        <div className="text-[10px] text-success mt-1">Settled ${Number(p.winnings ?? 0).toFixed(2)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] space-y-1">
                      {p.deposit_proof_url ? (
                        <a
                          href={p.deposit_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Deposit
                        </a>
                      ) : (
                        <span className="text-muted-foreground block">No deposit proof</span>
                      )}
                      {p.payout_proof_url ? (
                        <a
                          href={p.payout_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Payout
                        </a>
                      ) : (
                        <span className="text-muted-foreground block">No payout proof</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        {!p.admin_confirmed_deposit ? (
                          <Button
                            size="sm"
                            className="text-xs"
                            disabled={busyId === p.id}
                            onClick={() => handleConfirmPoolDeposit(p)}
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" /> Confirm Deposit & Go Live
                          </Button>
                        ) : !p.admin_released_winnings ? (
                          openSettle === p.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={cashOut}
                                onChange={(e) => setCashOut(e.target.value)}
                                placeholder="Cash-out $"
                                className="h-8 w-28 text-xs"
                              />
                              <Button
                                size="sm"
                                className="text-xs"
                                disabled={busyId === p.id}
                                onClick={() => handleRelease(p)}
                              >
                                Release
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setOpenSettle(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success border-success/30 text-xs"
                              onClick={() => {
                                setOpenSettle(p.id);
                                setCashOut("");
                              }}
                            >
                              <Banknote className="h-3 w-3 mr-1" /> Release Winnings
                            </Button>
                          )
                        ) : (
                          <span className="text-[11px] text-success">Escrow closed</span>
                        )}

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
