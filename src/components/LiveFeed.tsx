import { useEffect, useState } from "react";
import { Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeedItem {
  id: string;
  shooter_name: string;
  platform: string;
  amount: number;
  created_at: string;
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function LiveFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    supabase
      .from("win_feed")
      .select("id, shooter_name, platform, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (data) setFeed(data);
      });

    const channel = supabase
      .channel("live-win-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "win_feed" },
        (payload) => {
          setFeed((prev) => [payload.new as FeedItem, ...prev].slice(0, 12));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (feed.length === 0) return null;

  const items = feed.length < 6 ? [...feed, ...feed] : feed;

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
            {items.map((item, i) => (
              <div key={`${item.id}-${i}`} className="flex items-center gap-2 px-4 py-2 text-sm">
                <Trophy className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <span className="text-foreground font-medium">{item.shooter_name}</span>
                <span className="text-muted-foreground">hit</span>
                <span className="text-primary font-semibold">${item.amount.toLocaleString()}</span>
                <span className="text-muted-foreground">on {item.platform}</span>
                <Zap className="h-3 w-3 text-accent flex-shrink-0" />
                <span className="text-muted-foreground text-xs">{timeAgo(item.created_at)}</span>
                <span className="text-border mx-2">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
