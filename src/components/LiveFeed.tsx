import { Trophy, Zap } from "lucide-react";

const mockFeed = [
  { shooter: "AceHunter99", platform: "Golden Dragon", amount: 1250, time: "2m ago" },
  { shooter: "DeepSeaKing", platform: "Fire Phoenix", amount: 3400, time: "5m ago" },
  { shooter: "SharkBite", platform: "Vblink", amount: 890, time: "8m ago" },
  { shooter: "ReefRunner", platform: "Diamond Dragon", amount: 2100, time: "12m ago" },
  { shooter: "TidalWave", platform: "Riversweeps", amount: 1780, time: "15m ago" },
  { shooter: "OceanKing", platform: "Magic City", amount: 4200, time: "18m ago" },
];

export default function LiveFeed() {
  return (
    <div className="w-full overflow-hidden bg-surface/50 border-y border-border min-h-[40px]">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-live/20 border-r border-border">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-live"></span>
          </span>
          <span className="text-xs font-bold text-live uppercase tracking-wider">Live</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex animate-ticker whitespace-nowrap">
            {[...mockFeed, ...mockFeed].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 text-sm">
                <Trophy className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <span className="text-foreground font-medium">{item.shooter}</span>
                <span className="text-muted-foreground">hit</span>
                <span className="text-primary font-semibold">${item.amount.toLocaleString()}</span>
                <span className="text-muted-foreground">on {item.platform}</span>
                <Zap className="h-3 w-3 text-accent flex-shrink-0" />
                <span className="text-muted-foreground text-xs">{item.time}</span>
                <span className="text-border mx-2">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
