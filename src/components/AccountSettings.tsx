import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Save } from "lucide-react";

export default function AccountSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, username, bio")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            display_name: data.display_name || "",
            username: data.username || "",
            bio: data.bio || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }
    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (form.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim(),
        username: form.username.trim().toLowerCase(),
        bio: form.bio.trim() || null,
      })
      .eq("user_id", user.id);

    if (error) {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        toast.error("Username is already taken");
      } else {
        toast.error("Failed to save account settings");
      }
    } else {
      toast.success("Account settings saved!");
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="gradient-card rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">Account Settings</h2>
      </div>
      <p className="text-xs text-muted-foreground">Update your display name, username, and bio.</p>
      <div className="space-y-3">
        <div>
          <Label className="text-sm text-muted-foreground">Display Name</Label>
          <Input
            value={form.display_name}
            onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            placeholder="Your display name"
            className="bg-secondary border-border text-foreground"
            maxLength={50}
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Username</Label>
          <Input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.replace(/\s/g, "") }))}
            placeholder="your_username"
            className="bg-secondary border-border text-foreground"
            maxLength={30}
          />
          <p className="text-[10px] text-muted-foreground mt-1">Lowercase, no spaces. This is your @handle.</p>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Tell us about yourself..."
            className="bg-secondary border-border text-foreground resize-none"
            maxLength={200}
            rows={3}
          />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground font-display font-bold">
        <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Account Settings"}
      </Button>
    </div>
  );
}
