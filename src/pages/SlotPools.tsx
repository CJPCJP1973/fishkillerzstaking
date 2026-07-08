import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dice5, Plus, Users, DollarSign, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type SlotPool = {
  id: string;
  owner_id: string;
  name: string;
  platform: string;
  buy_in: number;
  seats: number;
  seat_price: number;
  seats_sold: number;
  end_time: string;
  status: string;
  created_at: string;
};

export default function SlotPools() {
  const { user } = useAuth();
  const [pools, setPools] = useState<SlotPool[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Slot Pools | FishKillerz",
    description:
      "Browse and join slot pools. Split buy-ins across multiple backers and share the action on your favorite fish/slot platforms.",
    canonical: "/slot-pools",
  });

  const fetchPools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("slot_pools")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load pools");
    } else {
      setPools((data ?? []) as SlotPool[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPools();
    const channel = supabase
      .channel("slot-pools-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slot_pools" },
        () => fetchPools()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("slot_pools").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pool removed");
  };

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Dice5 className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Slot Pools</h1>
          </div>
          <Button asChild>
            <Link to="/slot-pools/new">
              <Plus className="h-4 w-4 mr-1.5" /> Create Pool
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {loading ? (
            <Card className="sm:col-span-2">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Loading pools…
              </CardContent>
            </Card>
          ) : pools.length === 0 ? (
            <Card className="sm:col-span-2">
              <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3">
                <p>No slot pools yet. Be the first to launch one.</p>
                <Button asChild size="sm">
                  <Link to="/slot-pools/new">
                    <Plus className="h-4 w-4 mr-1.5" /> Create Pool
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            pools.map((p) => {
              const filled = Math.min(100, (p.seats_sold / p.seats) * 100);
              const isOwner = user?.id === p.owner_id;
              return (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {p.platform}
                        </Badge>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Delete pool"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" /> Buy-in
                      </span>
                      <span className="text-foreground font-medium">${Number(p.buy_in).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Seats
                      </span>
                      <span className="text-foreground font-medium">
                        {p.seats_sold} / {p.seats} @ ${Number(p.seat_price).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${filled}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ends {new Date(p.end_time).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
