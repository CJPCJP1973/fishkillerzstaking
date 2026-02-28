import { DollarSign, Users, Crosshair, TrendingUp } from "lucide-react";

const stats = [
  { label: "Active Sessions", value: "12", icon: Crosshair, color: "text-primary" },
  { label: "Total Staked", value: "$47.2K", icon: DollarSign, color: "text-accent" },
  { label: "Active Shooters", value: "8", icon: Users, color: "text-success" },
  { label: "Win Rate", value: "67%", icon: TrendingUp, color: "text-primary" },
];

export default function StatsBar() {
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
