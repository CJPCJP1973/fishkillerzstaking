import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dice5, ArrowLeft, ArrowRight, Check, Rocket, Users, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  "Golden Dragon",
  "Diamond Dragon",
  "Fire Phoenix",
  "Vblink",
  "Riversweeps",
  "Magic City",
];

type StepKey = "basics" | "economics" | "schedule" | "review";

const STEPS: { key: StepKey; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "basics", title: "Basics", icon: Dice5 },
  { key: "economics", title: "Economics", icon: DollarSign },
  { key: "schedule", title: "Schedule", icon: Calendar },
  { key: "review", title: "Review", icon: Check },
];

export default function CreateSlotPool() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [buyIn, setBuyIn] = useState("");
  const [seats, setSeats] = useState("");
  const [seatPrice, setSeatPrice] = useState("");
  const [endTime, setEndTime] = useState("");

  useSEO({
    title: "Create Slot Pool | FishKillerz",
    description:
      "Launch a new slot pool with our guided wizard. Configure buy-in, seats, and schedule step by step.",
    canonical: "/slot-pools/new",
  });

  const buyInNum = parseFloat(buyIn) || 0;
  const seatsNum = parseInt(seats) || 0;
  const seatPriceNum = parseFloat(seatPrice) || 0;
  const poolTotal = seatsNum * seatPriceNum;
  const coverage = buyInNum > 0 ? Math.min(100, (poolTotal / buyInNum) * 100) : 0;

  const step = STEPS[stepIndex].key;

  const stepValid = useMemo(() => {
    if (step === "basics") return name.trim().length >= 3 && !!platform;
    if (step === "economics")
      return buyInNum > 0 && seatsNum >= 2 && seatPriceNum > 0;
    if (step === "schedule") {
      if (!endTime) return false;
      return new Date(endTime).getTime() > Date.now();
    }
    return true;
  }, [step, name, platform, buyInNum, seatsNum, seatPriceNum, endTime]);

  const next = () => {
    if (!stepValid) {
      toast.error("Please complete this step before continuing");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be signed in to create a slot pool");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("slot_pools").insert({
      owner_id: user.id,
      name: name.trim(),
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

        {/* Stepper */}
        <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Progress">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <li key={s.key} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border transition-colors",
                    isDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground bg-secondary/40"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    "text-[11px] uppercase tracking-wide text-center",
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {s.title}
                </span>
              </li>
            );
          })}
        </ol>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex].title}
            </CardTitle>
            <CardDescription>
              {step === "basics" && "Name your pool and choose the platform backers will play on."}
              {step === "economics" && "Set the total buy-in and split it into affordable seats."}
              {step === "schedule" && "Choose when the pool closes to new seats."}
              {step === "review" && "Confirm the details below and launch your pool."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "basics" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Pool Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Friday Night Golden Dragon Grind"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                  <p className="text-xs text-muted-foreground">
                    3–80 characters. Make it recognizable to backers.
                  </p>
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
              </>
            )}

            {step === "economics" && (
              <>
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
                <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-xs text-muted-foreground">Minimum 2.</p>
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

                {(seatsNum > 0 || buyInNum > 0) && (
                  <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm space-y-1.5">
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
                        Tip: seats × seat price should equal the buy-in for full coverage.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {step === "schedule" && (
              <div className="space-y-2">
                <Label htmlFor="endtime">End Time</Label>
                <Input
                  id="endtime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  After this time, no new seats can be claimed. Must be in the future.
                </p>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-3 text-sm">
                <ReviewRow label="Pool name" value={name} />
                <ReviewRow label="Platform" value={platform} />
                <ReviewRow label="Total buy-in" value={`$${buyInNum.toFixed(2)}`} />
                <ReviewRow
                  label="Seats"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {seatsNum} @ ${seatPriceNum.toFixed(2)}
                    </span>
                  }
                />
                <ReviewRow
                  label="Pool coverage"
                  value={`$${poolTotal.toFixed(2)} (${coverage.toFixed(0)}%)`}
                />
                <ReviewRow
                  label="Ends"
                  value={endTime ? new Date(endTime).toLocaleString() : "—"}
                />
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={back}
                disabled={stepIndex === 0 || submitting}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
              {step !== "review" ? (
                <Button type="button" onClick={next} disabled={!stepValid}>
                  Next <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={submitting || !user}>
                  <Rocket className="h-4 w-4 mr-1.5" />
                  {submitting ? "Launching…" : user ? "Launch Pool" : "Sign in to launch"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right">{value || "—"}</span>
    </div>
  );
}
