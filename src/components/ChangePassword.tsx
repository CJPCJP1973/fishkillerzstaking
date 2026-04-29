import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";

export default function ChangePassword() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });

  const handleSave = async () => {
    if (!form.password || form.password.length < 12) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated!");
      setForm({ password: "", confirm: "" });
    }
    setSaving(false);
  };

  return (
    <div className="gradient-card rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">Change Password</h2>
      </div>
      <p className="text-xs text-muted-foreground">Enter a new password for your account.</p>
      <div className="space-y-3">
        <div>
          <Label className="text-sm text-muted-foreground">New Password</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            className="bg-secondary border-border text-foreground"
            minLength={12}
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Confirm Password</Label>
          <Input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            placeholder="••••••••"
            className="bg-secondary border-border text-foreground"
            minLength={12}
          />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground font-display font-bold">
        <Save className="h-4 w-4 mr-2" /> {saving ? "Updating..." : "Update Password"}
      </Button>
    </div>
  );
}
