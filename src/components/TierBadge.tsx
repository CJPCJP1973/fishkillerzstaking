import { Badge } from "@/components/ui/badge";

interface TierBadgeProps {
  isVip?: boolean;
  className?: string;
}

export default function TierBadge({ isVip, className = "" }: TierBadgeProps) {
  if (!isVip) return null;

  return (
    <Badge
      variant="outline"
      className={`bg-yellow-400/20 border-yellow-400/30 text-yellow-400 font-display font-bold text-[10px] ${className}`}
    >
      👑 VIP
    </Badge>
  );
}
