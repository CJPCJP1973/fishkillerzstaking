import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wallet, Save } from "lucide-react";

export default function PaymentSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cashapp_tag: "",
    venmo_username: "",
    chime_handle: "",
    btc_address: "",
    btc_lightning: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("payment_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            cashapp_tag: data.cashapp_tag || "",
            venmo_username: data.venmo_username || "",
            chime_handle: data.chime_handle || "",
            btc_address: data.btc_address || "",
            btc_lightning: data.btc_lightning || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("payment_profiles")
      .update(form as any)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to save payment info");
    } else {
      toast.success("Payment info saved!");
    }
    setSaving(false);
  };

  if (loading) return null;

  const fields = [
    { key: "cashapp_tag", label: "CashApp ($Tag)", placeholder: "$YourTag" },
    { key: "venmo_username", label: "Venmo (@Username)", placeholder: "@YourVenmo" },
    { key: "chime_handle", label: "Chime Handle", placeholder: "YourChimeHandle" },
    { key: "btc_address", label: "Bitcoin Wallet", placeholder: "bc1q..." },
    { key: "btc_lightning", label: "BTC Lightning", placeholder: "lnbc..." },
  ] as const;

  return (
    <div className="gradient-card rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">Payment Settings</h2>
      </div>
      <p className="text-xs text-muted-foreground">Save your payout info so you can receive winnings.</p>
      <div className="space-y-3">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <Label className="text-sm text-muted-foreground">{label}</Label>
            <Input
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="bg-secondary border-border text-foreground"
            />
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground font-display font-bold">
        <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Payment Info"}
      </Button>
    </div>
  );
}
