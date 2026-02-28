import Layout from "@/components/Layout";
import SessionCard, { SessionData } from "@/components/SessionCard";
import { Crosshair } from "lucide-react";

const allSessions: SessionData[] = [
  { id: "1", shooterName: "AceHunter99", platform: "Golden Dragon", agentRoom: "VIP Room #7", totalBuyIn: 1000, stakeAvailable: 750, stakeSold: 450, endTime: "Tonight 11PM", status: "live", streamUrl: "https://kick.com/acehunter" },
  { id: "2", shooterName: "DeepSeaKing", platform: "Fire Phoenix", agentRoom: "Agent Mike", totalBuyIn: 2000, stakeAvailable: 1500, stakeSold: 600, endTime: "Tomorrow 2AM", status: "funding" },
  { id: "3", shooterName: "SharkBite", platform: "Vblink", agentRoom: "Lobby A", totalBuyIn: 500, stakeAvailable: 375, stakeSold: 375, endTime: "Tonight 9PM", status: "completed" },
  { id: "4", shooterName: "ReefRunner", platform: "Diamond Dragon", agentRoom: "Room 12", totalBuyIn: 1500, stakeAvailable: 1125, stakeSold: 200, endTime: "Tonight 10PM", status: "pending" },
  { id: "5", shooterName: "OceanKing", platform: "Magic City", agentRoom: "Room 3", totalBuyIn: 3000, stakeAvailable: 2250, stakeSold: 1800, endTime: "Tonight 8PM", status: "live", streamUrl: "https://twitch.tv/oceanking" },
  { id: "6", shooterName: "TidalWave", platform: "Riversweeps", agentRoom: "Agent Sam", totalBuyIn: 800, stakeAvailable: 600, stakeSold: 100, endTime: "Tomorrow 1AM", status: "funding" },
];

export default function Sessions() {
  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Crosshair className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">All Sessions</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
