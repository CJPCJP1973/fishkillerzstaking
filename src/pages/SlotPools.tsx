import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import SlotPoolCard, { SlotPoolData } from "@/components/SlotPoolCard";
import { Dice5, Plus } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const FILTERS = ["all", "open", "live", "full", "completed"] as const;
type Filter = (typeof FILTERS)[number];

export default function SlotPools() {
  const { user } = useAuth();
  const [pools, setPools] = useState<SlotPoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useSEO({
    title: "Slot Pools | FishKillerz",
    description:
      "Browse open slot pools and grab a seat. Split buy-ins across multiple backers and share the action on your favorite slot platforms.",
    canonical: "/slot-pools",
    jsonLd: [
      organizationSchema,
      faqSchema(slotPoolFaqs),
      breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Slot Pools", path: "/slot-pools" },
      ]),
    ],
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
      setPools((data ?? []) as SlotPoolData[]);
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
    if (!window.confirm("Delete this pool? This cannot be undone.")) return;
    const { error } = await supabase.from("slot_pools").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pool removed");
  };

  const visible = useMemo(
    () => (filter === "all" ? pools : pools.filter((p) => p.status === filter)),
    [pools, filter]
  );

  const totals = useMemo(() => {
    const active = pools.filter((p) => ["open", "funding", "live", "full"].includes(p.status)).length;
    const escrow = pools.reduce((s, p) => s + Number(p.seats_sold || 0) * Number(p.seat_price || 0), 0);
    const seatsLeft = pools
      .filter((p) => ["open", "funding"].includes(p.status))
      .reduce((s, p) => s + Math.max(0, p.seats - p.seats_sold), 0);
    return { active, escrow, seatsLeft };
  }, [pools]);

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Dice5 className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">All Slot Pools</h1>
          </div>
          <Button asChild size="sm">
            <Link to="/slot-pools/new">
              <Plus className="h-4 w-4 mr-1.5" /> Create Pool
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="gradient-card rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Pools</p>
            <p className="font-display text-lg font-bold text-primary">{totals.active}</p>
          </div>
          <div className="gradient-card rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Seats Open</p>
            <p className="font-display text-lg font-bold text-foreground">{totals.seatsLeft}</p>
          </div>
          <div className="gradient-card rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In Pools</p>
            <p className="font-display text-lg font-bold text-accent">
              ${totals.escrow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === f
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading pools…</p>
        ) : visible.length === 0 ? (
          <div className="gradient-card rounded-lg p-8 text-center space-y-3">
            <p className="text-muted-foreground text-sm">No slot pools here yet.</p>
            <Button asChild size="sm">
              <Link to="/slot-pools/new">
                <Plus className="h-4 w-4 mr-1.5" /> Create Pool
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((p) => (
              <SlotPoolCard
                key={p.id}
                pool={p}
                isOwner={user?.id === p.owner_id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
