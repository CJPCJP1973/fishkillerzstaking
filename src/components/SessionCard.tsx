import { useState, useEffect } from "react";
import { Clock, Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StakePieChart from "./StakePieChart";
import BuyStakeDrawer from "./BuyStakeDrawer";
import { supabase } from "@/integrations/supabase/client";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [confirmedAmount, setConfirmedAmount] = useState(0);

  const fetchStakes = async () => {
    const { data } = await supabase
      .from("stakes")
      .select("amount, deposit_confirmed")
      .eq("session_id", session.id);

    if (data) {
      const pending = data.filter((s) => !s.deposit_confirmed).reduce((sum, s) => sum + Number(s.amount), 0);
      const confirmed = data.filter((s) => s.deposit_confirmed).reduce((sum, s) => sum + Number(s.amount), 0);
      setPendingAmount(pending);
      setConfirmedAmount(confirmed);
    }
  };

  useEffect(() => {
    fetchStakes();
  }, [session.id]);

  const available = Math.max(0, session.stakeAvailable - pendingAmount - confirmedAmount);

  return (
    <>
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

        {/* Pie Chart */}
        <StakePieChart
          available={available}
          pending={pendingAmount}
          sold={confirmedAmount}
          onClickAvailable={() => available > 0 && setDrawerOpen(true)}
        />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Ends: {session.endTime}</span>
          </div>
          {available > 0 && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-xs font-display font-bold text-primary hover:text-primary/80 transition-colors"
            >
              TAP GREEN TO BUY →
            </button>
          )}
        </div>
      </div>

      <BuyStakeDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        session={{
          id: session.id,
          shooterName: session.shooterName,
          platform: session.platform,
          stakeAvailable: session.stakeAvailable,
          stakeSold: confirmedAmount,
          pendingAmount,
          totalBuyIn: session.totalBuyIn,
        }}
        onPurchased={fetchStakes}
      />
    </>
  );
}
