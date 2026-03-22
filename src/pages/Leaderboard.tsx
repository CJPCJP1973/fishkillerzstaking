import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import TierBadge from "@/components/TierBadge";
import { Trophy, TrendingUp, Crosshair, Crown } from "lucide-react";

interface LeaderboardEntry {
  display_name: string;
  username: string;
  avatar_url: string | null;
  seller_tier: number;
  is_vip: boolean;
  completed_sessions: number;
  total_earnings: number;
}

export default function Leaderboard() {
  const [sellers, setSellers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_seller_leaderboard").then(({ data }) => {
      setSellers((data as LeaderboardEntry[]) || []);
      setLoading(false);
    });
  }, []);

  const rankStyle = (i: number) => {
    if (i === 0) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    if (i === 1) return "text-gray-300 bg-gray-300/10 border-gray-300/30";
    if (i === 2) return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    return "text-muted-foreground bg-muted/30 border-border";
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-8 pb-24 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold tracking-wide text-foreground">
              SELLER <span className="text-primary">LEADERBOARD</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Top sellers ranked by completed sessions & earnings
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : sellers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No sellers on the leaderboard yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sellers.map((s, i) => (
              <Link to={`/u/${s.username}`} key={s.username} className="block">
              <Card className="overflow-hidden hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Rank */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center font-display font-bold text-lg ${rankStyle(i)}`}
                    >
                      {i < 3 ? (
                        <Crown className="h-5 w-5" />
                      ) : (
                        i + 1
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-primary text-lg">
                          {s.display_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name + Tier */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-foreground truncate">
                          {s.display_name}
                        </span>
                        <TierBadge isVip={s.is_vip} />
                      </div>
                      <span className="text-xs text-muted-foreground">@{s.username}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 flex gap-4 text-right">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                          <Crosshair className="h-3 w-3" /> Sessions
                        </div>
                        <span className="font-display font-bold text-foreground">
                          {s.completed_sessions}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                          <TrendingUp className="h-3 w-3" /> Earned
                        </div>
                        <span className="font-display font-bold text-primary">
                          ${Number(s.total_earnings).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
