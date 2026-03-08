import { Badge } from "@/components/ui/badge";
import { getTierConfig, getTierEmoji } from "@/lib/tierConfig";

interface TierBadgeProps {
  tier: number;
  className?: string;
}

export default function TierBadge({ tier, className = "" }: TierBadgeProps) {
  const config = getTierConfig(tier);
  const emoji = getTierEmoji(tier);

  return (
    <Badge
      variant="outline"
      className={`${config.bgClass} ${config.colorClass} font-display font-bold text-[10px] ${className}`}
    >
      {emoji} {config.label}
    </Badge>
  );
}
