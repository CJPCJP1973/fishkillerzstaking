export interface TierConfig {
  name: string;
  label: string;
  maxStakePercent: number;
  rakePercent: number;
  colorClass: string;
  bgClass: string;
}

export const TIERS: Record<number, TierConfig> = {
  1: {
    name: "Minnow",
    label: "MINNOW",
    maxStakePercent: 25,
    rakePercent: 8,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/20 border-muted-foreground/30",
  },
  2: {
    name: "Shark",
    label: "SHARK",
    maxStakePercent: 50,
    rakePercent: 6,
    colorClass: "text-primary",
    bgClass: "bg-primary/20 border-primary/30",
  },
  3: {
    name: "Killer Whale",
    label: "KILLER WHALE",
    maxStakePercent: 75,
    rakePercent: 10,
    colorClass: "text-accent",
    bgClass: "bg-accent/20 border-accent/30",
  },
  4: {
    name: "Apex Predator",
    label: "VIP",
    maxStakePercent: 75,
    rakePercent: 2,
    colorClass: "text-yellow-400",
    bgClass: "bg-yellow-400/20 border-yellow-400/30",
  },
};

export function getTierConfig(tier: number): TierConfig {
  return TIERS[tier] || TIERS[1];
}

export function getTierEmoji(tier: number): string {
  switch (tier) {
    case 1: return "🐟";
    case 2: return "🦈";
    case 3: return "🐋";
    case 4: return "👑";
    default: return "🐟";
  }
}
