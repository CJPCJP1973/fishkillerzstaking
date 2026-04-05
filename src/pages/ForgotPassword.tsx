import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crosshair, Mail, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useSEO({
    title: "Forgot Password | FishKillerz",
    description: "Reset your FishKillerz account password. Enter your email to receive a password reset link.",
    canonical: "/forgot-password",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Check your email for reset instructions");
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

        <div className="gradient-card rounded-lg p-6 space-y-4">
          {sent ? (
            <div className="text-center space-y-3">
              <Mail className="h-10 w-10 text-primary mx-auto" />
              <h2 className="font-display text-xl font-bold text-foreground">Check Your Email</h2>
              <p className="text-sm text-muted-foreground">We sent password reset instructions to {email}</p>
              <Link to="/auth">
                <Button variant="outline" className="border-primary/30 text-primary mt-2">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground text-center">Reset Password</h2>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground font-display font-bold"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="text-center">
                <Link to="/auth" className="text-sm text-primary hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
