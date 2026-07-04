import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const PLATFORMS = ["Golden Dragon", "Diamond Dragon", "Fire Phoenix", "Vblink", "Riversweeps", "Magic City"];

export default function SlotPools() {
  const { user } = useAuth();
  const [pools, setPools] = useState<SlotPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [buyIn, setBuyIn] = useState("");
  const [seats, setSeats] = useState("");
  const [seatPrice, setSeatPrice] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useSEO({
    title: "Slot Pools | FishKillerz",
    description:
      "Create and join slot pools. Split buy-ins across multiple backers and share the action on your favorite fish/slot platforms.",
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

  const buyInNum = parseFloat(buyIn) || 0;
  const seatsNum = parseInt(seats) || 0;
  const seatPriceNum = parseFloat(seatPrice) || 0;
  const poolTotal = seatsNum * seatPriceNum;
  const coverage = buyInNum > 0 ? Math.min(100, (poolTotal / buyInNum) * 100) : 0;

  const resetForm = () => {
    setName("");
    setPlatform("");
    setBuyIn("");
    setSeats("");
    setSeatPrice("");
    setEndTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in to create a slot pool");
      return;
    }
    if (!name || !platform || !buyIn || !seats || !seatPrice || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }
    if (seatsNum < 2) {
      toast.error("A pool needs at least 2 seats");
      return;
    }
    if (buyInNum <= 0 || seatPriceNum <= 0) {
      toast.error("Amounts must be greater than 0");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("slot_pools").insert({
      owner_id: user.id,
      name,
      platform,
      buy_in: buyInNum,
      seats: seatsNum,
      seat_price: seatPriceNum,
      end_time: new Date(endTime).toISOString(),
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Slot pool created");
    resetForm();
  };

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
        <div className="flex items-center gap-3 mb-6">
          <Dice5 className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Slot Pools</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-5 w-5 text-primary" />
                Create Slot Pool
              </CardTitle>
              <CardDescription>
                Split a buy-in into seats. Backers claim seats to share proportional winnings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Pool Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Friday Night Golden Dragon Grind"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyin">Total Buy-In ($)</Label>
                    <Input
                      id="buyin"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="500"
                      value={buyIn}
                      onChange={(e) => setBuyIn(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seats">Seats</Label>
                    <Input
                      id="seats"
                      type="number"
                      min="2"
                      step="1"
                      placeholder="10"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seatprice">Seat Price ($)</Label>
                    <Input
                      id="seatprice"
                      type="number"
                      min="1"
                      step="0.5"
                      placeholder="50"
                      value={seatPrice}
                      onChange={(e) => setSeatPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endtime">End Time</Label>
                  <Input
                    id="endtime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>

                {(seatsNum > 0 || buyInNum > 0) && (
                  <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool coverage</span>
                      <span className="font-medium text-foreground">
                        ${poolTotal.toFixed(2)} / ${buyInNum.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${coverage}%` }}
                      />
                    </div>
                    {poolTotal !== buyInNum && buyInNum > 0 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        Tip: seats × seat price should equal the total buy-in for full coverage.
                      </p>
                    )}
                  </div>
                )}

                <Button type="submit" disabled={submitting || !user} className="w-full">
                  {submitting ? "Creating…" : user ? "Create Pool" : "Sign in to create"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Live Pools</h2>
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Loading pools…
                </CardContent>
              </Card>
            ) : pools.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No slot pools yet. Create one to get started.
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
      </div>
    </Layout>
  );
}
