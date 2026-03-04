import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crosshair, Mail, Lock, User, ArrowRight, AtSign } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } else {
      // Validate username
      const trimmedUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
        toast.error("Username must be 3-20 characters (letters, numbers, underscores only)");
        setLoading(false);
        return;
      }

      // Check uniqueness
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmedUsername)
        .maybeSingle();

      if (existing) {
        toast.error("Username is already taken");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, username: trimmedUsername },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account!");
      }
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
          <p className="text-muted-foreground text-sm mt-2">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="gradient-card rounded-lg p-6 space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label className="text-sm text-muted-foreground">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="your_username"
                    className="bg-secondary border-border text-foreground pl-9"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">3-20 chars, letters, numbers, underscores</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your gamer tag"
                    className="bg-secondary border-border text-foreground pl-9"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-secondary border-border text-foreground pl-9"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Password</Label>
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
            className="w-full gradient-primary text-primary-foreground font-display font-bold text-base py-5"
          >
            {loading ? "Loading..." : isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {isLogin && (
            <div className="text-center">
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                Forgot password?
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
