import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { User, Trophy, DollarSign, TrendingUp, Shield, Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Profile() {
  const { user, isAdmin, isShooter, isBacker, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-lg mx-auto">
        <div className="gradient-card rounded-lg p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            {user.user_metadata?.display_name || user.email?.split("@")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mb-3">{user.email}</p>

          <div className="flex justify-center gap-2 mb-6">
            {isAdmin && <Badge className="bg-accent/20 text-accent border-accent/30">Admin</Badge>}
            {isShooter && <Badge className="bg-primary/20 text-primary border-primary/30">Shooter</Badge>}
            {isBacker && <Badge className="bg-success/20 text-success border-success/30">Backer</Badge>}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-secondary rounded-md p-3">
              <Trophy className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-display font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="bg-secondary rounded-md p-3">
              <DollarSign className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-display font-bold text-foreground">$0</p>
              <p className="text-xs text-muted-foreground">Staked</p>
            </div>
            <div className="bg-secondary rounded-md p-3">
              <TrendingUp className="h-4 w-4 text-success mx-auto mb-1" />
              <p className="text-lg font-display font-bold text-foreground">0%</p>
              <p className="text-xs text-muted-foreground">ROI</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
