export interface PayoutSeatInput {
  id: string;
  backer_id: string;
  seats: number;
  amount: number;
  payment_mode: string;
  is_vip?: boolean;
  name?: string | null;
  username?: string | null;
}

export interface PayoutLine {
  seat_id: string;
  backer_id: string;
  name: string;
  username: string | null;
  seats: number;
  staked: number;
  sharePct: number;
  gross: number;
  profit: number;
  rakeRate: number;
  fee: number;
  net: number;
  payment_mode: string;
  is_vip: boolean;
}

export interface PayoutBreakdown {
  lines: PayoutLine[];
  totalStaked: number;
  totalGross: number;
  totalFees: number;
  totalNet: number;
  fishDollarzCredits: number;
  p2pOwed: number;
  dust: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Deterministic pro-rata payout math for a slot pool.
 * Rake: 5% standard / 2% VIP, charged on profit only (never on returned stake).
 * Rounding dust from the last line is reconciled so totals match the cash-out exactly.
 */
export function computePoolPayout(seats: PayoutSeatInput[], cashOut: number): PayoutBreakdown {
  const totalStaked = seats.reduce((s, x) => s + Number(x.amount || 0), 0);
  const lines: PayoutLine[] = [];
  let allocated = 0;

  seats.forEach((s, i) => {
    const staked = Number(s.amount || 0);
    const sharePct = totalStaked > 0 ? staked / totalStaked : 0;
    let gross = round2(sharePct * cashOut);
    // Give any rounding dust to the final line so gross totals equal cash-out
    if (i === seats.length - 1) gross = round2(cashOut - allocated);
    allocated = round2(allocated + gross);

    const profit = Math.max(0, round2(gross - staked));
    const rakeRate = s.is_vip ? 0.02 : 0.05;
    const fee = round2(profit * rakeRate);
    const net = round2(gross - fee);

    lines.push({
      seat_id: s.id,
      backer_id: s.backer_id,
      name: s.name || "Unknown",
      username: s.username ?? null,
      seats: Number(s.seats || 0),
      staked,
      sharePct,
      gross,
      profit,
      rakeRate,
      fee,
      net,
      payment_mode: s.payment_mode,
      is_vip: !!s.is_vip,
    });
  });

  const totalGross = round2(lines.reduce((a, l) => a + l.gross, 0));
  const totalFees = round2(lines.reduce((a, l) => a + l.fee, 0));
  const totalNet = round2(lines.reduce((a, l) => a + l.net, 0));

  return {
    lines,
    totalStaked: round2(totalStaked),
    totalGross,
    totalFees,
    totalNet,
    fishDollarzCredits: round2(
      lines.filter((l) => l.payment_mode === "fishdollarz").reduce((a, l) => a + l.net, 0)
    ),
    p2pOwed: round2(lines.filter((l) => l.payment_mode !== "fishdollarz").reduce((a, l) => a + l.net, 0)),
    dust: round2(cashOut - totalGross),
  };
}
