import { Clock, Users, Crosshair, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface SessionData {
  id: string;
  shooterName: string;
  platform: string;
  agentRoom: string;
  totalBuyIn: number;
  stakeAvailable: number;
  stakeSold: number;
  endTime: string;
  status: "live" | "funding" | "completed" | "pending";
  streamUrl?: string;
}

const statusStyles: Record<string, string> = {
  live: "bg-live/20 text-live border-live/30",
  funding: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  pending: "bg-accent/20 text-accent border-accent/30",
};

export default function SessionCard({ session }: { session: SessionData }) {
  const stakePercent = (session.stakeSold / session.stakeAvailable) * 100;
  const maxStake = session.totalBuyIn * 0.75;

  return (
    <div className="gradient-card rounded-lg p-4 hover:border-primary/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Crosshair className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-base leading-tight">
              {session.shooterName}
            </h3>
            <p className="text-xs text-muted-foreground">{session.platform}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.streamUrl && (
            <span className="flex items-center gap-1 text-xs text-live animate-pulse-glow rounded px-1.5 py-0.5 bg-live/10">
              <span className="h-1.5 w-1.5 rounded-full bg-live"></span>
              LIVE
            </span>
          )}
          <Badge variant="outline" className={statusStyles[session.status]}>
            {session.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Agent/Room</span>
          <p className="text-foreground font-medium">{session.agentRoom}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Buy-In</span>
          <p className="text-accent font-display font-bold text-lg">${session.totalBuyIn.toLocaleString()}</p>
        </div>
      </div>

      {/* Stake progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            Stake: ${session.stakeSold.toLocaleString()} / ${session.stakeAvailable.toLocaleString()}
          </span>
          <span className="text-primary font-semibold">{Math.round(stakePercent)}%</span>
        </div>
        <Progress value={stakePercent} className="h-2 bg-secondary" />
        <p className="text-xs text-muted-foreground mt-1">
          Max stake: ${maxStake.toLocaleString()} (75% of buy-in)
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Ends: {session.endTime}</span>
        </div>
        <Button size="sm" className="gradient-primary text-primary-foreground font-display font-bold text-xs">
          BUY STAKE
        </Button>
      </div>
    </div>
  );
}
