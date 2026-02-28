import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crosshair, Lock } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Invalid reset link");
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! You're now signed in.");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Crosshair className="h-8 w-8 text-primary" />
            <span className="font-display text-2xl font-bold text-foreground">
              FISH<span className="text-primary glow-text-cyan">KILLERZ</span>
            </span>
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="gradient-card rounded-lg p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground text-center">Set New Password</h2>
          <div>
            <Label className="text-sm text-muted-foreground">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border text-foreground pl-9"
                required
                minLength={6}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-display font-bold"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
