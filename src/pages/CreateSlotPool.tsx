import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dice5, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = ["Golden Dragon", "Diamond Dragon", "Fire Phoenix", "Vblink", "Riversweeps", "Magic City"];

export default function CreateSlotPool() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [buyIn, setBuyIn] = useState("");
  const [seats, setSeats] = useState("");
  const [seatPrice, setSeatPrice] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useSEO({
    title: "Create Slot Pool | FishKillerz",
    description:
      "Create a new slot pool. Split a buy-in into seats so backers can share the action on your favorite fish/slot platforms.",
    canonical: "/slot-pools/new",
  });

  const buyInNum = parseFloat(buyIn) || 0;
  const seatsNum = parseInt(seats) || 0;
  const seatPriceNum = parseFloat(seatPrice) || 0;
  const poolTotal = seatsNum * seatPriceNum;
  const coverage = buyInNum > 0 ? Math.min(100, (poolTotal / buyInNum) * 100) : 0;

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
    navigate("/slot-pools");
  };

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-2xl">
        <Link
          to="/slot-pools"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Slot Pools
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Dice5 className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Create Slot Pool</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" />
              New Pool
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
      </div>
    </Layout>
  );
}
