import { Badge } from "@/components/ui/badge";
import { Receipt, Wallet, ShieldCheck } from "lucide-react";
import type { PayoutBreakdown } from "@/lib/poolPayout";

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PoolPayoutSummary({
  breakdown,
  cashOut,
  poolName,
}: {
  breakdown: PayoutBreakdown;
  cashOut: number;
  poolName: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/40 p-3 text-left space-y-3 w-full max-w-2xl">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-xs font-bold text-foreground flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5 text-primary" /> Payout Ledger — {poolName}
        </h4>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Cash-out {money(cashOut)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground text-left">
              <th className="py-1 pr-2 font-medium">Backer</th>
              <th className="py-1 pr-2 font-medium text-right">Staked</th>
              <th className="py-1 pr-2 font-medium text-right">Share</th>
              <th className="py-1 pr-2 font-medium text-right">Gross</th>
              <th className="py-1 pr-2 font-medium text-right">Rake</th>
              <th className="py-1 font-medium text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {breakdown.lines.map((l) => (
              <tr key={l.seat_id} className="border-t border-border/50">
                <td className="py-1 pr-2">
                  <span className="font-sans text-foreground">{l.name}</span>
                  {l.is_vip && (
                    <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px] border-accent/40 text-accent">
                      VIP
                    </Badge>
                  )}
                  <span className="block font-sans text-muted-foreground">
                    {l.seats} seat(s) · {l.payment_mode === "fishdollarz" ? "FishDollarz" : "P2P"}
                  </span>
                </td>
                <td className="py-1 pr-2 text-right text-muted-foreground">{money(l.staked)}</td>
                <td className="py-1 pr-2 text-right text-muted-foreground">
                  {(l.sharePct * 100).toFixed(2)}%
                </td>
                <td className="py-1 pr-2 text-right text-foreground">{money(l.gross)}</td>
                <td className="py-1 pr-2 text-right text-destructive">
                  −{money(l.fee)}
                  <span className="block text-[9px] text-muted-foreground">
                    {(l.rakeRate * 100).toFixed(0)}% of profit
                  </span>
                </td>
                <td className="py-1 text-right font-bold text-success">{money(l.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-mono">
              <td className="py-1 pr-2 font-sans font-bold text-foreground">Totals</td>
              <td className="py-1 pr-2 text-right">{money(breakdown.totalStaked)}</td>
              <td className="py-1 pr-2 text-right">100%</td>
              <td className="py-1 pr-2 text-right">{money(breakdown.totalGross)}</td>
              <td className="py-1 pr-2 text-right text-destructive">−{money(breakdown.totalFees)}</td>
              <td className="py-1 text-right font-bold text-success">{money(breakdown.totalNet)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="rounded-md bg-background/50 p-2">
          <span className="block uppercase tracking-wider text-muted-foreground">FishDollarz credits</span>
          <span className="font-display text-sm font-bold text-primary flex items-center gap-1">
            <Wallet className="h-3 w-3" /> {money(breakdown.fishDollarzCredits)}
          </span>
        </div>
        <div className="rounded-md bg-background/50 p-2">
          <span className="block uppercase tracking-wider text-muted-foreground">P2P owed</span>
          <span className="font-display text-sm font-bold text-accent flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> {money(breakdown.p2pOwed)}
          </span>
        </div>
        <div className="rounded-md bg-background/50 p-2">
          <span className="block uppercase tracking-wider text-muted-foreground">Platform rake</span>
          <span className="font-display text-sm font-bold text-foreground">{money(breakdown.totalFees)}</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Rake is 5% (2% VIP) on profit only — returned stake is never raked. Rounding dust ({money(breakdown.dust)})
        is folded into the last line so gross always reconciles to the cash-out.
      </p>
    </div>
  );
}
