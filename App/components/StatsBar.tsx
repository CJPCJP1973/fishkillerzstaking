import { useEffect, useState } from "react";
import { DollarSign, Users, Crosshair, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function StatsBar() {
  const [activeSessions, setActiveSessions] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [activeShooters, setActiveShooters] = useState(0);
  const [winRate, setWinRate] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data: sessions } = await supabase.rpc("get_public_sessions");
      if (sessions) {
        const active = sessions.filter((s: any) =>
          ["funding", "live", "pending"].includes(s.status)
        );
        setActiveSessions(active.length);

        const shooterIds = new Set(active.map((s: any) => s.shooter_name));
        setActiveShooters(shooterIds.size);

        const staked = active.reduce(
          (sum: number, s: any) => sum + Number(s.stake_sold ?? 0),
          0
        );
        setTotalStaked(staked);

        const completed = sessions.filter((s: any) => s.status === "completed");
        if (completed.length > 0) {
          const total = sessions.length;
          setWinRate(Math.round((completed.length / total) * 100));
        }
      }
    };
    fetch();
  }, []);

  const formatCurrency = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;

  const stats = [
    { label: "Active Sessions", value: String(activeSessions), icon: Crosshair, color: "text-primary" },
    { label: "Total Staked", value: formatCurrency(totalStaked), icon: DollarSign, color: "text-accent" },
    { label: "Active Shooters", value: String(activeShooters), icon: Users, color: "text-success" },
    { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="gradient-card rounded-lg p-3 flex items-center gap-3">
          <div className={`p-2 rounded-md bg-secondary ${stat.color}`}>
            <stat.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
