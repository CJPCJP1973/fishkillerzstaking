import Layout from "@/components/Layout";
import { User, Trophy, DollarSign, TrendingUp } from "lucide-react";

export default function Profile() {
  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-lg mx-auto">
        <div className="gradient-card rounded-lg p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to track your stakes and sessions</p>

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

          <p className="text-xs text-muted-foreground">Authentication coming soon. Sign up to get started.</p>
        </div>
      </div>
    </Layout>
  );
}
